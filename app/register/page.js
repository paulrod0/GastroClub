'use client';

import { useState } from 'react';
import { initiateRegistration } from '../actions/auth';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            const result = await initiateRegistration(name, email, password, phone);

            if (result?.error) {
                setError(result.error);
            } else if (result?.success) {
                router.push('/dashboard');
            } else {
                setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
            }
        } catch (err) {
            console.error('Register error:', err);
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
            <div className="glass form-card" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>Únete al grupo</h1>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                    Verificaremos que eres miembro del grupo de WhatsApp.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>NOMBRE</label>
                        <input
                            type="text"
                            className="apple-input"
                            placeholder="Tu nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>TELÉFONO</label>
                        <input
                            type="tel"
                            className="apple-input"
                            placeholder="+34 600 000 000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '4px' }}>
                            Debe coincidir con tu número del grupo de WhatsApp.
                        </p>
                    </div>

                    {error && <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="apple-button" style={{ marginTop: '16px', padding: '12px' }} disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    ¿Ya tienes cuenta? <a href="/login" style={{ color: 'var(--accent)' }}>Inicia sesión</a>
                </p>
            </div>
        </div>
    );
}
