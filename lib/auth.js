import { prisma } from './prisma';

export async function verifyMember(phone) {
    try {
        // Normalize: remove spaces, dashes, parentheses, dots
        let normalized = phone.replace(/[\s\-().]/g, '');

        // 0034xxxxxxxxx → +34xxxxxxxxx
        if (normalized.startsWith('0034')) {
            normalized = '+' + normalized.slice(2);
        }

        // Spanish number without country code (9 digits starting with 6,7,8,9)
        if (/^[6789]\d{8}$/.test(normalized)) {
            normalized = '+34' + normalized;
        }

        // Bare digits without + → add +
        if (!normalized.startsWith('+') && /^\d+$/.test(normalized)) {
            normalized = '+' + normalized;
        }

        // Try exact match first
        let member = await prisma.groupMember.findUnique({
            where: { phone: normalized },
        });

        // Fallback: match by last 9 digits (handles country code format differences)
        if (!member) {
            const last9 = normalized.replace(/\D/g, '').slice(-9);
            const candidates = await prisma.groupMember.findMany({
                where: { phone: { endsWith: last9 } },
            });
            member = candidates[0] || null;
        }

        return member || null;
    } catch (error) {
        console.error('Error verifying member:', error);
        return null;
    }
}
