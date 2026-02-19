'use client';

import { useState } from 'react';
import { addRestaurant, fetchLocationInfo } from '../actions/restaurants';
import { useRouter } from 'next/navigation';

export default function AddRestaurant() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [mapsUrls, setMapsUrls] = useState({ google: '', apple: '' });
    const [formData, setFormData] = useState({
        name: '', url: '', address: '', description: '',
        cuisine: '', priceRange: '', lat: '', lng: ''
    });
    const router = useRouter();

    const handleAutoLocation = async () => {
        if (!formData.name && !formData.address) {
            setError('Introduce un nombre o dirección para buscar la ubicación.');
            return;
        }
        setFetching(true);
        setError('');

        const query = formData.address || formData.name;
        const info = await fetchLocationInfo(query);

        if (info) {
            setFormData(prev => ({
                ...prev,
                address: info.address,
                lat: info.lat.toString(),
                lng: info.lng.toString(),
                url: prev.url || info.website || '',
            }));
            setMapsUrls({ google: info.googleMapsUrl, apple: info.appleMapsUrl });
        } else {
            setError('No pudimos encontrar la ubicación. Por favor, introdúcela manualmente.');
        }
        setFetching(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const fd = new FormData();
        Object.entries(formData).forEach(([key, value]) => fd.append(key, value));
        fd.append('googleMapsUrl', mapsUrls.google);
        fd.append('appleMapsUrl', mapsUrls.apple);

        try {
            const result = await addRestaurant(fd);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Error al guardar el restaurante. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const label = (text) => (
        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block', marginLeft: '2px' }}>
            {text}
        </label>
    );

    return (
        <div className="container section-padding">
            <div className="glass form-card" style={{ padding: '40px', borderRadius: '24px', maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '26px', marginBottom: '28px' }}>Añadir Restaurante</h1>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Name */}
                    <div>
                        {label('NOMBRE DEL RESTAURANTE')}
                        <input
                            className="apple-input"
                            placeholder="Ej. El Celler de Can Roca"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Address + autocomplete */}
                    <div>
                        {label('DIRECCIÓN')}
                        <div className="address-row" style={{ display: 'flex', gap: '8px' }}>
                            <input
                                className="apple-input"
                                placeholder="Calle, Ciudad..."
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={handleAutoLocation}
                                className="apple-button"
                                style={{ background: 'var(--background)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                                disabled={fetching}
                            >
                                {fetching ? 'Buscando...' : '✦ Autocompletar'}
                            </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '2px' }}>
                            Rellena automáticamente dirección, links de mapas y web.
                        </p>
                    </div>

                    {/* Maps preview links */}
                    {(mapsUrls.google || mapsUrls.apple) && (
                        <div className="maps-row" style={{ display: 'flex', gap: '8px' }}>
                            {mapsUrls.google && (
                                <a href={mapsUrls.google} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                    fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none',
                                    background: 'var(--background)',
                                }}>
                                    🗺 Google Maps
                                </a>
                            )}
                            {mapsUrls.apple && (
                                <a href={mapsUrls.apple} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                    fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none',
                                    background: 'var(--background)',
                                }}>
                                    🍎 Apple Maps
                                </a>
                            )}
                        </div>
                    )}

                    {/* Web */}
                    <div>
                        {label('WEB (OPCIONAL)')}
                        <input
                            className="apple-input"
                            placeholder="https://..."
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    {/* Cuisine */}
                    <div>
                        {label('TIPO DE COCINA')}
                        <select
                            className="apple-input"
                            value={formData.cuisine}
                            onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                            required
                        >
                            <option value="">Selecciona una categoría</option>
                            {['Española','Italiana','Japonesa','Mexicana','Francesa','China','India',
                              'Tailandesa','Mediterránea','Americana','Peruana','Árabe','Griega',
                              'Coreana','Vietnamita','Fusión','Marisquería','Asador','Vegetariana',
                              'Tapas','Otra'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price range */}
                    <div>
                        {label('RANGO DE PRECIO')}
                        <div className="price-buttons" style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priceRange: level.toString() })}
                                    style={{
                                        flex: 1, padding: '12px 8px', borderRadius: '12px',
                                        border: `1px solid ${formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--border)'}`,
                                        background: formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--background)',
                                        color: formData.priceRange === level.toString() ? 'white' : 'var(--foreground)',
                                        cursor: 'pointer', fontSize: '16px', fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'var(--sf-font)',
                                    }}
                                >
                                    {'€'.repeat(level)}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '2px' }}>
                            € Económico · €€ Moderado · €€€ Alto · €€€€ Premium
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        {label('POR QUÉ LO RECOMIENDAS')}
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>(opcional)</span>
                        <textarea
                            className="apple-input"
                            style={{ minHeight: '90px', resize: 'vertical', marginTop: '6px' }}
                            placeholder="Cuéntanos sobre la comida, el ambiente..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {error && (
                        <p style={{ color: '#ff3b30', fontSize: '13px', textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(255,59,48,0.08)' }}>
                            {error}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button type="submit" className="apple-button" style={{ flex: 1, padding: '14px' }} disabled={loading}>
                            {loading ? 'Guardando...' : 'Añadir al grupo'}
                        </button>
                        <button type="button" onClick={() => router.back()} className="apple-button"
                            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '14px 20px' }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
