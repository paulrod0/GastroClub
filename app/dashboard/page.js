import { getRestaurants } from '../actions/restaurants';
import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RestaurantGrid from './RestaurantGrid';

export default async function Dashboard() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const restaurants = await getRestaurants();

    return (
        <div className="container section-padding">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px' }}>Nuestros Descubrimientos</h1>
                <Link href="/add" className="apple-button" style={{ flexShrink: 0 }}>
                    + Añadir
                </Link>
            </div>

            <RestaurantGrid restaurants={restaurants} />
        </div>
    );
}
