'use client';

import { useState } from 'react';

const CUISINE_COVER = {
    'Española':      { emoji: '🥘', bg: '#c2410c' },
    'Italiana':      { emoji: '🍝', bg: '#b91c1c' },
    'Japonesa':      { emoji: '🍣', bg: '#1e3a5f' },
    'Mexicana':      { emoji: '🌮', bg: '#b45309' },
    'Francesa':      { emoji: '🥐', bg: '#6d28d9' },
    'China':         { emoji: '🥟', bg: '#991b1b' },
    'India':         { emoji: '🍛', bg: '#92400e' },
    'Tailandesa':    { emoji: '🍜', bg: '#065f46' },
    'Mediterránea':  { emoji: '🫒', bg: '#0e7490' },
    'Americana':     { emoji: '🍔', bg: '#78350f' },
    'Peruana':       { emoji: '🦞', bg: '#9f1239' },
    'Árabe':         { emoji: '🧆', bg: '#5b21b6' },
    'Griega':        { emoji: '🫙', bg: '#075985' },
    'Coreana':       { emoji: '🥩', bg: '#991b1b' },
    'Vietnamita':    { emoji: '🍲', bg: '#14532d' },
    'Fusión':        { emoji: '✨', bg: '#4c1d95' },
    'Marisquería':   { emoji: '🦐', bg: '#0c4a6e' },
    'Asador':        { emoji: '🔥', bg: '#7c2d12' },
    'Vegetariana':   { emoji: '🥗', bg: '#166534' },
    'Tapas':         { emoji: '🍷', bg: '#881337' },
    'Otra':          { emoji: '🍽', bg: '#374151' },
};
const DEFAULT_COVER = { emoji: '🍽', bg: '#374151' };

function Avatar({ name, color }) {
    return (
        <span style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
            background: color + '33', border: `1px solid ${color}55`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color,
        }}>
            {name?.[0]?.toUpperCase() || '?'}
        </span>
    );
}

function RestaurantCard({ res }) {
    const [expanded, setExpanded] = useState(false);
    const cover = CUISINE_COVER[res.cuisine] || DEFAULT_COVER;
    const hasDesc = res.description && res.description.length > 0;
    const longDesc = hasDesc && res.description.length > 120;

    return (
        <article className="glass" style={{ borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Coloured header — photo if available, else cuisine gradient */}
            <div style={{
                background: res.photoUrl
                    ? 'rgba(0,0,0,0.4)'
                    : `linear-gradient(135deg, ${cover.bg}f0, ${cover.bg}a0)`,
                backgroundImage: res.photoUrl
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.62) 100%), url(${res.photoUrl})`
                    : undefined,
                backgroundSize: res.photoUrl ? 'cover' : undefined,
                backgroundPosition: res.photoUrl ? 'center' : undefined,
                minHeight: res.photoUrl ? '130px' : undefined,
                padding: '18px 18px 14px',
                position: 'relative', overflow: 'hidden',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px',
            }}>
                {/* Watermark emoji */}
                <span aria-hidden style={{
                    position: 'absolute', right: '10px', bottom: '-8px',
                    fontSize: '60px', opacity: 0.15, lineHeight: 1,
                    userSelect: 'none', pointerEvents: 'none',
                }}>{cover.emoji}</span>

                <div style={{ flex: 1, zIndex: 1 }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'white', margin: '0 0 3px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                        {res.name}
                    </h3>
                    {res.address && (
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.3 }}>
                            📍 {res.address.split(',').slice(0, 2).join(', ')}
                        </p>
                    )}
                </div>

                {res.url && (
                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{
                        zIndex: 1, flexShrink: 0,
                        background: 'rgba(255,255,255,0.18)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.28)',
                        color: 'white', fontSize: '12px', fontWeight: 500,
                        textDecoration: 'none', padding: '4px 10px', borderRadius: '980px',
                    }}>Web ↗</a>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '13px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {res.cuisine && (
                        <span style={{
                            fontSize: '12px', padding: '3px 10px', borderRadius: '980px',
                            background: cover.bg + '18', color: cover.bg,
                            fontWeight: 600, border: `1px solid ${cover.bg}33`,
                        }}>
                            {cover.emoji} {res.cuisine}
                        </span>
                    )}
                    {res.priceRange && (
                        <span style={{
                            fontSize: '12px', padding: '3px 10px', borderRadius: '980px',
                            border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 500,
                        }}>
                            {'€'.repeat(res.priceRange)}
                        </span>
                    )}
                </div>

                {/* Description */}
                {hasDesc && (
                    <div>
                        <p style={{
                            fontSize: '14px', color: 'var(--foreground)', margin: 0, lineHeight: 1.55,
                            display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 3,
                            WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
                        }}>
                            {res.description}
                        </p>
                        {longDesc && (
                            <button onClick={() => setExpanded(e => !e)} style={{
                                background: 'none', border: 'none', color: 'var(--accent)',
                                fontSize: '12px', cursor: 'pointer', padding: '3px 0', marginTop: '1px',
                                fontFamily: 'var(--sf-font)',
                            }}>
                                {expanded ? 'Ver menos ↑' : 'Ver más ↓'}
                            </button>
                        )}
                    </div>
                )}

                {/* Maps */}
                {(res.googleMapsUrl || res.appleMapsUrl) && (
                    <div style={{ display: 'flex', gap: '7px' }}>
                        {res.googleMapsUrl && (
                            <a href={res.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                padding: '8px', borderRadius: '10px', border: '1px solid var(--border)',
                                fontSize: '12px', color: 'var(--foreground)', textDecoration: 'none',
                                background: 'var(--background)', fontWeight: 500,
                            }}>🗺 Google</a>
                        )}
                        {res.appleMapsUrl && (
                            <a href={res.appleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                padding: '8px', borderRadius: '10px', border: '1px solid var(--border)',
                                fontSize: '12px', color: 'var(--foreground)', textDecoration: 'none',
                                background: 'var(--background)', fontWeight: 500,
                            }}>🍎 Apple</a>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar name={res.addedBy.name} color={cover.bg} />
                        {res.addedBy.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.65 }}>
                        {new Date(res.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>
        </article>
    );
}

export default function RestaurantGrid({ restaurants }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todos');

    const cuisines = ['Todos', ...Array.from(new Set(restaurants.map(r => r.cuisine).filter(Boolean)))];

    const filtered = restaurants.filter((r) => {
        const q = search.toLowerCase();
        const matchSearch = !q || (
            r.name.toLowerCase().includes(q) ||
            (r.cuisine?.toLowerCase().includes(q)) ||
            (r.address?.toLowerCase().includes(q)) ||
            (r.description?.toLowerCase().includes(q)) ||
            (r.addedBy?.name?.toLowerCase().includes(q))
        );
        const matchFilter = filter === 'Todos' || r.cuisine === filter;
        return matchSearch && matchFilter;
    });

    return (
        <>
            {/* Search + filter pills */}
            <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                    className="apple-input"
                    placeholder="🔍  Buscar por nombre, cocina, ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '480px' }}
                />

                {cuisines.length > 2 && (
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                        {cuisines.map(c => {
                            const active = filter === c;
                            const cover = CUISINE_COVER[c] || DEFAULT_COVER;
                            return (
                                <button key={c} onClick={() => setFilter(c)} style={{
                                    padding: '5px 13px', borderRadius: '980px', fontSize: '13px',
                                    border: `1px solid ${active ? cover.bg : 'var(--border)'}`,
                                    background: active ? cover.bg : 'transparent',
                                    color: active ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer', fontFamily: 'var(--sf-font)',
                                    fontWeight: active ? 600 : 400, transition: 'all 0.15s ease',
                                }}>
                                    {c === 'Todos' ? 'Todos' : `${cover.emoji} ${c}`}
                                </button>
                            );
                        })}
                    </div>
                )}

                {(search || filter !== 'Todos') && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        {filtered.length} restaurante{filtered.length !== 1 ? 's' : ''}
                        {filter !== 'Todos' && ` · ${filter}`}
                        {search && ` · "${search}"`}
                        {(search || filter !== 'Todos') && (
                            <button onClick={() => { setSearch(''); setFilter('Todos'); }} style={{
                                marginLeft: '8px', background: 'none', border: 'none',
                                color: 'var(--accent)', fontSize: '12px', cursor: 'pointer',
                                fontFamily: 'var(--sf-font)',
                            }}>
                                Limpiar ×
                            </button>
                        )}
                    </p>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="glass" style={{ padding: '60px 24px', borderRadius: '24px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🍽</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '17px', margin: 0 }}>
                        {search || filter !== 'Todos'
                            ? 'No hay resultados para esta búsqueda'
                            : '¡Sé el primero en añadir un restaurante!'}
                    </p>
                </div>
            ) : (
                <div className="restaurant-grid">
                    {filtered.map(res => <RestaurantCard key={res.id} res={res} />)}
                </div>
            )}
        </>
    );
}
