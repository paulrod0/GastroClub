'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';

export default function Navbar({ user }) {
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <nav className="glass" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '44px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
            }}>
                <Link href="/" style={{
                    fontSize: '19px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'var(--foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    letterSpacing: '-0.022em'
                }}>
                    <span>🍽️</span> Gastrónomos
                </Link>

                <div style={{ display: 'flex', gap: '24px', fontSize: '12px', alignItems: 'center' }}>
                    {user ? (
                        <>
                            {user.role === 'ADMIN' && (
                                <Link href="/admin" style={{
                                    color: isActive('/admin') ? 'var(--foreground)' : 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    fontWeight: isActive('/admin') ? 500 : 400,
                                    transition: 'color 0.2s'
                                }}>Admin</Link>
                            )}
                            <Link href="/dashboard" style={{
                                color: isActive('/dashboard') ? 'var(--foreground)' : 'var(--text-secondary)',
                                textDecoration: 'none',
                                fontWeight: isActive('/dashboard') ? 500 : 400,
                                transition: 'color 0.2s'
                            }}>Restaurantes</Link>
                            <Link href="/add" style={{
                                color: isActive('/add') ? 'var(--foreground)' : 'var(--text-secondary)',
                                textDecoration: 'none',
                                fontWeight: isActive('/add') ? 500 : 400,
                                transition: 'color 0.2s'
                            }}>Añadir</Link>
                            <button onClick={() => logout()} style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                padding: '4px 0'
                            }}>Salir</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" style={{
                                color: isActive('/login') ? 'var(--foreground)' : 'var(--text-secondary)',
                                textDecoration: 'none',
                                fontWeight: isActive('/login') ? 500 : 400,
                                transition: 'color 0.2s'
                            }}>Entrar</Link>
                            <Link href="/register" className="apple-button" style={{
                                fontSize: '11px',
                                padding: '4px 12px',
                            }}>Unirse</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
