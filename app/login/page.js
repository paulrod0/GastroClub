'use client';

import { useState } from 'react';
import { loginUser } from '../actions/auth';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await loginUser(email, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
            <div className="glass form-card" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>Bienvenido</h1>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                    Introduce tu email y contraseña para entrar.
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
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>CONTRASEÑA</label>
                        <input
                            type="password"
                            className="apple-input"
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="apple-button" style={{ marginTop: '16px', padding: '12px' }} disabled={loading}>
                        {loading ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    ¿No tienes cuenta? <a href="/register" style={{ color: 'var(--accent)' }}>Regístrate</a>
                </p>
            </div>
        </div>
    );
}
