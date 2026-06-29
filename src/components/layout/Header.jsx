import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, Bell, ChevronRight, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
const logoPng = '/logo.jpg'
import { useAlertasBadge }   from '@/hooks/useAlertasBadge'
import { useTheme }          from '@/contexts/ThemeContext'
import { useUser }           from '@/contexts/UserContext'
import UserProfileModal      from '@/components/ui/UserProfileModal'
import { ROL_LABEL }         from '@/constants'

const PAGE_META = {
  '/dashboard':       { title: 'Dashboard',            parent: null           },
  '/empresas':        { title: 'Empresas y Sedes',      parent: null           },
  '/trabajadores':    { title: 'Trabajadores',           parent: null           },
  '/cargos':          { title: 'Cargos',                 parent: null           },
  '/matriz-epp':      { title: 'Matriz Técnica de EPP',  parent: 'EPP'          },
  '/matriz-cargos':   { title: 'Matriz por Cargos',      parent: 'EPP'          },
  '/inventario':      { title: 'Inventario',             parent: 'Operaciones'  },
  '/entregas/nueva':  { title: 'Nueva Entrega',          parent: 'Operaciones'  },
  '/historial':       { title: 'Historial de Entregas',  parent: 'Operaciones'  },
  '/reportes':        { title: 'Reportes',               parent: null           },
  '/alertas':         { title: 'Alertas',                parent: null           },
  '/gestion-cambio':  { title: 'Gestión del Cambio',     parent: 'Sistema'      },
  '/auditoria':       { title: 'Auditoría',              parent: 'Sistema'      },
  '/configuracion':   { title: 'Configuración',          parent: 'Sistema'      },
}

function AlertsBadge({ count }) {
  if (count === 0) return null
  return (
    <span
      className="absolute -top-1 -right-1 min-w-[16px] h-4 text-white
                 text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
      style={{ background: 'linear-gradient(135deg, #F7941D, #D97706)' }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function Header({ onMenuClick }) {
  const location              = useLocation()
  const { count: alertCount } = useAlertasBadge()
  const { isDark, toggle }    = useTheme()
  const { user }              = useUser()
  const [profileOpen, setProfileOpen] = useState(false)

  const currentMeta = Object.entries(PAGE_META).find(([path]) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path)
  )
  const meta = currentMeta ? currentMeta[1] : { title: 'GEPPI', parent: null }

  return (
    <>
      <header
        className="sticky top-0 z-10 h-14 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-5"
        style={{
          background:           'var(--theme-header-bg)',
          backdropFilter:       'blur(16px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
          borderBottom:         '1px solid var(--theme-border)',
          boxShadow:            '0 1px 12px rgba(27,98,204,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {/* Hamburguesa — móvil */}
        <button onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--theme-text-mid)' }}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Logo móvil */}
        <Link to="/dashboard" className="lg:hidden flex items-center gap-2 flex-shrink-0">
          <div style={{ width:28, height:28, background:'rgba(255,255,255,0.95)',
                        borderRadius:8, padding:2, boxShadow:'0 2px 8px rgba(27,98,204,0.25)' }}>
            <img src={logoPng} alt="GEPPI" style={{ width:'100%', height:'100%', objectFit:'contain' }}/>
          </div>
          <span className="text-sm font-black tracking-wider"
            style={{ background:'linear-gradient(90deg,#39B54A,#1b62cc,#F7941D)',
                     WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            GEPPI
          </span>
        </Link>

        {/* Breadcrumb */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {meta.parent && (
            <>
              <span className="text-xs hidden sm:block" style={{ color:'var(--theme-text-faint)' }}>
                {meta.parent}
              </span>
              <ChevronRight size={13} className="hidden sm:block flex-shrink-0"
                style={{ color:'var(--theme-text-faint)' }}/>
            </>
          )}
          <h1 className="text-sm font-bold truncate"
            style={{ background:'linear-gradient(135deg,#083278,#1b62cc)',
                     WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            {meta.title}
          </h1>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">

          {/* Bell */}
          <Link to="/alertas"
            className="relative p-2 rounded-xl transition-all duration-150"
            style={{ color: 'var(--theme-text-mid)' }}
            aria-label="Alertas"
          >
            <Bell size={18} strokeWidth={alertCount > 0 ? 2.2 : 1.8} />
            <AlertsBadge count={alertCount} />
          </Link>

          {/* Toggle tema */}
          <motion.button onClick={toggle}
            whileHover={{ scale:1.12 }} whileTap={{ scale:0.92 }}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            className="relative p-2 rounded-xl"
            style={{
              background: isDark ? 'rgba(27,98,204,0.12)' : 'rgba(27,98,204,0.08)',
              border: '1px solid var(--theme-border)',
              color: isDark ? '#4A9EFF' : '#1B62CC',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={isDark ? 'sun' : 'moon'}
                initial={{ rotate:-30, opacity:0, scale:0.7 }}
                animate={{ rotate:0, opacity:1, scale:1 }}
                exit={{ rotate:30, opacity:0, scale:0.7 }}
                transition={{ duration:0.22 }}>
                {isDark ? <Sun size={15} strokeWidth={2}/> : <Moon size={15} strokeWidth={2}/>}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Separador */}
          <div className="w-px h-6 hidden sm:block" style={{ background:'var(--theme-border)' }}/>

          {/* Avatar clicable → modal de perfil */}
          <motion.button
            onClick={() => setProfileOpen(true)}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            className="flex items-center gap-2.5 pl-1 rounded-xl py-1 pr-2 transition-all"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--theme-border)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'transparent'}
            title="Editar perfil"
          >
            {/* Avatar con foto o iniciales */}
            <div style={{
              width:32, height:32, borderRadius:'50%', overflow:'hidden',
              flexShrink:0, position:'relative',
              background: user.foto ? 'transparent' : 'linear-gradient(135deg,#1b62cc,#083278)',
              boxShadow:'0 2px 8px rgba(27,98,204,0.40)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              {user.foto
                ? <img src={user.foto} alt={user.nombre}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <span style={{ color:'white', fontSize:11, fontWeight:800 }}>
                    {user.iniciales}
                  </span>
              }
            </div>

            {/* Nombre */}
            <div className="hidden md:block text-left min-w-0">
              <p className="text-xs font-semibold leading-none truncate"
                style={{ color:'var(--theme-text)', maxWidth:110 }}>
                {user.nombre}
              </p>
              <p className="text-[10px] leading-none mt-0.5"
                style={{ color:'var(--theme-text-faint)' }}>
                {ROL_LABEL?.[user.rol] ?? user.rol}
              </p>
            </div>
          </motion.button>
        </div>
      </header>

      {/* Modal de perfil */}
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
