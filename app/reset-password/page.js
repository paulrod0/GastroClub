'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '../actions/auth';

function ResetPasswordForm() {
    const token = useSearchParams().get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        const result = await resetPassword(token, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    if (!token) {
        return (
            <>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
                    Este enlace no es válido.
                </p>
                <p style={{ textAlign: 'center', fontSize: '14px' }}>
                    <a href="/forgot-password" style={{ color: 'var(--accent)' }}>Solicitar uno nuevo</a>
                </p>
            </>
        );
    }

    return (
        <>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                Elige tu nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>NUEVA CONTRASEÑA</label>
                    <input
                        type="password"
                        className="apple-input"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>REPITE LA CONTRASEÑA</label>
                    <input
                        type="password"
                        className="apple-input"
                        placeholder="Repite la contraseña"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>
                        {error}{' '}
                        {/enlace/.test(error) && <a href="/forgot-password" style={{ color: 'var(--accent)' }}>Solicitar otro</a>}
                    </p>
                )}

                <button type="submit" className="apple-button" style={{ marginTop: '16px', padding: '12px' }} disabled={loading}>
                    {loading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
            </form>
        </>
    );
}

export default function ResetPassword() {
    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
            <div className="glass form-card" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>Nueva contraseña</h1>
                <Suspense>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
