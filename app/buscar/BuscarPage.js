'use client';

import { useState } from 'react';
import Link from 'next/link';
import { chatSearch } from '../actions/search';

// ── Cuisine covers (same as RestaurantGrid) ───────────────────────────────────
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

// ── Quick suggestion chips ────────────────────────────────────────────────────
const SUGGESTIONS = [
    { label: '🍣 Japonés en Madrid', query: 'japonés en Madrid' },
    { label: '🌿 Sin gluten',          query: 'sin gluten' },
    { label: '🌅 Terraza con vistas',  query: 'terraza con vistas' },
    { label: '💑 Romántico para dos',  query: 'romántico para dos' },
    { label: '🦐 Marisquería',         query: 'marisquería' },
    { label: '🥗 Vegano',              query: 'vegano' },
    { label: '💶 Precio bajo',         query: 'precio bajo' },
    { label: '👨‍👩‍👧 Cena en familia',  query: 'cena en familia' },
];

// ── Search result card ────────────────────────────────────────────────────────
function SearchCard({ restaurant, source }) {
    const cuisine = restaurant.cuisineLabel || restaurant.cuisine;
    const cover = CUISINE_COVER[cuisine] || DEFAULT_COVER;
    const photoUrl = restaurant.photoUrl;

    return (
        <article className="glass" style={{ borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header: photo or gradient */}
            <div style={{
                background: photoUrl ? 'rgba(0,0,0,0.4)' : `linear-gradient(135deg, ${cover.bg}f0, ${cover.bg}a0)`,
                backgroundImage: photoUrl
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.62) 100%), url(${photoUrl})`
                    : undefined,
                backgroundSize: photoUrl ? 'cover' : undefined,
                backgroundPosition: photoUrl ? 'center' : undefined,
                minHeight: '100px',
                padding: '12px 14px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Watermark emoji when no photo */}
                {!photoUrl && (
                    <span aria-hidden style={{
                        position: 'absolute', right: '8px', bottom: '-6px',
                        fontSize: '52px', opacity: 0.15, lineHeight: 1,
                        userSelect: 'none', pointerEvents: 'none',
                    }}>{cover.emoji}</span>
                )}
                <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.2, zIndex: 1 }}>
                    {restaurant.name}
                </h3>
                {restaurant.address && (
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', margin: '3px 0 0', lineHeight: 1.3, zIndex: 1 }}>
                        📍 {restaurant.address.split(',').slice(0, 2).join(', ')}
                    </p>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {cuisine && (
                        <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '980px',
                            background: cover.bg + '18', color: cover.bg,
                            fontWeight: 600, border: `1px solid ${cover.bg}33`,
                        }}>
                            {cover.emoji} {cuisine}
                        </span>
                    )}
                    {(restaurant.priceRange || restaurant.priceLevel) && (
                        <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '980px',
                            border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 500,
                        }}>
                            {'€'.repeat(restaurant.priceRange || restaurant.priceLevel)}
                        </span>
                    )}
                    {restaurant.rating && (
                        <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                            ★ {restaurant.rating.toFixed(1)}
                            {restaurant.ratingCount && (
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                                    {' '}({restaurant.ratingCount >= 1000
                                        ? (restaurant.ratingCount / 1000).toFixed(1) + 'k'
                                        : restaurant.ratingCount})
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {/* Description (DB results only) */}
                {source === 'db' && restaurant.description && (
                    <p style={{ fontSize: '13px', color: 'var(--foreground)', margin: 0, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {restaurant.description}
                    </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                    {restaurant.googleMapsUrl && (
                        <a href={restaurant.googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
                            flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: '10px',
                            border: '1px solid var(--border)', fontSize: '12px',
                            color: 'var(--foreground)', textDecoration: 'none', background: 'var(--background)',
                        }}>🗺 Maps</a>
                    )}
                    {source === 'google' && (
                        <Link href="/add" style={{
                            flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: '10px',
                            background: 'var(--accent)', color: 'white', fontSize: '12px',
                            textDecoration: 'none', fontWeight: 500,
                        }}>+ Añadir</Link>
                    )}
                    {source === 'db' && (
                        <Link href="/dashboard" style={{
                            flex: 1, textAlign: 'center', padding: '7px 4px', borderRadius: '10px',
                            border: '1px solid var(--border)', color: 'var(--accent)',
                            fontSize: '12px', textDecoration: 'none',
                        }}>Ver grupo</Link>
                    )}
                </div>
            </div>
        </article>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, count }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>{emoji}</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h2>
            <span style={{
                fontSize: '12px', padding: '2px 10px', borderRadius: '980px',
                background: 'var(--border)', color: 'var(--text-secondary)', fontWeight: 500,
            }}>{count}</span>
        </div>
    );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: '14px', height: '14px',
            border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BuscarPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null); // null = no search yet
    const [error, setError] = useState('');

    const handleSearch = async (q) => {
        const searchQuery = (q ?? query).trim();
        if (!searchQuery) return;
        setLoading(true);
        setError('');
        setResults(null);
        try {
            const data = await chatSearch(searchQuery);
            setResults(data);
        } catch {
            setError('Error al buscar. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleChip = (chipQuery) => {
        setQuery(chipQuery);
        handleSearch(chipQuery);
    };

    const noResults = results && results.group.length === 0 && results.external.length === 0;

    return (
        <div className="container section-padding">
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                        Buscar restaurantes
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Describe lo que buscas: tipo de cocina, ciudad, ambiente, dieta especial...
                    </p>
                </div>

                {/* Search input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        className="apple-input"
                        placeholder="Ej: japonés en Madrid, terraza con vistas, sin gluten..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="apple-button"
                        onClick={() => handleSearch()}
                        disabled={loading || !query.trim()}
                        style={{ padding: '12px 20px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        {loading ? <Spinner /> : '→ Buscar'}
                    </button>
                </div>

                {/* Suggestion chips */}
                {!results && !loading && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s.query}
                                onClick={() => handleChip(s.query)}
                                style={{
                                    padding: '6px 14px', borderRadius: '980px', fontSize: '13px',
                                    border: '1px solid var(--border)', background: 'var(--background)',
                                    color: 'var(--text-secondary)', cursor: 'pointer',
                                    fontFamily: 'var(--sf-font)', transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>🔍</div>
                        <p style={{ fontSize: '15px' }}>Buscando en el grupo y en Google...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ color: '#ff3b30', fontSize: '13px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,59,48,0.08)' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* No results */}
                {noResults && (
                    <div className="glass" style={{ padding: '48px 24px', borderRadius: '20px', textAlign: 'center' }}>
                        <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🤷</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: 0 }}>
                            Sin resultados para <strong>"{query}"</strong>
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
                            Prueba con otro término: cocina, ciudad o característica
                        </p>
                    </div>
                )}

                {/* Results */}
                {results && !noResults && (
                    <>
                        {/* Group results */}
                        <div style={{ marginBottom: '36px' }}>
                            <SectionHeader emoji="👥" title="En vuestro grupo" count={results.group.length} />
                            {results.group.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                                    Ningún restaurante del grupo coincide con esta búsqueda.
                                </p>
                            ) : (
                                <div className="restaurant-grid">
                                    {results.group.map((r) => (
                                        <SearchCard key={r.id} restaurant={r} source="db" />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* External results */}
                        <div>
                            <SectionHeader emoji="🌍" title="Otros en Google" count={results.external.length} />
                            {results.external.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                                    Sin resultados externos para esta búsqueda.
                                </p>
                            ) : (
                                <div className="restaurant-grid">
                                    {results.external.map((r, i) => (
                                        <SearchCard key={i} restaurant={r} source="google" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
