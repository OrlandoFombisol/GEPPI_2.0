import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence }   from 'framer-motion'
import { useState, useEffect }       from 'react'
import {
  // layout
  ChevronDown, X,
  // nav items
  LayoutDashboard,
  Building2, UserCheck, Briefcase,
  ShieldCheck, LayoutGrid, Boxes, PackagePlus, History,
  BarChart3, FileBarChart2, BellRing,
  Car, ListChecks, Activity,
  CalendarCheck, HeartPulse, AlertTriangle, Stethoscope, TrendingUp, BadgeCheck,
  Settings2, GitMerge, FileSearch, UserCog, SlidersHorizontal, Sparkles,
} from 'lucide-react'
const logoPng = '/logo.jpg'
import { SISTEMA }  from '@/constants'
import { useUser }  from '@/contexts/UserContext'
import { alertaDB } from '@/db'

// ─── Datos de navegación ──────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: '#4A9EFF' },
    ],
  },
  {
    label: 'Organización',
    sectionIcon: Building2,
    sectionColor: '#3B82F6',
    items: [
      { label: 'Empresas y Sedes', path: '/empresas',     icon: Building2,  color: '#60A5FA' },
      { label: 'Trabajadores',     path: '/trabajadores', icon: UserCheck,  color: '#93C5FD' },
      { label: 'Cargos',           path: '/cargos',       icon: Briefcase,  color: '#67E8F9' },
    ],
  },
  {
    label: 'EPP & Entregas',
    sectionIcon: ShieldCheck,
    sectionColor: '#10B981',
    items: [
      { label: 'Matriz Técnica',    path: '/matriz-epp',     icon: ShieldCheck, color: '#34D399' },
      { label: 'Matriz por Cargos', path: '/matriz-cargos',  icon: LayoutGrid,  color: '#6EE7B7' },
      { label: 'Inventario',        path: '/inventario',     icon: Boxes,       color: '#A7F3D0' },
      { label: 'Nueva Entrega',     path: '/entregas/nueva', icon: PackagePlus, color: '#F97316' },
      { label: 'Historial',         path: '/historial',      icon: History,     color: '#FCD34D' },
    ],
  },
  {
    label: 'Monitoreo',
    sectionIcon: BarChart3,
    sectionColor: '#F59E0B',
    items: [
      { label: 'Reportes',        path: '/reportes',    icon: BarChart3,     color: '#C084FC' },
      { label: 'Consolidado EPP', path: '/consolidado', icon: FileBarChart2, color: '#FCD34D' },
      { label: 'Alertas',         path: '/alertas',     icon: BellRing,      color: '#FB923C', badgeKey: 'alertas' },
    ],
  },
  {
    label: 'Inspecciones',
    sectionIcon: Car,
    sectionColor: '#06B6D4',
    items: [
      { label: 'Checklist Preop.',  path: '/checklist',    icon: ListChecks, color: '#34D399' },
      { label: 'Inspecciones SST',  path: '/inspecciones', icon: Activity,   color: '#38BDF8' },
    ],
  },
  {
    label: 'SG-SST',
    sectionIcon: BadgeCheck,
    sectionColor: '#8B5CF6',
    items: [
      { label: 'Plan Anual',        path: '/plan-trabajo',          icon: CalendarCheck, color: '#818CF8' },
      { label: 'AT / IT',           path: '/at-it',                 icon: HeartPulse,    color: '#F87171' },
      { label: 'Actos Inseguros',   path: '/condiciones-inseguras', icon: AlertTriangle, color: '#FB923C' },
      { label: 'Exámenes Médicos',  path: '/examenes-medicos',      icon: Stethoscope,   color: '#2DD4BF' },
      { label: 'Indicadores',       path: '/indicadores',           icon: TrendingUp,    color: '#60A5FA' },
      { label: 'SG-SST 0312',       path: '/sg-sst',                icon: BadgeCheck,    color: '#4ADE80' },
    ],
  },
  {
    label: 'Sistema',
    sectionIcon: Settings2,
    sectionColor: '#64748B',
    items: [
      { label: 'Gestión del Cambio', path: '/gestion-cambio', icon: GitMerge,          color: '#94A3B8' },
      { label: 'Auditoría',          path: '/auditoria',      icon: FileSearch,        color: '#CBD5E1', adminOnly: true },
      { label: 'Usuarios y Roles',   path: '/usuarios-roles', icon: UserCog,           color: '#A78BFA', adminOnly: true },
      { label: 'Configuración',      path: '/configuracion',  icon: SlidersHorizontal, color: '#94A3B8', adminOnly: true },
      { label: 'Mejora Continua',    path: '/mejora-continua', icon: Sparkles,         color: '#8B5CF6', adminOnly: true },
    ],
  },
]

// ─── Estándar de menú de las apps de Fombisol (modelo ORBIT, Manual de Marca) ──────
// Marino #213053, texto #F2F3F6 / #B0B9D2, azul #045C94 para lo activo y ámbar #FFB71B para la
// sección seleccionada. Cada sección: ícono + NOMBRE + línea + flechita; sus opciones cuelgan de una
// línea vertical blanca tenue y la activa solo resalta sus letras. Flota en computador; en celular y
// tableta (< 1024 px) lo abre la hamburguesa del encabezado.
const C = { fondo: '#213053', tinta: '#F2F3F6', tenue: '#B0B9D2', azul: '#045C94', ambar: '#FFB71B' }

const esActiva = (path, pathname) => (path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path))

function Contador({ n }) {
  return (
    <span className="ml-auto rounded-full px-1.5 text-[10px] font-bold leading-[18px] text-white" style={{ background: '#EF4444', minWidth: 18, textAlign: 'center' }}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

// Opción suelta (Dashboard): ícono en cuadrito, azul cuando está activa
function EntradaDirecta({ item, onClose, badges }) {
  const location = useLocation()
  const activa = esActiva(item.path, location.pathname)
  const Icon = item.icon
  const badge = item.badgeKey ? badges[item.badgeKey] : 0
  return (
    <NavLink to={item.path} onClick={onClose}
      className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 text-sm transition-colors hover:bg-white/5"
      style={{ color: activa ? '#fff' : C.tenue, background: activa ? 'rgba(255,255,255,0.10)' : undefined, fontWeight: activa ? 500 : 400 }}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/5 text-white"
        style={{ background: activa ? C.azul : 'rgba(255,255,255,0.10)' }}>
        <Icon size={14} />
      </span>
      <span className="flex-1">{item.label}</span>
      {badge > 0 && <Contador n={badge} />}
    </NavLink>
  )
}

// ─── Sidebar principal ────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const { user } = useUser()
  const location = useLocation()
  const isAdmin  = user?.rol === 'ADMINISTRADOR'
  const [alertCount, setAlertCount] = useState(0)
  const [cerradas, setCerradas] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('sst-nav-cerradas') || '[]')) } catch { return new Set() }
  })
  // Sección resaltada en ámbar: la última cuyo título se tocó; si no, la de la página abierta
  const [elegida, setElegida] = useState(null)
  useEffect(() => { setElegida(null) }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    async function contar() {
      try { const n = await alertaDB.contarNoLeidas(); if (!cancelled) setAlertCount(n) }
      catch { /* silencioso */ }
    }
    contar()
    const iv = setInterval(contar, 30000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  const badges = { alertas: alertCount }
  const alternar = (label) => {
    setElegida(label)
    setCerradas(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label); else next.add(label)
      try { localStorage.setItem('sst-nav-cerradas', JSON.stringify([...next])) } catch { /* sin almacenamiento */ }
      return next
    })
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: 'rgba(15,23,42,0.45)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'flex flex-col gap-5 z-30 flex-shrink-0 overflow-y-auto p-5',
          'fixed top-3 left-3 bottom-3 lg:relative lg:top-auto lg:left-auto lg:bottom-auto lg:h-full',
          'transition-transform duration-300 ease-in-out lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-[calc(100%+1.5rem)] lg:translate-x-0',
        ].join(' ')}
        style={{
          width: 256, maxWidth: 'calc(100vw - 24px)', background: C.fondo, color: C.tenue, borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 10px rgba(33,48,83,0.06), 0 24px 48px -20px rgba(33,48,83,0.22)',
        }}
      >
        {/* ── Marca ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-1" style={{ color: C.tinta }}>
          <img src={logoPng} alt="" draggable={false} className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[15px] font-semibold tracking-wide">{SISTEMA.NOMBRE}</p>
            <p className="m-0 mt-0.5 truncate text-[11px]" style={{ color: C.tenue }}>Seguridad y salud en el trabajo</p>
          </div>
          <button onClick={onClose} className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5" aria-label="Cerrar menú" style={{ color: C.tenue }}>
            <X size={16} />
          </button>
        </div>

        {/* ── Navegación ───────────────────────────────────────────────────── */}
        <nav className="flex flex-1 flex-col gap-2">
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter(item => !item.adminOnly || isAdmin)
            if (items.length === 0) return null
            if (!section.label) {
              return items.map(item => <EntradaDirecta key={item.path} item={item} onClose={onClose} badges={badges} />)
            }
            const cerrada = cerradas.has(section.label)
            const resaltada = elegida ? elegida === section.label : items.some(i => esActiva(i.path, location.pathname))
            const SectionIcon = section.sectionIcon
            return (
              <div key={section.label}>
                <button onClick={() => alternar(section.label)} aria-expanded={!cerrada}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-1 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors"
                  style={{ color: resaltada ? C.ambar : C.tenue }}>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {SectionIcon && <SectionIcon size={14} />}
                    {section.label}
                  </span>
                  <span className="h-px flex-1" style={{ background: resaltada ? 'rgba(255,183,27,0.4)' : 'rgba(255,255,255,0.07)' }} />
                  <ChevronDown size={12} style={{ transform: cerrada ? 'rotate(-90deg)' : 'none', transition: 'transform .18s' }} />
                </button>
                {!cerrada && (
                  // Opciones colgando de una línea vertical blanca tenue (nace bajo el centro del ícono)
                  <div className="mb-1 mt-1 flex flex-col gap-0.5 border-l pl-2.5" style={{ marginLeft: 11, borderColor: 'rgba(255,255,255,0.2)' }}>
                    {items.map(item => {
                      const activa = esActiva(item.path, location.pathname)
                      const badge = item.badgeKey ? badges[item.badgeKey] : 0
                      return (
                        <NavLink key={item.path} to={item.path} onClick={onClose}
                          className="flex items-center rounded-lg px-2.5 py-1.5 text-[12.5px] leading-snug transition-colors hover:!text-[#F2F3F6]"
                          style={{ color: activa ? '#fff' : C.tenue, fontWeight: activa ? 600 : 400 }}>
                          <span className="flex-1">{item.label}</span>
                          {badge > 0 && <Contador n={badge} />}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t px-1 pt-3 text-[11.5px]" style={{ borderColor: 'rgba(255,255,255,0.08)', color: C.tenue }}>
          SST · Fombisol
        </div>
      </aside>
    </>
  )
}
