import { getCurrentUser } from '../actions/auth';
import { redirect } from 'next/navigation';
import BuscarPage from './BuscarPage';

export default async function Buscar() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');
    return <BuscarPage />;
}
