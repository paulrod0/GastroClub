'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyMember } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

function getResend() {
    return new Resend(process.env.RESEND_API_KEY);
}

// Phase 1: Validate data, send verification code
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
        const existingPhone = await prisma.user.findUnique({ where: { phone } });
        if (existingPhone) {
            return { error: 'Este número ya está registrado. Por favor, inicia sesión.' };
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any previous codes for this email
        await prisma.verificationCode.deleteMany({ where: { email } });

        // Store verification code (expires in 10 minutes)
        await prisma.verificationCode.create({
            data: {
                email,
                phone,
                code,
                name,
                password: hashedPassword,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Send email with code
        const { error: emailError } = await getResend().emails.send({
            from: process.env.FROM_EMAIL || 'Gastrónomos <onboarding@resend.dev>',
            to: email,
            subject: 'Tu código de verificación - Gastrónomos',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
                    <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Gastrónomos</h1>
                    <p style="color: #86868b; margin-bottom: 32px;">Código de verificación</p>
                    <div style="background: #f5f5f7; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                        <p style="font-size: 40px; font-weight: 700; letter-spacing: 8px; margin: 0;">${code}</p>
                    </div>
                    <p style="color: #86868b; font-size: 14px; text-align: center;">
                        Este código expira en 10 minutos.<br/>
                        Si no solicitaste este código, ignora este email.
                    </p>
                </div>
            `,
        });

        if (emailError) {
            console.error('Email send error:', emailError);
            return { error: 'No pudimos enviar el código de verificación. Inténtalo de nuevo.' };
        }

        return { step: 'verify' };
    } catch (error) {
        console.error('Registration initiation error:', error);
        return { error: 'Ocurrió un error durante el registro.' };
    }
}

// Phase 2: Verify code and create user
export async function confirmRegistration(email, code) {
    try {
        // Find the most recent non-expired verification code for this email
        const verification = await prisma.verificationCode.findFirst({
            where: {
                email,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!verification) {
            return { error: 'El código ha expirado. Solicita uno nuevo.' };
        }

        if (verification.code !== code) {
            return { error: 'Código incorrecto. Revisa tu email e inténtalo de nuevo.' };
        }

        // Create the user
        const user = await prisma.user.create({
            data: {
                name: verification.name,
                email: verification.email,
                password: verification.password,
                phone: verification.phone,
                role: verification.phone === '+34650068486' ? 'ADMIN' : 'USER',
            },
        });

        // Clean up verification codes for this email
        await prisma.verificationCode.deleteMany({ where: { email } });

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
        console.error('Registration confirmation error:', error);
        if (error.code === 'P2002') {
            return { error: 'Este email o teléfono ya está registrado.' };
        }
        return { error: 'Ocurrió un error al confirmar el registro.' };
    }
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
