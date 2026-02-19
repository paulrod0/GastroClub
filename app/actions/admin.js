'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') {
        throw new Error('No autorizado. Solo el administrador puede realizar esta acción.');
    }
}

export async function getAllUsers() {
    await checkAdmin();
    return await prisma.user.findMany({
        include: { _count: { select: { restaurants: true } } },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getAllRestaurants() {
    await checkAdmin();
    return await prisma.restaurant.findMany({
        include: { addedBy: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function deleteUser(userId) {
    await checkAdmin();

    // Note: This will delete associated restaurants due to relation? 
    // SQLite doesn't always have cascaded deletes enabled by default in Prisma unless specified.
    // We'll delete them manually to be safe.
    try {
        await prisma.restaurant.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { error: 'Error al eliminar usuario' };
    }
}

export async function deleteRestaurant(id) {
    await checkAdmin();
    try {
        await prisma.restaurant.delete({ where: { id } });
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { error: 'Error al eliminar restaurante' };
    }
}
