import { prisma } from './prisma';

export async function verifyMember(phone) {
    try {
        const normalizedPhone = phone.replace(/\s+/g, '');

        const member = await prisma.groupMember.findUnique({
            where: { phone: normalizedPhone },
        });

        return member || null;
    } catch (error) {
        console.error('Error verifying member:', error);
        return null;
    }
}
