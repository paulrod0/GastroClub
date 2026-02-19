'use client';

import { useState } from 'react';
import { initiateRegistration, confirmRegistration } from '../actions/auth';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [step, setStep] = useState('form'); // 'form' or 'verify'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            setLoading(false);
            return;
        }

        const result = await initiateRegistration(name, email, password, phone);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else if (result.step === 'verify') {
            setStep('verify');
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await confirmRegistration(email, code);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else if (result.success) {
            router.push('/dashboard');
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        setCode('');

        const result = await initiateRegistration(name, email, password, phone);

        if (result.error) {
            setError(result.error);
        } else {
            setError('');
        }
        setLoading(false);
    };

    // Step 2: Verification code input
    if (step === 'verify') {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Revisa tu email</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Hemos enviado un código de 6 dígitos a
                        </p>
                        <p style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 600 }}>
                            {email}
                        </p>
                    </div>

                    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '4px' }}>CÓDIGO DE VERIFICACIÓN</label>
                            <input
                                type="text"
                                className="apple-input"
                                placeholder="000000"
                                value={code}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setCode(val);
                                }}
                                required
                                maxLength={6}
                                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 600 }}
                                autoFocus
                            />
                        </div>

                        {error && <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

                        <button
                            type="submit"
                            className="apple-button"
                            style={{ marginTop: '8px', padding: '12px' }}
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? 'Verificando...' : 'Confirmar registro'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button
                            onClick={handleResendCode}
                            disabled={loading}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                fontSize: '14px',
                            }}
                        >
                            Reenviar código
                        </button>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button
                            onClick={() => { setStep('form'); setCode(''); setError(''); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            ← Volver al formulario
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 1: Registration form
    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '8px', textAlign: 'center' }}>Únete al grupo</h1>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                    Verificaremos tu número y email para acceder.
                </p>

                <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                            placeholder="+34..."
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
                        {loading ? 'Enviando código...' : 'Enviar código de verificación'}
                    </button>
                </form>

                <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    ¿Ya tienes cuenta? <a href="/login" style={{ color: 'var(--accent)' }}>Inicia sesión</a>
                </p>
            </div>
        </div>
    );
}
