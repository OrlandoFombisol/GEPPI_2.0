import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'

// SST Fombisol no tiene ingreso propio: se entra desde ATLAS (cuenta Microsoft 365 de Fombisol),
// que abre la sesión con un pase de un solo uso según el rol. Con sesión va directo al tablero;
// sin sesión, de una vez a ATLAS.
const ATLAS = 'https://atlas.fombisol.com.co'

export default function Login() {
  const { user, loading } = useUser()
  useEffect(() => {
    if (!loading && !user) window.location.replace(ATLAS)
  }, [loading, user])
  if (user) return <Navigate to="/dashboard" replace />
  return null
}
