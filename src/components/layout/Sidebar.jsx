import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence }   from 'framer-motion'
import { useState, useEffect }       from 'react'
import {
  // layout
  ChevronLeft, ChevronDown, X, LogOut,
  // nav items
  LayoutDashboard,
  Building2, UserCheck, Briefcase,
  ShieldCheck, LayoutGrid, Boxes, PackagePlus, History,
  BarChart3, FileBarChart2, BellRing,
  Car, ListChecks, Activity,
  CalendarCheck, HeartPulse, AlertTriangle, Stethoscope, TrendingUp, BadgeCheck,
  Settings2, GitMerge, FileSearch, UserCog, SlidersHorizontal,
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
    label: 'Seguridad Vial',
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
    ],
  },
]

// ─── Logo corporativo ─────────────────────────────────────────────────────────
function GeppiLogo({ collapsed }) {
  const size = collapsed ? 40 : 52
  return (
    <motion.div
      style={{ position: 'relative', flexShrink: 0, width: size, height: size }}
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 340, damping: 24 }}
    >
      <motion.div
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -6, borderRadius: 20,
          background: 'radial-gradient(circle, rgba(27,98,204,0.50), transparent 70%)',
        }}
      />
      <div style={{
        width: size, height: size, borderRadius: 14, background: 'white',
        boxShadow: '0 4px 24px rgba(27,98,204,0.60), 0 1px 4px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: collapsed ? 5 : 7, position: 'relative', zIndex: 2,
      }}>
        <img src={logoPng} alt="GEPPI" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </motion.div>
  )
}

// ─── Ítem de navegación ───────────────────────────────────────────────────────
function NavItem({ item, onClose, collapsed, badges = {} }) {
  const location  = useLocation()
  const isActive  = item.path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(item.path)
  const Icon     = item.icon
  const badge    = item.badgeKey ? badges[item.badgeKey] : 0
  const hasAlert = item.badgeKey === 'alertas' && badge > 0

  const shakeAnim  = hasAlert ? { rotate: [0, -12, 12, -8, 8, -4, 4, 0] } : {}
  const shakeTrans = hasAlert ? { duration: 0.55, repeat: Infinity, repeatDelay: 2.8 } : {}

  // ── Modo colapsado (solo iconos) ─────────────────────────────────────────
  if (collapsed) {
    return (
      <NavLink to={item.path} onClick={onClose}
        data-tooltip={item.label}
        className="sidebar-tooltip flex items-center justify-center py-0.5 w-full"
      >
        {({ isActive: na }) => (
          <motion.div
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.90 }}
            style={{
              width: 40, height: 40, borderRadius: 11, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: hasAlert
                ? 'rgba(239,68,68,0.20)'
                : isActive ? `${item.color}25` : 'transparent',
              border: `1.5px solid ${hasAlert ? 'rgba(239,68,68,0.45)' : isActive ? item.color + '55' : 'transparent'}`,
              transition: 'all 0.18s',
            }}
          >
            <motion.div animate={shakeAnim} transition={shakeTrans}>
              <Icon size={17} strokeWidth={isActive || hasAlert ? 2.3 : 1.8}
                style={{ color: hasAlert ? '#EF4444' : isActive ? item.color : 'rgba(255,255,255,0.42)' }} />
            </motion.div>
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3,
                minWidth: 15, height: 15, borderRadius: 8, padding: '0 3px',
                background: '#EF4444', color: '#fff',
                fontSize: 8, fontWeight: 900, lineHeight: '15px', textAlign: 'center',
              }}>{badge > 99 ? '99+' : badge}</span>
            )}
          </motion.div>
        )}
      </NavLink>
    )
  }

  // ── Modo expandido ───────────────────────────────────────────────────────
  return (
    <NavLink to={item.path} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
      {() => (
        <motion.div
          whileHover={!isActive ? { x: 3, backgroundColor: hasAlert ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.055)' } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.12 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px', borderRadius: 10, position: 'relative', cursor: 'pointer',
            background: hasAlert
              ? 'linear-gradient(90deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))'
              : isActive
              ? `linear-gradient(90deg,${item.color}22,${item.color}08)`
              : 'transparent',
            border: `1px solid ${hasAlert ? 'rgba(239,68,68,0.25)' : isActive ? item.color + '35' : 'transparent'}`,
          }}
        >
          {/* Barra izquierda activa */}
          {isActive && !hasAlert && (
            <motion.div layoutId="nav-active-bar" style={{
              position: 'absolute', left: 0, top: '20%', bottom: '20%',
              width: 3, borderRadius: 99,
              background: `linear-gradient(to bottom, ${item.color}, ${item.color}80)`,
              boxShadow: `0 0 10px ${item.color}99`,
            }} />
          )}
          {hasAlert && (
            <motion.div animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
              style={{
                position: 'absolute', left: 0, top: '20%', bottom: '20%',
                width: 3, borderRadius: 99,
                background: 'linear-gradient(to bottom,#EF4444,#DC2626)',
                boxShadow: '0 0 10px #EF444480',
              }} />
          )}

          {/* Contenedor del icono */}
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: hasAlert
              ? 'rgba(239,68,68,0.18)'
              : isActive ? `${item.color}30` : `${item.color}12`,
            border: `1px solid ${isActive ? item.color + '40' : 'transparent'}`,
            transition: 'all 0.18s',
          }}>
            <motion.div animate={shakeAnim} transition={shakeTrans}>
              <Icon size={15} strokeWidth={isActive || hasAlert ? 2.3 : 1.9}
                style={{ color: hasAlert ? '#EF4444' : isActive ? item.color : `${item.color}BB` }} />
            </motion.div>
          </div>

          {/* Label */}
          <span style={{
            fontSize: 12.5, flex: 1,
            fontWeight: isActive ? 700 : hasAlert ? 600 : 400,
            color: hasAlert ? '#FCA5A5'
              : isActive ? 'rgba(255,255,255,0.96)'
              : 'rgba(255,255,255,0.58)',
            letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.label}
          </span>

          {/* Badge alertas */}
          {badge > 0 && (
            <span style={{
              minWidth: 19, height: 19, borderRadius: 10, padding: '0 5px',
              background: '#EF4444', color: '#fff',
              fontSize: 10, fontWeight: 900, lineHeight: '19px', textAlign: 'center', flexShrink: 0,
            }}>{badge > 99 ? '99+' : badge}</span>
          )}

          {/* Punto activo */}
          {isActive && !hasAlert && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, boxShadow: `0 0 7px ${item.color}`, flexShrink: 0 }} />
          )}
        </motion.div>
      )}
    </NavLink>
  )
}

// ─── Encabezado de sección colapsable (Opción A: etiqueta plana tipo VS Code) ──
function SectionHeader({ label, sectionColor, open, onToggle, hasActive }) {
  const lineColor = hasActive ? `${sectionColor}35` : 'rgba(255,255,255,0.07)'
  const textColor = hasActive ? sectionColor : 'rgba(255,255,255,0.28)'
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '12px 4px 4px', background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, height: 1, background: lineColor, transition: 'background 0.2s' }} />

      <span style={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: textColor, whiteSpace: 'nowrap', flexShrink: 0, transition: 'color 0.2s',
      }}>
        {label}
      </span>

      <div style={{ flex: 1, height: 1, background: lineColor, transition: 'background 0.2s' }} />

      <motion.div
        animate={{ rotate: open ? 0 : -90 }}
        transition={{ duration: 0.20, ease: [0.4, 0, 0.2, 1] }}
        style={{ flexShrink: 0, display: 'flex' }}
      >
        <ChevronDown size={11} style={{ color: textColor, display: 'block' }} />
      </motion.div>
    </button>
  )
}

// ─── Usuario actual ───────────────────────────────────────────────────────────
const ROL_COLOR = { ADMINISTRADOR: '#A78BFA', COLABORADOR: '#60A5FA', SST: '#4ADE80' }
function iniciales(n) { return (n || '?').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase() }

function UsuarioActual({ collapsed }) {
  const { user } = useUser()
  const color = ROL_COLOR[user?.rol] || '#60A5FA'
  return (
    <div style={{ padding: collapsed ? '6px 6px 2px' : '6px 10px 2px' }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, padding: collapsed ? '8px 0' : '8px 10px',
        borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.035)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}25`, border: `1.5px solid ${color}50`,
          fontSize: 11, fontWeight: 900, color,
        }}>
          {iniciales(user?.nombre)}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.82)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre || 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color, whiteSpace: 'nowrap', fontWeight: 600, opacity: 0.75 }}>
                {user?.rol || ''}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Sidebar principal ────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose, collapsed, onToggle }) {
  const { user, logout } = useUser()
  const navigate         = useNavigate()
  const location         = useLocation()
  const isAdmin          = user?.rol === 'ADMINISTRADOR'
  const [alertCount, setAlertCount] = useState(0)

  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('geppi-nav-sections')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  // Auto-expande la sección activa al navegar
  useEffect(() => {
    const active = NAV_SECTIONS.find(s =>
      s.label && s.items.some(item =>
        item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path)
      )
    )
    if (active?.label) {
      setOpenSections(prev => {
        const next = { ...prev, [active.label]: true }
        localStorage.setItem('geppi-nav-sections', JSON.stringify(next))
        return next
      })
    }
  }, [location.pathname])

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

  const badges      = { alertas: alertCount }
  const isSectionOpen = (label) => openSections[label] === true

  const toggleSection = (label) => {
    setOpenSections(prev => {
      const next = { ...prev, [label]: !isSectionOpen(label) }
      localStorage.setItem('geppi-nav-sections', JSON.stringify(next))
      return next
    })
  }

  const hasSectionActive = (section) =>
    section.items.some(item =>
      item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path)
    )

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'flex flex-col h-full z-30 flex-shrink-0',
          'fixed top-0 left-0 lg:relative',
          'transition-transform duration-300 ease-in-out lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{
          width: collapsed ? 66 : 256,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.3s ease-in-out',
          background: 'var(--theme-sidebar-bg)',
          overflow: 'visible',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Decos de fondo */}
        <div style={{ position: 'absolute', top: -60, left: -40, width: 180, height: 180, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle,rgba(27,98,204,0.16),transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 60, right: -20, width: 140, height: 140, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle,rgba(57,181,74,0.08),transparent 70%)' }} />

        {/* Toggle desktop */}
        <motion.button onClick={onToggle} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.88 }}
          className="absolute z-50 hidden lg:flex items-center justify-center"
          style={{
            top: 30, right: -12, width: 24, height: 24, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1b62cc,#083278)',
            boxShadow: '0 2px 12px rgba(27,98,204,0.65)',
            border: '1.5px solid rgba(255,255,255,0.18)',
          }}>
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.28 }}>
            <ChevronLeft size={13} color="white" />
          </motion.div>
        </motion.button>

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: collapsed ? '18px 0 16px' : '16px 14px 14px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, minWidth: 0 }}>
            <GeppiLogo collapsed={collapsed} />
            <AnimatePresence>
              {!collapsed && (
                <motion.div key="brand"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22 }} style={{ minWidth: 0, overflow: 'hidden' }}
                >
                  <p style={{
                    margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: '0.13em', lineHeight: 1,
                    background: 'linear-gradient(90deg,#39B54A,#1b62cc,#F7941D)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{SISTEMA.NOMBRE}</p>
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 0.35 }}
                    style={{ height: 2, marginTop: 5, background: 'linear-gradient(90deg,#39B54A,#1b62cc,#F7941D)', borderRadius: 99, transformOrigin: 'left' }} />
                  <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.32)' }}>
                    Gestión de EPP · SST
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,0.38)', borderRadius: 8, display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Navegación ───────────────────────────────────────────────────── */}
        <nav className="scrollbar-dark"
          style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10, padding: collapsed ? '10px 6px' : '10px 8px' }}>

          {NAV_SECTIONS.map((section) => {
            const itemsFiltrados = section.items.filter(item => !item.adminOnly || isAdmin)
            if (itemsFiltrados.length === 0) return null
            const isOpen    = !section.label || isSectionOpen(section.label)
            const hasActive = !!section.label && hasSectionActive(section)

            return (
              <div key={section.label || 'root'} style={{ marginBottom: collapsed ? 2 : 4 }}>

                {/* Encabezado de sección en modo expandido */}
                {!collapsed && section.label && (
                  <SectionHeader
                    label={section.label}
                    sectionColor={section.sectionColor}
                    open={isOpen}
                    onToggle={() => toggleSection(section.label)}
                    hasActive={hasActive}
                  />
                )}

                {/* Separador en modo collapsed */}
                {collapsed && section.label && (
                  <div style={{ height: 1, margin: '5px 8px', background: 'rgba(255,255,255,0.07)' }} />
                )}

                {/* Ítems con animación de acordeón */}
                <AnimatePresence initial={false}>
                  {(collapsed || isOpen) && (
                    <motion.ul
                      initial={!collapsed ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        overflow: 'hidden', listStyle: 'none', margin: 0,
                        padding: collapsed ? 0 : `0 0 6px ${section.label ? 8 : 0}px`,
                        display: 'flex', flexDirection: 'column', gap: 1,
                      }}
                    >
                      {itemsFiltrados.map(item => (
                        <motion.li key={item.path}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <NavItem item={item} onClose={onClose} collapsed={collapsed} badges={badges} />
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>

              </div>
            )
          })}
        </nav>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div key="footer-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: '10px 14px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <motion.div animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2.4, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(74,222,128,0.70)', letterSpacing: '0.05em' }}>Sistema activo</span>
                </div>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  <span style={{ color: 'rgba(147,197,253,0.55)' }}>{SISTEMA.CODIGO_DOCUMENTO}</span> · v{SISTEMA.VERSION_MATRIZ}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <UsuarioActual collapsed={collapsed} />

          {/* Cerrar sesión */}
          <div style={{ padding: collapsed ? '4px 6px 12px' : '4px 8px 12px' }}>
            <motion.button onClick={() => logout(navigate)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 10, padding: collapsed ? '10px 0' : '8px 10px',
                borderRadius: 11, border: '1px solid rgba(248,113,113,0.18)',
                background: 'rgba(220,38,38,0.07)', cursor: 'pointer', transition: 'all 0.18s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.16)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)' }}
              onMouseOut={e  => { e.currentTarget.style.background = 'rgba(220,38,38,0.07)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.18)' }}
              title="Cerrar sesión"
              data-tooltip={collapsed ? 'Cerrar sesión' : undefined}
              className={collapsed ? 'sidebar-tooltip' : ''}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.14)' }}>
                <LogOut size={14} style={{ color: '#FCA5A5' }} strokeWidth={2.2} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 12.5, fontWeight: 600, color: '#FCA5A5', letterSpacing: '0.01em' }}>
                    Cerrar sesión
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </aside>
    </>
  )
}
