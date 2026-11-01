import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, UserCheck, PackagePlus, BellRing, Menu } from 'lucide-react'
import { alertaDB } from '@/db'

// Menú inferior del celular y la tableta (< 1024 px), estándar móvil de las apps de Fombisol:
// 4 accesos principales + «Más», que abre el menú completo como hoja inferior (ver Sidebar).
const ACCESOS = [
  { label: 'Inicio',        path: '/dashboard',      icon: LayoutDashboard },
  { label: 'Trabajadores',  path: '/trabajadores',   icon: UserCheck },
  { label: 'Nueva entrega', path: '/entregas/nueva', icon: PackagePlus },
  { label: 'Alertas',       path: '/alertas',        icon: BellRing, badge: true },
]

export default function MenuInferior({ onMas, masAbierto }) {
  const { pathname } = useLocation()
  const [alertas, setAlertas] = useState(0)

  useEffect(() => {
    let cancelado = false
    alertaDB.contarNoLeidas().then(n => { if (!cancelado) setAlertas(n) }).catch(() => {})
    return () => { cancelado = true }
  }, [pathname])

  const enAcceso = ACCESOS.some(a => pathname.startsWith(a.path))

  return (
    <nav aria-label="Menú principal"
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 flex border-t bg-white"
      style={{ borderColor: '#DDE2EA', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 16px rgba(33,48,83,0.06)' }}>
      {ACCESOS.map(({ label, path, icon: Icon, badge }) => {
        const activo = pathname.startsWith(path) && !masAbierto
        return (
          <NavLink key={path} to={path} className="relative flex min-w-0 flex-1 flex-col items-center gap-1 pt-2 pb-2.5"
            aria-current={activo ? 'page' : undefined}>
            <span className="relative flex h-8 w-14 items-center justify-center rounded-full transition-colors"
              style={{ background: activo ? 'rgba(4,92,148,0.12)' : 'transparent', color: activo ? '#045C94' : '#64748B' }}>
              <Icon size={22} strokeWidth={activo ? 2.2 : 1.8} />
              {badge && alertas > 0 && (
                <span className="absolute -top-0.5 right-2 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-4 text-white" style={{ background: '#EF4444' }}>
                  {alertas > 99 ? '99+' : alertas}
                </span>
              )}
            </span>
            <span className="max-w-full truncate px-1 text-[11px] leading-none" style={{ color: activo ? '#213053' : '#64748B', fontWeight: activo ? 600 : 500 }}>
              {label}
            </span>
          </NavLink>
        )
      })}
      <button onClick={onMas} className="flex min-w-0 flex-1 flex-col items-center gap-1 pt-2 pb-2.5" aria-label="Más opciones" aria-expanded={masAbierto}>
        <span className="flex h-8 w-14 items-center justify-center rounded-full transition-colors"
          style={{ background: masAbierto || !enAcceso ? 'rgba(4,92,148,0.12)' : 'transparent', color: masAbierto || !enAcceso ? '#045C94' : '#64748B' }}>
          <Menu size={22} strokeWidth={1.8} />
        </span>
        <span className="text-[11px] leading-none" style={{ color: masAbierto || !enAcceso ? '#213053' : '#64748B', fontWeight: masAbierto || !enAcceso ? 600 : 500 }}>
          Más
        </span>
      </button>
    </nav>
  )
}
