import { describe, it, expect } from 'vitest';
import { createResetToken, hashToken, RESET_TOKEN_TTL_MS } from './passwordReset';

describe('createResetToken', () => {
    it('returns a long random url-safe token', () => {
        const { token } = createResetToken();
        expect(token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
        expect(createResetToken().token).not.toBe(token);
    });

    it('returns the sha256 hash of the token, not the token itself', () => {
        const { token, tokenHash } = createResetToken();
        expect(tokenHash).toBe(hashToken(token));
        expect(tokenHash).not.toBe(token);
        expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('expires one hour after creation', () => {
        const now = new Date('2026-09-14T10:00:00Z');
        const { expiresAt } = createResetToken(now);
        expect(RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
        expect(expiresAt.toISOString()).toBe('2026-09-14T11:00:00.000Z');
    });
});

describe('hashToken', () => {
    it('is deterministic', () => {
        expect(hashToken('abc')).toBe(hashToken('abc'));
        expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });
});
