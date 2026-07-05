import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, X, LogOut, UserCog } from 'lucide-react'
import { motion, AnimatePresence }   from 'framer-motion'
import { useState, useEffect }       from 'react'
import {
  LayoutDashboard, Building2, Users, Briefcase,
  ShieldCheck, Table2, Package, PackagePlus,
  ClipboardList, BarChart3, Bell, GitBranch,
  FileSearch, Settings, AlertTriangle, CheckSquare,
  ClipboardCheck, ShieldAlert, Stethoscope, AlertOctagon,
  BarChart2, PackageSearch,
} from 'lucide-react'
const logoPng = '/logo.jpg'
import { SISTEMA }      from '@/constants'
import { useUser }      from '@/contexts/UserContext'
import { alertaDB }     from '@/db'

// ─── Navegación reorganizada (criterio SST profesional) ──────────────────────
//
//  Sin sección  →  Dashboard siempre visible arriba
//  Organización →  Datos maestros de la empresa
//  EPP & Entregas → Todo el ciclo de vida del EPP
//  Monitoreo    →  Reportes, consolidados, alertas
//  Seguridad Vial → Checklist e Inspecciones
//  SG-SST       →  Módulos del Sistema de Gestión
//  Sistema      →  Administración (adminOnly parcial)
//
const NAV_SECTIONS = [
  {
    label: null,  // sin encabezado — Dashboard siempre expuesto
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: '#4A9EFF' },
    ],
  },
  {
    label: 'Organización',
    items: [
      { label: 'Empresas y Sedes', path: '/empresas',     icon: Building2,    color: '#60C8FF' },
      { label: 'Trabajadores',     path: '/trabajadores', icon: Users,        color: '#93C5FD' },
      { label: 'Cargos',           path: '/cargos',       icon: Briefcase,    color: '#67D3F0' },
    ],
  },
  {
    label: 'EPP & Entregas',
    items: [
      { label: 'Matriz Técnica',    path: '/matriz-epp',     icon: ShieldCheck,   color: '#4ADE80' },
      { label: 'Matriz por Cargos', path: '/matriz-cargos',  icon: Table2,        color: '#6EE7B7' },
      { label: 'Inventario',        path: '/inventario',     icon: Package,       color: '#FCA5A5' },
      { label: 'Nueva Entrega',     path: '/entregas/nueva', icon: PackagePlus,   color: '#F7941D' },
      { label: 'Historial',         path: '/historial',      icon: ClipboardList, color: '#FCD34D' },
    ],
  },
  {
    label: 'Monitoreo',
    items: [
      { label: 'Reportes',        path: '/reportes',    icon: BarChart3,     color: '#C084FC' },
      { label: 'Consolidado EPP', path: '/consolidado', icon: PackageSearch, color: '#FBBF24' },
      { label: 'Alertas',         path: '/alertas',     icon: Bell,          color: '#FB923C', badgeKey: 'alertas' },
    ],
  },
  {
    label: 'Seguridad Vial',
    items: [
      { label: 'Checklist Preop.',  path: '/checklist',    icon: CheckSquare,    color: '#34D399' },
      { label: 'Inspecciones SST',  path: '/inspecciones', icon: ClipboardCheck, color: '#38BDF8' },
    ],
  },
  {
    label: 'SG-SST',
    items: [
      { label: 'Plan Anual',          path: '/plan-trabajo',          icon: ClipboardCheck, color: '#818CF8' },
      { label: 'AT / IT',             path: '/at-it',                 icon: AlertOctagon,   color: '#F87171' },
      { label: 'Actos Inseguros',     path: '/condiciones-inseguras', icon: ShieldAlert,    color: '#FB923C' },
      { label: 'Exámenes Médicos',    path: '/examenes-medicos',      icon: Stethoscope,    color: '#2DD4BF' },
      { label: 'Indicadores',         path: '/indicadores',           icon: BarChart2,      color: '#60A5FA' },
      { label: 'SG-SST 0312',         path: '/sg-sst',                icon: ShieldCheck,    color: '#4ADE80' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Gestión del Cambio', path: '/gestion-cambio', icon: GitBranch,  color: '#94A3B8' },
      { label: 'Auditoría',          path: '/auditoria',      icon: FileSearch, color: '#CBD5E1', adminOnly: true },
      { label: 'Usuarios y Roles',   path: '/usuarios-roles', icon: UserCog,    color: '#A78BFA', adminOnly: true },
      { label: 'Configuración',      path: '/configuracion',  icon: Settings,   color: '#64748B', adminOnly: true },
    ],
  },
]

// ─── Logo ─────────────────────────────────────────────────────────────────────
function GeppiLogo({ collapsed }) {
  const size = collapsed ? 44 : 56
  return (
    <motion.div
      style={{ position: 'relative', flexShrink: 0, width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 340, damping: 24 }}
    >
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: -5, borderRadius: 18,
          background: 'radial-gradient(circle, rgba(27,98,204,0.45), transparent 70%)',
        }}
      />
      <div style={{
        width: size, height: size, borderRadius: 14, background: 'white',
        boxShadow: '0 4px 20px rgba(27,98,204,0.55), 0 2px 6px rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: collapsed ? 5 : 7, position: 'relative', zIndex: 2,
      }}>
        <img src={logoPng} alt="GEPPI" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </motion.div>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ item, onClose, collapsed, badges = {} }) {
  const location = useLocation()
  const isActive = item.path === '/dashboard'
    ? location.pathname === '/dashboard'
    : location.pathname.startsWith(item.path)
  const Icon      = item.icon
  const badge     = item.badgeKey ? badges[item.badgeKey] : 0
  const hasAlert  = item.badgeKey === 'alertas' && badge > 0

  const shakeAnim  = hasAlert ? { rotate: [0, -12, 12, -10, 10, -6, 6, 0] } : {}
  const shakeTrans = hasAlert ? { duration: 0.6, repeat: Infinity, repeatDelay: 2.5 } : {}

  if (collapsed) {
    return (
      <NavLink to={item.path} onClick={onClose}
        data-tooltip={item.label} className="sidebar-tooltip flex items-center justify-center py-1 w-full">
        <motion.div
          whileHover={{ scale: 1.14, backgroundColor: 'rgba(255,255,255,0.12)' }}
          whileTap={{ scale: 0.93 }}
          style={{
            width: 42, height: 42, borderRadius: 12, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: hasAlert ? 'rgba(239,68,68,0.18)' : isActive ? 'linear-gradient(135deg,rgba(27,98,204,0.55),rgba(8,50,120,0.35))' : 'transparent',
            border: hasAlert ? '1px solid rgba(239,68,68,0.40)' : isActive ? '1px solid rgba(74,158,255,0.30)' : '1px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          <motion.div animate={shakeAnim} transition={shakeTrans}>
            <Icon size={17} strokeWidth={isActive || hasAlert ? 2.2 : 1.7}
              style={{ color: hasAlert ? '#EF4444' : isActive ? item.color : 'rgba(255,255,255,0.45)' }} />
          </motion.div>
          {badge > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
              background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 800,
              lineHeight: '16px', textAlign: 'center',
            }}>{badge > 99 ? '99+' : badge}</span>
          )}
        </motion.div>
      </NavLink>
    )
  }

  return (
    <NavLink to={item.path} onClick={onClose} style={{ textDecoration: 'none', display: 'block' }}>
      {() => (
        <motion.div
          whileHover={!isActive ? { backgroundColor: hasAlert ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.06)', x: 2 } : {}}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 8px', borderRadius: 10, position: 'relative',
            background: hasAlert
              ? 'linear-gradient(90deg,rgba(239,68,68,0.18) 0%,rgba(220,38,38,0.08) 100%)'
              : isActive ? 'linear-gradient(90deg,rgba(27,98,204,0.28) 0%,rgba(8,50,120,0.12) 100%)'
              : 'transparent',
            border: hasAlert ? '1px solid rgba(239,68,68,0.30)' : isActive ? '1px solid rgba(74,158,255,0.22)' : '1px solid transparent',
            cursor: 'pointer',
          }}
        >
          {isActive && !hasAlert && (
            <motion.div layoutId="activeBar" style={{
              position: 'absolute', left: 0, top: 6, bottom: 6,
              width: 3, borderRadius: 99,
              background: `linear-gradient(to bottom,${item.color},rgba(27,98,204,0.5))`,
              boxShadow: `0 0 8px ${item.color}88`,
            }} />
          )}
          {hasAlert && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: 'absolute', left: 0, top: 6, bottom: 6,
                width: 3, borderRadius: 99,
                background: 'linear-gradient(to bottom,#EF4444,#DC2626)',
                boxShadow: '0 0 8px #EF444488',
              }}
            />
          )}

          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: hasAlert ? 'rgba(239,68,68,0.18)' : isActive ? `${item.color}22` : 'rgba(255,255,255,0.05)',
          }}>
            <motion.div animate={shakeAnim} transition={shakeTrans}>
              <Icon size={14} strokeWidth={isActive || hasAlert ? 2.2 : 1.7}
                style={{ color: hasAlert ? '#EF4444' : isActive ? item.color : 'rgba(255,255,255,0.40)' }} />
            </motion.div>
          </div>

          <span style={{
            fontSize: 12.5, fontWeight: isActive || hasAlert ? 600 : 400, flex: 1,
            color: hasAlert ? '#FCA5A5' : isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.60)',
            letterSpacing: '0.01em',
          }}>
            {item.label}
          </span>

          {badge > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
              background: '#EF4444', color: '#fff', fontSize: 10,
              fontWeight: 800, lineHeight: '18px', textAlign: 'center', flexShrink: 0,
            }}>{badge > 99 ? '99+' : badge}</span>
          )}

          {isActive && !hasAlert && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: item.color, boxShadow: `0 0 6px ${item.color}`, flexShrink: 0,
            }} />
          )}
        </motion.div>
      )}
    </NavLink>
  )
}

// ─── Encabezado de sección colapsable ─────────────────────────────────────────
function SectionHeader({ label, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '3px 4px 3px 6px', borderRadius: 6, cursor: 'pointer',
        background: 'none', border: 'none',
        transition: 'background 0.15s',
      }}
      onMouseOver={e  => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      onMouseOut={e   => e.currentTarget.style.background = 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {label}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <motion.div
        animate={{ rotate: open ? 0 : -90 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{ flexShrink: 0, marginLeft: 6 }}
      >
        <ChevronDown size={10} style={{ color: 'rgba(255,255,255,0.30)', display: 'block' }} />
      </motion.div>
    </button>
  )
}

// ─── Usuario actual ───────────────────────────────────────────────────────────
const ROL_COLOR = { ADMINISTRADOR: '#A78BFA', COLABORADOR: '#60A5FA', SST: '#4ADE80' }
function iniciales(n) { return (n||'?').split(' ').slice(0,2).map(p=>p[0]||'').join('').toUpperCase() }

function UsuarioActual({ collapsed }) {
  const { user } = useUser()
  const color = ROL_COLOR[user?.rol] || '#60A5FA'
  return (
    <div style={{ padding: collapsed ? '6px 6px 2px' : '6px 10px 2px' }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, padding: collapsed ? '8px 0' : '8px 12px',
        borderRadius: 11, border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}22`, border: `1.5px solid ${color}44`,
          fontSize: 11, fontWeight: 800, color,
        }}>
          {iniciales(user?.nombre)}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.80)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre || 'Usuario'}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                {user?.rol || ''}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose, collapsed, onToggle }) {
  const { user, logout } = useUser()
  const navigate         = useNavigate()
  const location         = useLocation()
  const isAdmin          = user?.rol === 'ADMINISTRADOR'
  const [alertCount,    setAlertCount]    = useState(0)

  // Estado de secciones abiertas — por defecto todas abiertas
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem('geppi-nav-sections')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  // Auto-expandir la sección activa cuando cambia la ruta
  useEffect(() => {
    const active = NAV_SECTIONS.find(s =>
      s.label && s.items.some(item =>
        item.path === '/dashboard'
          ? location.pathname === '/dashboard'
          : location.pathname.startsWith(item.path)
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

  // Conteo de alertas cada 30s
  useEffect(() => {
    let cancelled = false
    async function contar() {
      try {
        const n = await alertaDB.contarNoLeidas()
        if (!cancelled) setAlertCount(n)
      } catch { /* silencioso */ }
    }
    contar()
    const iv = setInterval(contar, 30000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  const badges = { alertas: alertCount }

  const isSectionOpen = (label) => openSections[label] !== false  // abierta por defecto

  const toggleSection = (label) => {
    setOpenSections(prev => {
      const next = { ...prev, [label]: !isSectionOpen(label) }
      localStorage.setItem('geppi-nav-sections', JSON.stringify(next))
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
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          'relative flex flex-col h-full z-30 flex-shrink-0',
          'fixed top-0 left-0 lg:static',
          'transition-transform duration-300 ease-in-out lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{
          width: collapsed ? 68 : 252,
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.3s ease-in-out',
          background: 'var(--theme-sidebar-bg)',
          overflow: 'visible',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Decoración */}
        <div style={{ position: 'absolute', top: -80, left: -40, width: 200, height: 200, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle,rgba(27,98,204,0.18),transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 160, height: 160, borderRadius: '50%', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(circle,rgba(57,181,74,0.08),transparent 70%)' }} />

        {/* Toggle desktop */}
        <motion.button onClick={onToggle} whileHover={{ scale: 1.18 }} whileTap={{ scale: 0.88 }}
          className="absolute z-50 hidden lg:flex items-center justify-center shadow-lg"
          style={{
            top: 28, right: -11, width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1b62cc,#083278)',
            boxShadow: '0 2px 10px rgba(27,98,204,0.6)',
            border: '1.5px solid rgba(255,255,255,0.15)',
          }}>
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={12} color="white" />
          </motion.div>
        </motion.button>

        {/* Logo */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: collapsed ? '20px 0 18px' : '18px 16px 16px',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, minWidth: 0 }}>
            <GeppiLogo collapsed={collapsed} />
            <AnimatePresence>
              {!collapsed && (
                <motion.div key="text"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }} style={{ minWidth: 0, overflow: 'hidden' }}
                >
                  <p style={{
                    margin: 0, fontSize: 16, fontWeight: 900, letterSpacing: '0.14em', lineHeight: 1,
                    background: 'linear-gradient(90deg,#39B54A,#1b62cc,#F7941D)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>{SISTEMA.NOMBRE}</p>
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                    style={{ height: 2, marginTop: 6, background: 'linear-gradient(90deg,#39B54A,#1b62cc,#F7941D)', borderRadius: 99, transformOrigin: 'left' }} />
                  <p style={{ margin: '5px 0 0', fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.38)' }}>
                    Gestión de EPP · SST
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button onClick={onClose} className="lg:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'rgba(255,255,255,0.40)', borderRadius: 8, display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 10, padding: collapsed ? '10px 6px' : '8px 10px' }}
          className="scrollbar-dark">

          {NAV_SECTIONS.map((section) => {
            const itemsFiltrados = section.items.filter(item => !item.adminOnly || isAdmin)
            if (itemsFiltrados.length === 0) return null
            const isOpen = !section.label || isSectionOpen(section.label)

            return (
              <div key={section.label || 'root'} style={{ marginBottom: collapsed ? 4 : 0 }}>

                {/* Encabezado de sección (solo en modo expandido y si tiene label) */}
                {!collapsed && section.label && (
                  <div style={{ margin: '10px 0 4px' }}>
                    <SectionHeader
                      label={section.label}
                      open={isOpen}
                      onToggle={() => toggleSection(section.label)}
                    />
                  </div>
                )}

                {/* Separador en modo collapsed */}
                {collapsed && section.label && (
                  <div style={{ height: 1, margin: '6px 6px', background: 'rgba(255,255,255,0.06)' }} />
                )}

                {/* Ítems — animados cuando colapsamos la sección */}
                <AnimatePresence initial={false}>
                  {(collapsed || isOpen) && (
                    <motion.ul
                      initial={!collapsed ? { height: 0, opacity: 0 } : false}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: 'hidden', listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {itemsFiltrados.map(item => (
                        <li key={item.path}>
                          <NavItem item={item} onClose={onClose} collapsed={collapsed} badges={badges} />
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>

              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div key="footer-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: '10px 16px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(74,222,128,0.75)', letterSpacing: '0.05em' }}>Sistema activo</span>
                </div>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
                  <span style={{ color: 'rgba(147,197,253,0.65)' }}>{SISTEMA.CODIGO_DOCUMENTO}</span>
                  {' '}· v{SISTEMA.VERSION_MATRIZ}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <UsuarioActual collapsed={collapsed} />

          <div style={{ padding: collapsed ? '4px 6px 12px' : '4px 10px 12px' }}>
            <motion.button onClick={() => logout(navigate)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 10, padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 11, border: '1px solid rgba(248,113,113,0.20)',
                background: 'rgba(220,38,38,0.08)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.18)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.40)' }}
              onMouseOut={e  => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.20)' }}
              title="Cerrar sesión"
              data-tooltip={collapsed ? 'Cerrar sesión' : undefined}
              className={collapsed ? 'sidebar-tooltip' : ''}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.15)' }}>
                <LogOut size={14} style={{ color: '#FCA5A5' }} strokeWidth={2} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 13, fontWeight: 500, color: '#FCA5A5', letterSpacing: '0.01em' }}>
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
