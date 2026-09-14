import { describe, it, expect, beforeEach } from 'vitest';
import { requestPasswordReset, completePasswordReset } from './passwordResetFlow';
import { hashToken, RESET_TOKEN_TTL_MS } from './passwordReset';

// Minimal in-memory stand-in for the subset of Prisma used by the flow.
function fakeDb(users) {
    const tokens = [];
    return {
        tokens,
        users,
        user: {
            findUnique: async ({ where }) => users.find((u) => u.email === where.email) || null,
            update: async ({ where, data }) => {
                const u = users.find((x) => x.id === where.id);
                Object.assign(u, data);
                return u;
            },
        },
        passwordResetToken: {
            deleteMany: async ({ where }) => {
                for (let i = tokens.length - 1; i >= 0; i--) {
                    if ((where.userId && tokens[i].userId === where.userId) || (where.id && tokens[i].id === where.id)) tokens.splice(i, 1);
                }
            },
            create: async ({ data }) => {
                const t = { id: tokens.length + 1, ...data };
                tokens.push(t);
                return t;
            },
            findUnique: async ({ where }) => tokens.find((t) => t.tokenHash === where.tokenHash) || null,
        },
    };
}

const NOW = new Date('2026-09-14T10:00:00Z');
const BASE_URL = 'https://gastronomo-web.vercel.app';

let db, sent, deps;

beforeEach(() => {
    db = fakeDb([{ id: 7, email: 'ana@example.com', password: 'old-hash' }]);
    sent = [];
    deps = {
        db,
        sendEmail: async (msg) => { sent.push(msg); },
        hashPassword: async (p) => `hashed:${p}`,
        baseUrl: BASE_URL,
        now: () => NOW,
    };
});

describe('requestPasswordReset', () => {
    it('stores only the token hash and emails a reset link containing the raw token', async () => {
        const result = await requestPasswordReset('ana@example.com', deps);

        expect(result).toEqual({ success: true });
        expect(sent).toHaveLength(1);
        expect(sent[0].to).toBe('ana@example.com');
        const token = new URL(sent[0].resetUrl).searchParams.get('token');
        expect(sent[0].resetUrl.startsWith(`${BASE_URL}/reset-password?token=`)).toBe(true);
        expect(db.tokens).toHaveLength(1);
        expect(db.tokens[0]).toMatchObject({ userId: 7, tokenHash: hashToken(token) });
        expect(db.tokens[0].expiresAt.getTime()).toBe(NOW.getTime() + RESET_TOKEN_TTL_MS);
    });

    it('responds success without sending anything for an unknown email', async () => {
        const result = await requestPasswordReset('nadie@example.com', deps);
        expect(result).toEqual({ success: true });
        expect(sent).toHaveLength(0);
        expect(db.tokens).toHaveLength(0);
    });

    it('matches the email case-insensitively and trimmed', async () => {
        await requestPasswordReset('  Ana@Example.com ', deps);
        expect(sent).toHaveLength(1);
    });

    it('invalidates previous tokens so only the latest link works', async () => {
        await requestPasswordReset('ana@example.com', deps);
        await requestPasswordReset('ana@example.com', deps);
        expect(db.tokens).toHaveLength(1);
        expect(sent).toHaveLength(2);
    });
});

describe('completePasswordReset', () => {
    async function issueToken() {
        await requestPasswordReset('ana@example.com', deps);
        return new URL(sent[0].resetUrl).searchParams.get('token');
    }

    it('sets the new hashed password, consumes the token and returns the user id', async () => {
        const token = await issueToken();
        const result = await completePasswordReset(token, 'nueva-clave', deps);

        expect(result).toEqual({ success: true, userId: 7 });
        expect(db.users[0].password).toBe('hashed:nueva-clave');
        expect(db.tokens).toHaveLength(0);
    });

    it('rejects an unknown token', async () => {
        const result = await completePasswordReset('no-existe', 'nueva-clave', deps);
        expect(result.error).toMatch(/enlace/i);
        expect(db.users[0].password).toBe('old-hash');
    });

    it('rejects an expired token', async () => {
        const token = await issueToken();
        deps.now = () => new Date(NOW.getTime() + RESET_TOKEN_TTL_MS + 1);
        const result = await completePasswordReset(token, 'nueva-clave', deps);
        expect(result.error).toMatch(/caducado/i);
        expect(db.users[0].password).toBe('old-hash');
    });

    it('rejects a token that was already used', async () => {
        const token = await issueToken();
        await completePasswordReset(token, 'nueva-clave', deps);
        const result = await completePasswordReset(token, 'otra-clave', deps);
        expect(result.error).toBeDefined();
        expect(db.users[0].password).toBe('hashed:nueva-clave');
    });

    it('rejects passwords shorter than 6 characters without touching the token', async () => {
        const token = await issueToken();
        const result = await completePasswordReset(token, '12345', deps);
        expect(result.error).toMatch(/6 caracteres/);
        expect(db.tokens).toHaveLength(1);
    });
});
