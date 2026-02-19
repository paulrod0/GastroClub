'use client';

import { useState } from 'react';
import { addRestaurant, fetchLocationInfo } from '../actions/restaurants';
import { useRouter } from 'next/navigation';

export default function AddRestaurant() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        address: '',
        description: '',
        cuisine: '',
        priceRange: '',
        lat: '',
        lng: ''
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
                // Only fill url/maps if not already set by user
                url: prev.url || info.website || prev.url || '',
            }));

            // Store maps URLs in hidden fields via state
            setMapsUrls({ google: info.googleMapsUrl, apple: info.appleMapsUrl });
        } else {
            setError('No pudimos encontrar la ubicación. Por favor, introdúcela manualmente.');
        }
        setFetching(false);
    };

    const [mapsUrls, setMapsUrls] = useState({ google: '', apple: '' });

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

    return (
        <div className="container section-padding">
            <div className="glass" style={{ padding: '40px', borderRadius: '24px', maxWidth: '600px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '32px' }}>Añadir Restaurante</h1>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>NOMBRE DEL RESTAURANTE</label>
                        <input
                            className="apple-input"
                            placeholder="Ej. El Celler de Can Roca"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>DIRECCIÓN</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                                style={{ background: 'var(--background)', color: 'var(--accent)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}
                                disabled={fetching}
                            >
                                {fetching ? 'Buscando...' : '✦ Autocompletar'}
                            </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '4px' }}>
                            Rellena automáticamente dirección, links de mapas y web.
                        </p>
                    </div>

                    {/* Maps links - shown after autocomplete */}
                    {(mapsUrls.google || mapsUrls.apple) && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {mapsUrls.google && (
                                <a
                                    href={mapsUrls.google}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                        fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none',
                                        background: 'var(--background)',
                                    }}
                                >
                                    🗺 Google Maps
                                </a>
                            )}
                            {mapsUrls.apple && (
                                <a
                                    href={mapsUrls.apple}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                        fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none',
                                        background: 'var(--background)',
                                    }}
                                >
                                    🍎 Apple Maps
                                </a>
                            )}
                        </div>
                    )}

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>WEB (OPCIONAL)</label>
                        <input
                            className="apple-input"
                            placeholder="https://..."
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>TIPO DE COCINA</label>
                        <select
                            className="apple-input"
                            value={formData.cuisine}
                            onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                            required
                        >
                            <option value="">Selecciona una categoría</option>
                            <option value="Española">Española</option>
                            <option value="Italiana">Italiana</option>
                            <option value="Japonesa">Japonesa</option>
                            <option value="Mexicana">Mexicana</option>
                            <option value="Francesa">Francesa</option>
                            <option value="China">China</option>
                            <option value="India">India</option>
                            <option value="Tailandesa">Tailandesa</option>
                            <option value="Mediterránea">Mediterránea</option>
                            <option value="Americana">Americana</option>
                            <option value="Peruana">Peruana</option>
                            <option value="Árabe">Árabe</option>
                            <option value="Griega">Griega</option>
                            <option value="Coreana">Coreana</option>
                            <option value="Vietnamita">Vietnamita</option>
                            <option value="Fusión">Fusión</option>
                            <option value="Marisquería">Marisquería</option>
                            <option value="Asador">Asador</option>
                            <option value="Vegetariana">Vegetariana</option>
                            <option value="Tapas">Tapas</option>
                            <option value="Otra">Otra</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>RANGO DE PRECIO</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[1, 2, 3, 4].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priceRange: level.toString() })}
                                    style={{
                                        flex: 1,
                                        padding: '12px 8px',
                                        borderRadius: '12px',
                                        border: `1px solid ${formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--border)'}`,
                                        background: formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--background)',
                                        color: formData.priceRange === level.toString() ? 'white' : 'var(--foreground)',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {'€'.repeat(level)}
                                </button>
                            ))}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '4px' }}>
                            € Económico · €€ Moderado · €€€ Alto · €€€€ Premium
                        </p>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                            POR QUÉ LO RECOMIENDAS <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span>
                        </label>
                        <textarea
                            className="apple-input"
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            placeholder="Cuéntanos sobre la comida, el ambiente..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {error && <p style={{ color: '#ff3b30', fontSize: '12px', textAlign: 'center' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button type="submit" className="apple-button" style={{ flex: 1, padding: '14px' }} disabled={loading}>
                            {loading ? 'Guardando...' : 'Añadir al grupo'}
                        </button>
                        <button type="button" onClick={() => router.back()} className="apple-button" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
