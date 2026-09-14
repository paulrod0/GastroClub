import { Resend } from 'resend';

function getResend() {
    return new Resend(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
    const { error } = await getResend().emails.send({
        from: process.env.FROM_EMAIL || 'Gastrónomos <onboarding@resend.dev>',
        to,
        subject: 'Restablece tu contraseña - Gastrónomos',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Gastrónomos</h1>
                <p style="color: #86868b; margin-bottom: 32px;">Restablecer contraseña</p>
                <p style="font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
                    Hemos recibido una solicitud para cambiar la contraseña de tu cuenta.
                    Pulsa el botón para elegir una nueva:
                </p>
                <p style="text-align: center; margin-bottom: 24px;">
                    <a href="${resetUrl}" style="display: inline-block; background: #0071e3; color: #fff; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 980px;">
                        Restablecer contraseña
                    </a>
                </p>
                <p style="color: #86868b; font-size: 14px; text-align: center;">
                    Este enlace caduca en 1 hora.<br/>
                    Si no lo has solicitado, ignora este email; tu contraseña no cambiará.
                </p>
            </div>
        `,
    });

    if (error) {
        throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
    }
}
