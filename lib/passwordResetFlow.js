import { createResetToken, hashToken } from './passwordReset';

// Pure flow logic; the server actions in app/actions/auth.js inject
// prisma, the email sender and bcrypt so this can be tested in isolation.

export async function requestPasswordReset(rawEmail, { db, sendEmail, baseUrl, now = () => new Date() }) {
    const email = rawEmail.trim().toLowerCase();
    const user = await db.user.findUnique({ where: { email } });

    // Same response whether or not the account exists, so the form
    // can't be used to enumerate registered emails.
    if (!user) return { success: true };

    const { token, tokenHash, expiresAt } = createResetToken(now());
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

    await sendEmail({
        to: user.email,
        resetUrl: `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`,
    });

    return { success: true };
}

export async function completePasswordReset(token, newPassword, { db, hashPassword, now = () => new Date() }) {
    if (!newPassword || newPassword.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token || '') } });
    if (!record) {
        return { error: 'Este enlace no es válido. Solicita uno nuevo.' };
    }
    if (record.expiresAt.getTime() <= now().getTime()) {
        await db.passwordResetToken.deleteMany({ where: { id: record.id } });
        return { error: 'Este enlace ha caducado. Solicita uno nuevo.' };
    }

    await db.user.update({ where: { id: record.userId }, data: { password: await hashPassword(newPassword) } });
    await db.passwordResetToken.deleteMany({ where: { userId: record.userId } });

    return { success: true, userId: record.userId };
}
