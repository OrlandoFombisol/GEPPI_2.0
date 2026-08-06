import { useEffect, useState } from 'react'

// Marca de build fija — se actualiza a mano en cada commit de prueba,
// sirve para confirmar visualmente que el deploy en producción es el más reciente.
const BUILD_STAMP = '2026-08-06 15:58'

export default function DeployBadge() {
  const [ahora, setAhora] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const fecha = ahora.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const hora  = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        zIndex: 99999,
        background: '#101828',
        color: '#39B54A',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid #39B54A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
      ✓ Actualizado — build {BUILD_STAMP} · {fecha} {hora}
    </div>
  )
}
