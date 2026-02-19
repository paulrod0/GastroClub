import { getCurrentUser } from '../actions/auth';
import { getAllUsers, getAllRestaurants, deleteUser, deleteRestaurant } from '../actions/admin';
import { redirect } from 'next/navigation';

export default async function AdminPanel() {
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') redirect('/dashboard');

    const users = await getAllUsers();
    const restaurants = await getAllRestaurants();

    return (
        <div className="container section-padding">
            <h1 style={{ fontSize: '32px', marginBottom: '40px' }}>Panel de Control</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>

                {/* Users Section */}
                <section className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Miembros del Grupo ({users.length})</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px' }}>Nombre</th>
                                    <th style={{ padding: '12px' }}>Teléfono</th>
                                    <th style={{ padding: '12px' }}>Restaurantes</th>
                                    <th style={{ padding: '12px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>{u.name} {u.role === 'ADMIN' && '👑'}</td>
                                        <td style={{ padding: '12px' }}>{u.phone}</td>
                                        <td style={{ padding: '12px' }}>{u._count.restaurants}</td>
                                        <td style={{ padding: '12px' }}>
                                            {u.role !== 'ADMIN' && (
                                                <form action={async () => {
                                                    'use server';
                                                    await deleteUser(u.id);
                                                }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Restaurants Section */}
                <section className="glass" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Todos los Restaurantes ({restaurants.length})</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px' }}>Nombre</th>
                                    <th style={{ padding: '12px' }}>Cocina</th>
                                    <th style={{ padding: '12px' }}>Precio</th>
                                    <th style={{ padding: '12px' }}>Añadido por</th>
                                    <th style={{ padding: '12px' }}>Fecha</th>
                                    <th style={{ padding: '12px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>{r.name}</td>
                                        <td style={{ padding: '12px' }}>{r.cuisine || '—'}</td>
                                        <td style={{ padding: '12px' }}>{r.priceRange ? '€'.repeat(r.priceRange) : '—'}</td>
                                        <td style={{ padding: '12px' }}>{r.addedBy.name}</td>
                                        <td style={{ padding: '12px' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px' }}>
                                            <form action={async () => {
                                                'use server';
                                                await deleteRestaurant(r.id);
                                            }}>
                                                <button style={{ background: 'none', border: 'none', color: '#ff3b30', cursor: 'pointer', fontSize: '13px' }}>Eliminar</button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
}
