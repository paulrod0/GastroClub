'use client';

import { useState, useRef } from 'react';
import { addRestaurant, extractFromUrl, searchRestaurantByName } from '../actions/restaurants';
import { useRouter } from 'next/navigation';

const CUISINES = [
    'Española','Italiana','Japonesa','Mexicana','Francesa','China','India',
    'Tailandesa','Mediterránea','Americana','Peruana','Árabe','Griega',
    'Coreana','Vietnamita','Fusión','Marisquería','Asador','Vegetariana',
    'Tapas','Otra'
];

export default function AddRestaurant() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Smart search
    const [searchName, setSearchName] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searching, setSearching] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [searchError, setSearchError] = useState('');
    const [filled, setFilled] = useState(false);

    // Paste URL
    const [pasteUrl, setPasteUrl] = useState('');
    const [pasteLoading, setPasteLoading] = useState(false);
    const [pasteError, setPasteError] = useState('');

    // Form
    const [mapsUrls, setMapsUrls] = useState({ google: '', apple: '' });
    const [formData, setFormData] = useState({
        name: '', url: '', address: '', description: '',
        cuisine: '', priceRange: '', lat: '', lng: '',
        photoUrl: '',
    });

    const router = useRouter();
    const formRef = useRef(null);

    // ── Smart search ──────────────────────────────────────────────────
    const handleSearch = async () => {
        if (!searchName.trim()) return;
        setSearching(true);
        setSearchError('');
        setCandidates([]);
        try {
            const results = await searchRestaurantByName(searchName, searchCity);
            if (!results || results.length === 0) {
                setSearchError('No encontramos resultados. Prueba con otro nombre o ciudad, o rellena manualmente.');
            } else {
                setCandidates(results);
            }
        } catch {
            setSearchError('Error al buscar. Inténtalo de nuevo.');
        } finally {
            setSearching(false);
        }
    };

    const handleSelectCandidate = (candidate) => {
        setFormData(prev => ({
            ...prev,
            name: candidate.name || prev.name,
            address: candidate.address || prev.address,
            url: candidate.website || prev.url,
            lat: candidate.lat?.toString() || prev.lat,
            lng: candidate.lng?.toString() || prev.lng,
            cuisine: candidate.cuisineLabel || prev.cuisine,
            priceRange: candidate.priceLevel?.toString() || prev.priceRange,
            photoUrl: candidate.photoUrl || prev.photoUrl,
        }));
        setMapsUrls({ google: candidate.googleMapsUrl || '', apple: candidate.appleMapsUrl || '' });
        setCandidates([]);
        setFilled(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    // ── Paste URL ─────────────────────────────────────────────────────
    const handlePasteUrl = async () => {
        if (!pasteUrl.trim()) return;
        setPasteLoading(true);
        setPasteError('');
        try {
            const info = await extractFromUrl(pasteUrl.trim());
            if (!info) { setPasteError('No se pudo extraer información. Rellena manualmente.'); return; }
            setFormData(prev => ({
                ...prev,
                name: info.name || prev.name,
                address: info.address || prev.address,
                url: info.website || prev.url,
                description: info.description || prev.description,
                lat: info.lat?.toString() || prev.lat,
                lng: info.lng?.toString() || prev.lng,
            }));
            setMapsUrls({ google: info.googleMapsUrl || '', apple: info.appleMapsUrl || '' });
            setPasteUrl('');
            setFilled(true);
        } catch {
            setPasteError('Error al procesar el enlace.');
        } finally {
            setPasteLoading(false);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
        fd.append('googleMapsUrl', mapsUrls.google);
        fd.append('appleMapsUrl', mapsUrls.apple);
        try {
            const result = await addRestaurant(fd);
            if (result?.error) { setError(result.error); }
            else { setSuccess(true); setTimeout(() => router.push('/dashboard'), 1200); }
        } catch {
            setError('Error al guardar. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const lbl = (text, optional = false) => (
        <label style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            {text}
            {optional && <span style={{ fontWeight: 400, fontSize: '11px', letterSpacing: 0, color: 'var(--text-secondary)', opacity: 0.6 }}>· opcional</span>}
        </label>
    );

    if (success) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 44px)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px', animation: 'pop 0.4s ease' }}>🍽️</div>
                    <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>¡Añadido al grupo!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container section-padding">
            <div style={{ maxWidth: '620px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '6px', letterSpacing: '-0.02em' }}>
                        Añadir restaurante
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Busca por nombre y ciudad, o pega un enlace de Maps.
                    </p>
                </div>

                {/* ── Search card ── */}
                <div className="glass" style={{ borderRadius: '20px', padding: '22px', marginBottom: '16px' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔍</span> Busca el restaurante
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                            className="apple-input"
                            placeholder="Nombre del restaurante"
                            value={searchName}
                            onChange={(e) => { setSearchName(e.target.value); setCandidates([]); setSearchError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            style={{ flex: '2 1 160px' }}
                        />
                        <input
                            className="apple-input"
                            placeholder="Ciudad"
                            value={searchCity}
                            onChange={(e) => { setSearchCity(e.target.value); setCandidates([]); setSearchError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                            style={{ flex: '1 1 100px' }}
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="apple-button"
                            disabled={searching || !searchName.trim()}
                            style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}
                        >
                            {searching ? <Spinner /> : 'Buscar'}
                        </button>
                    </div>

                    {/* Candidates */}
                    {candidates.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {candidates.map((c, i) => (
                                <button key={i} type="button" onClick={() => handleSelectCandidate(c)}
                                    className="candidate-btn"
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '11px 14px',
                                        borderRadius: '12px', border: '1px solid var(--border)',
                                        background: 'var(--background)', cursor: 'pointer',
                                        fontFamily: 'var(--sf-font)', transition: 'border-color 0.15s',
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--foreground)' }}>{c.name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                📍 {c.shortAddress || c.address?.split(',').slice(0,3).join(',')}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                            {c.cuisineLabel && (
                                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '980px', background: 'var(--accent)', color: 'white', fontWeight: 600 }}>
                                                    {c.cuisineLabel}
                                                </span>
                                            )}
                                            {c.priceLevel && (
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {'€'.repeat(c.priceLevel)}
                                                </span>
                                            )}
                                            {c.rating && (
                                                <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    ★ {c.rating.toFixed(1)}
                                                    {c.ratingCount && (
                                                        <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                                                            ({c.ratingCount >= 1000 ? (c.ratingCount / 1000).toFixed(1) + 'k' : c.ratingCount})
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--accent)', fontWeight: 500 }}>Seleccionar →</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchError && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '10px' }}>{searchError}</p>
                    )}

                    {filled && candidates.length === 0 && (
                        <p style={{ color: '#30d158', fontSize: '13px', fontWeight: 500, marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span>✓</span> Formulario rellenado — revisa los detalles abajo
                        </p>
                    )}

                    {/* Paste URL */}
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            O pega un enlace de Google Maps, TheFork, TripAdvisor...
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                className="apple-input"
                                placeholder="https://..."
                                value={pasteUrl}
                                onChange={(e) => { setPasteUrl(e.target.value); setPasteError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePasteUrl())}
                                style={{ fontSize: '13px' }}
                            />
                            <button type="button" onClick={handlePasteUrl} disabled={pasteLoading || !pasteUrl.trim()}
                                style={{
                                    whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: '12px',
                                    border: '1px solid var(--border)', background: 'var(--background)',
                                    color: 'var(--accent)', fontSize: '13px', fontWeight: 500,
                                    cursor: pasteLoading || !pasteUrl.trim() ? 'not-allowed' : 'pointer',
                                    opacity: pasteLoading || !pasteUrl.trim() ? 0.5 : 1,
                                    fontFamily: 'var(--sf-font)', transition: 'opacity 0.15s',
                                }}>
                                {pasteLoading ? '...' : '↑ Importar'}
                            </button>
                        </div>
                        {pasteError && <p style={{ color: '#ff3b30', fontSize: '12px', marginTop: '6px' }}>{pasteError}</p>}
                    </div>
                </div>

                {/* ── Divider ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>DETALLES DEL RESTAURANTE</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* ── Form ── */}
                <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {lbl('NOMBRE')}
                    <input className="apple-input" placeholder="Ej. El Celler de Can Roca"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required style={{ marginTop: '-10px' }} />

                    {lbl('DIRECCIÓN')}
                    <input className="apple-input" placeholder="Calle, número, ciudad..."
                        value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        style={{ marginTop: '-10px' }} />

                    {/* Maps links */}
                    {(mapsUrls.google || mapsUrls.apple) && (
                        <div className="maps-row" style={{ display: 'flex', gap: '8px', marginTop: '-6px' }}>
                            {mapsUrls.google && (
                                <a href={mapsUrls.google} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                    fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none', background: 'var(--background)',
                                }}>🗺 Google Maps</a>
                            )}
                            {mapsUrls.apple && (
                                <a href={mapsUrls.apple} target="_blank" rel="noopener noreferrer" style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '12px', border: '1px solid var(--border)',
                                    fontSize: '13px', color: 'var(--foreground)', textDecoration: 'none', background: 'var(--background)',
                                }}>🍎 Apple Maps</a>
                            )}
                        </div>
                    )}

                    {/* Cuisine + Price */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 180px' }}>
                            {lbl('TIPO DE COCINA')}
                            <select className="apple-input" value={formData.cuisine}
                                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                                required style={{ marginTop: '6px' }}>
                                <option value="">Seleccionar...</option>
                                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: '1 1 140px' }}>
                            {lbl('PRECIO')}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', height: '50px' }}>
                                {[1,2,3,4].map(level => (
                                    <button key={level} type="button"
                                        onClick={() => setFormData({ ...formData, priceRange: level.toString() })}
                                        style={{
                                            flex: 1, borderRadius: '12px',
                                            border: `1.5px solid ${formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--border)'}`,
                                            background: formData.priceRange === level.toString() ? 'var(--accent)' : 'var(--background)',
                                            color: formData.priceRange === level.toString() ? 'white' : 'var(--text-secondary)',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                            transition: 'all 0.15s ease', fontFamily: 'var(--sf-font)',
                                        }}>
                                        {'€'.repeat(level)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {lbl('WEB', true)}
                    <input className="apple-input" placeholder="https://..."
                        value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        style={{ marginTop: '-10px' }} />

                    {lbl('¿POR QUÉ LO RECOMIENDAS?', true)}
                    <textarea className="apple-input"
                        placeholder="Cuéntanos qué lo hace especial — el ambiente, el plato estrella, si merece la pena reservar..."
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        style={{ minHeight: '100px', resize: 'vertical', lineHeight: 1.5, marginTop: '-10px' }} />

                    {error && (
                        <div style={{ color: '#ff3b30', fontSize: '13px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,59,48,0.08)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                        <button type="submit" className="apple-button"
                            style={{ flex: 1, padding: '15px', fontSize: '15px', fontWeight: 600 }}
                            disabled={loading}>
                            {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Spinner /> Guardando...</span> : '🍽 Añadir al grupo'}
                        </button>
                        <button type="button" onClick={() => router.back()}
                            style={{
                                padding: '15px 20px', borderRadius: '980px', border: '1px solid var(--border)',
                                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                                fontSize: '15px', fontFamily: 'var(--sf-font)',
                            }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .candidate-btn:hover { border-color: var(--accent) !important; }
            `}</style>
        </div>
    );
}

function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: '14px', height: '14px',
            border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
    );
}
