'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { useState } from 'react';

export default function Navbar({ user }) {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path) => pathname === path;

    const linkStyle = (path) => ({
        color: isActive(path) ? 'var(--foreground)' : 'var(--text-secondary)',
        textDecoration: 'none',
        fontWeight: isActive(path) ? 500 : 400,
        transition: 'color 0.2s',
        fontSize: '14px',
    });

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
    };

    return (
        <>
            <nav className="glass" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
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
                    {/* Logo */}
                    <Link href="/" style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        color: 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '-0.022em',
                    }}>
                        <span>🍽️</span> Gastrónomos
                    </Link>

                    {/* Desktop links */}
                    <div className="nav-links" style={{ display: 'flex', gap: '24px', fontSize: '13px', alignItems: 'center' }}>
                        {user ? (
                            <>
                                {user.role === 'ADMIN' && (
                                    <Link href="/admin" style={linkStyle('/admin')}>Admin</Link>
                                )}
                                <Link href="/dashboard" style={linkStyle('/dashboard')}>Restaurantes</Link>
                                <Link href="/add" style={linkStyle('/add')}>Añadir</Link>
                                <button onClick={handleLogout} style={{
                                    background: 'none', border: 'none',
                                    color: 'var(--text-secondary)', fontSize: '13px',
                                    cursor: 'pointer', padding: '4px 0',
                                    fontFamily: 'var(--sf-font)',
                                }}>Salir</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" style={linkStyle('/login')}>Entrar</Link>
                                <Link href="/register" className="apple-button" style={{ fontSize: '12px', padding: '5px 14px' }}>
                                    Unirse
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile bottom tab bar */}
            {user && (
                <nav style={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    height: '56px',
                    background: 'var(--surface)',
                    backdropFilter: 'saturate(180%) blur(20px)',
                    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                    borderTop: '1px solid var(--border)',
                    zIndex: 1000,
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }} className="mobile-tabbar">
                    <Link href="/dashboard" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        textDecoration: 'none', color: isActive('/dashboard') ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '10px', fontWeight: isActive('/dashboard') ? 600 : 400,
                        minWidth: '60px',
                    }}>
                        <span style={{ fontSize: '22px' }}>🍽</span>
                        Restaurantes
                    </Link>
                    <Link href="/add" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        textDecoration: 'none', color: isActive('/add') ? 'var(--accent)' : 'var(--text-secondary)',
                        fontSize: '10px', fontWeight: isActive('/add') ? 600 : 400,
                        minWidth: '60px',
                    }}>
                        <span style={{ fontSize: '22px' }}>➕</span>
                        Añadir
                    </Link>
                    {user.role === 'ADMIN' && (
                        <Link href="/admin" style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            textDecoration: 'none', color: isActive('/admin') ? 'var(--accent)' : 'var(--text-secondary)',
                            fontSize: '10px', fontWeight: isActive('/admin') ? 600 : 400,
                            minWidth: '60px',
                        }}>
                            <span style={{ fontSize: '22px' }}>⚙️</span>
                            Admin
                        </Link>
                    )}
                    <button onClick={handleLogout} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', fontSize: '10px',
                        fontFamily: 'var(--sf-font)', minWidth: '60px',
                        padding: 0,
                    }}>
                        <span style={{ fontSize: '22px' }}>👤</span>
                        Salir
                    </button>
                </nav>
            )}
        </>
    );
}
