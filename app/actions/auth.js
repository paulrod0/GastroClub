'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyMember } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Registro directo: verifica teléfono en el grupo y crea la cuenta
export async function initiateRegistration(name, email, password, phone) {
    // Verify phone is in the WhatsApp group
    const member = await verifyMember(phone);
    if (!member) {
        return { error: 'Tu número de teléfono no está en la lista de miembros del grupo.' };
    }

    try {
        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return { error: 'Este email ya está registrado. Por favor, inicia sesión.' };
        }

        // Check if phone already exists
        const existingPhone = await prisma.user.findFirst({ where: { phone } });
        if (existingPhone) {
            return { error: 'Este número ya está registrado. Por favor, inicia sesión.' };
        }

        // Hash password and create user directly
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: phone.replace(/\s/g, '') === '+34650068486' ? 'ADMIN' : 'USER',
            },
        });

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('session', user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Registration error:', error?.message || error);
        if (error.code === 'P2002') {
            return { error: 'Este email o teléfono ya está registrado.' };
        }
        return { error: `Error durante el registro: ${error?.message || 'Inténtalo de nuevo.'}` };
    }
}

// Kept for backwards compatibility (no longer used)
export async function confirmRegistration(email, code) {
    return { error: 'Este método ya no se usa.' };
}

export async function loginUser(email, password) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: 'Email o contraseña incorrectos.' };
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return { error: 'Email o contraseña incorrectos.' };
        }

        const cookieStore = await cookies();
        cookieStore.set('session', user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Ocurrió un error al iniciar sesión.' };
    }
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(sessionId) },
        });
        return user;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}
