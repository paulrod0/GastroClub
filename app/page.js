import Link from 'next/link';
import { getCurrentUser } from './actions/auth';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="container">
      <section className="section-padding" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', marginBottom: '20px' }}>Para los amantes del buen comer.</h1>
        <p style={{ fontSize: '24px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 40px' }}>
          El rincón exclusivo para nuestro grupo de WhatsApp. Comparte y descubre los mejores restaurantes.
        </p>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {user ? (
            <Link href="/dashboard" className="apple-button" style={{ padding: '16px 32px', fontSize: '17px' }}>
              Ver Restaurantes
            </Link>
          ) : (
            <>
              <Link href="/register" className="apple-button" style={{ padding: '16px 32px', fontSize: '17px' }}>
                Unirse ahora
              </Link>
              <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '17px' }}>
                Ya soy miembro <span style={{ marginLeft: '4px' }}>›</span>
              </Link>
            </>
          )}
        </div>
      </section>

      <section style={{ marginTop: '40px' }}>
        <div className="glass" style={{ borderRadius: '24px', padding: '60px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '40px', marginBottom: '16px' }}>Exclusivo. Elegante. Sabroso.</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '19px' }}>
            Solo para miembros verificados de nuestro grupo de WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
