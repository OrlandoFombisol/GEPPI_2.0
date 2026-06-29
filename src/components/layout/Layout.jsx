import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar    from './Sidebar'
import Header     from './Header'
import PageBanner from '@/components/ui/PageBanner'

function Watermark() {
  return (
    <div
      className="hidden sm:block"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden', zIndex: 0 }}
      aria-hidden="true"
    >
      <div style={{
        position: 'absolute', top: -160, right: -128,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,98,204,0.09), rgba(8,50,120,0.03), transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -96, left: -80,
        width: 288, height: 288, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(57,181,74,0.07), transparent 65%)',
      }} />
      <img
        src="/logo.jpg"
        alt=""
        style={{
          position: 'absolute', top: 0, right: 0,
          height: '90vh', width: 'auto', opacity: 0.10,
        }}
      />
    </div>
  )
}

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.992 },
  enter:   { opacity: 1, y: 0,  scale: 1,     transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, scale: 0.995, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
}

export default function Layout() {
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('geppi-sidebar-collapsed') === '1'
  )
  const location    = useLocation()
  const alertasInit = useRef(false)

  // Generar alertas automáticamente al cargar el layout (una sola vez por sesión)
  useEffect(() => {
    if (alertasInit.current) return
    alertasInit.current = true
    import('@/services/alertasGenerator').then(({ generarAlertas }) => {
      generarAlertas().catch(e => console.warn('[Alertas auto]', e))
    })
  }, [])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const mq      = window.matchMedia('(min-width: 1024px)')
    const handler = (e) => { if (e.matches) setSidebarOpen(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleCollapse = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('geppi-sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      position: 'relative',
      background: 'var(--theme-bg)',
    }}>
      <Watermark />
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" style={{ zIndex: 0 }} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggle={toggleCollapse}
      />

      <div style={{
        flex: 1, minWidth: 0, display: 'flex',
        flexDirection: 'column', overflow: 'hidden',
        position: 'relative', zIndex: 10,
      }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {/* Banner universal por módulo con tips SST */}
          <PageBanner />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
