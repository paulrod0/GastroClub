import './globals.css';
import { getCurrentUser } from './actions/auth';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Gastrónomos',
  description: 'Grupo exclusivo de amantes de la buena mesa',
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();

  return (
    <html lang="es">
      <body>
        <Navbar user={user} />
        <main style={{ marginTop: '44px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
