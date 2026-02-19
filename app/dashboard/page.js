import { getRestaurants } from '../actions/restaurants';
import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Dashboard() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const restaurants = await getRestaurants();

    return (
        <div className="container section-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px' }}>Nuestros Descubrimientos</h1>
                <Link href="/add" className="apple-button">
                    + Añadir Restaurante
                </Link>
            </div>

            {restaurants.length === 0 ? (
                <div className="glass" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '19px' }}>Aún no hay restaurantes recomendados. ¡Sé el primero!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {restaurants.map((res) => (
                        <div key={res.id} className="glass" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '20px' }}>{res.name}</h3>
                                {res.url && (
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '14px' }}>Web</a>
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
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{res.address || 'Ubicación no especificada'}</p>
                            <p style={{ fontSize: '15px', color: 'var(--foreground)', marginTop: '8px' }}>{res.description}</p>
                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                <span>Recomendado por {res.addedBy.name}</span>
                                <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
