'use client';

import { useState } from 'react';
import { requestPasswordReset } from '../actions/auth';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await requestPasswordReset(email);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
            <div className="glass form-card" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>¿Olvidaste tu contraseña?</h1>

                {sent ? (
                    <>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
                            Si existe una cuenta con <strong>{email}</strong>, te hemos enviado un email con un enlace para elegir una nueva contraseña. Caduca en 1 hora.
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            ¿No lo ves? Revisa la carpeta de spam.
                        </p>
                    </>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                            Escribe tu email y te enviaremos un enlace para restablecerla.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>EMAIL</label>
                                <input
                                    type="email"
                                    className="apple-input"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

                            <button type="submit" className="apple-button" style={{ marginTop: '16px', padding: '12px' }} disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar enlace'}
                            </button>
                        </form>
                    </>
                )}

                <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <a href="/login" style={{ color: 'var(--accent)' }}>Volver a iniciar sesión</a>
                </p>
            </div>
        </div>
    );
}
