import { useState, useEffect, useCallback } from 'react'
import { alertaDB } from '@/db'

/**
 * Conteo de alertas no leídas para el badge del Header.
 * Se actualiza automáticamente cada 60 segundos.
 */
export function useAlertasBadge() {
  const [count, setCount]     = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const n = await alertaDB.contarNoLeidas()
      setCount(n)
    } catch {
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { count, loading, refresh }
}
