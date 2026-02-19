'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RestaurantGrid({ restaurants }) {
    const [search, setSearch] = useState('');

    const filtered = restaurants.filter((r) => {
        const q = search.toLowerCase();
        return (
            r.name.toLowerCase().includes(q) ||
            (r.cuisine && r.cuisine.toLowerCase().includes(q)) ||
            (r.address && r.address.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q)) ||
            (r.addedBy?.name && r.addedBy.name.toLowerCase().includes(q))
        );
    });

    return (
        <>
            {/* Search bar */}
            <div style={{ marginBottom: '32px' }}>
                <input
                    className="apple-input"
                    placeholder="Buscar por nombre, cocina, ciudad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '480px', width: '100%' }}
                />
                {search && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', marginLeft: '4px' }}>
                        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &ldquo;{search}&rdquo;
                    </p>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="glass" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '19px' }}>
                        {search ? `No hay resultados para "${search}"` : 'Aún no hay restaurantes recomendados. ¡Sé el primero!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {filtered.map((res) => (
                        <div key={res.id} className="glass" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                <h3 style={{ fontSize: '20px', margin: 0 }}>{res.name}</h3>
                                {res.url && (
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '13px', flexShrink: 0 }}>Web ↗</a>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {res.cuisine && (
                                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '980px', background: 'var(--accent)', color: 'white' }}>{res.cuisine}</span>
                                )}
                                {res.priceRange && (
                                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '980px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{'€'.repeat(res.priceRange)}</span>
                                )}
                            </div>

                            {res.address && (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{res.address}</p>
                            )}

                            {res.description && (
                                <p style={{ fontSize: '15px', color: 'var(--foreground)', margin: 0 }}>{res.description}</p>
                            )}

                            {/* Maps links */}
                            {(res.googleMapsUrl || res.appleMapsUrl) && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    {res.googleMapsUrl && (
                                        <a
                                            href={res.googleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                padding: '8px', borderRadius: '10px', border: '1px solid var(--border)',
                                                fontSize: '12px', color: 'var(--foreground)', textDecoration: 'none',
                                                background: 'var(--background)',
                                            }}
                                        >
                                            🗺 Google Maps
                                        </a>
                                    )}
                                    {res.appleMapsUrl && (
                                        <a
                                            href={res.appleMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                padding: '8px', borderRadius: '10px', border: '1px solid var(--border)',
                                                fontSize: '12px', color: 'var(--foreground)', textDecoration: 'none',
                                                background: 'var(--background)',
                                            }}
                                        >
                                            🍎 Apple Maps
                                        </a>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span>Recomendado por {res.addedBy.name}</span>
                                <span>{new Date(res.createdAt).toLocaleDateString('es-ES')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
