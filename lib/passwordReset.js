import { createHash, randomBytes } from 'crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Only the hash is stored in the DB; the raw token travels in the email link.
export function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

export function createResetToken(now = new Date()) {
    const token = randomBytes(32).toString('base64url');
    return {
        token,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
    };
}
