import { Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

// SST Fombisol no tiene ingreso propio: se entra desde ATLAS, que abre la sesión con un pase
// de un solo uso según el rol de la persona. Si la sesión ya está abierta, va directo al tablero.
const ATLAS = 'https://atlas.fombisol.com.co'

export default function Login() {
  const { user, loading } = useUser()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #213053 0%, #1B3A66 55%, #045C94 100%)',
      fontFamily: 'Poppins, Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 20, padding: 32,
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.6)', textAlign: 'center',
      }}>
        <img src="/logo.jpg" alt="SST Fombisol" style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px', display: 'block' }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#213053' }}>SST Fombisol</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#566181' }}>Seguridad y salud en el trabajo</p>
        <p style={{ margin: '24px 0', fontSize: 14, lineHeight: 1.6, color: '#334155' }}>
          Para entrar, abre ATLAS con tu cuenta de Fombisol y elige la tarjeta <b>SST</b>.
        </p>
        <a href={ATLAS} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px',
          borderRadius: 12, background: '#045C94', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          Ir a ATLAS <ArrowRight size={16} aria-hidden="true" />
        </a>
        <div style={{ height: 3, width: 40, background: '#FFB71B', borderRadius: 3, margin: '28px auto 0' }} />
      </div>
    </div>
  )
}
