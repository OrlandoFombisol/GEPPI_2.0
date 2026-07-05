import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout    from '@/components/layout/Layout'
import NotFound  from '@/pages/NotFound'
import { initSeedData } from '@/db/seed'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { UserProvider, useUser }  from '@/contexts/UserContext'

// ─── Lazy loading de todas las páginas ───────────────────────────────────────
// Cada módulo se carga solo cuando el usuario navega a él.

const Login         = lazy(() => import('@/pages/Login'))
const Dashboard     = lazy(() => import('@/pages/Dashboard'))
const Empresas      = lazy(() => import('@/pages/Empresas'))
const Trabajadores  = lazy(() => import('@/pages/Trabajadores'))
const Cargos        = lazy(() => import('@/pages/Cargos'))
const MatrizEPP     = lazy(() => import('@/pages/MatrizEPP'))
const MatrizCargos  = lazy(() => import('@/pages/MatrizCargos'))
const Inventario    = lazy(() => import('@/pages/Inventario'))
const Entregas      = lazy(() => import('@/pages/Entregas'))
const Historial     = lazy(() => import('@/pages/Historial'))
const Reportes      = lazy(() => import('@/pages/Reportes'))
const Alertas       = lazy(() => import('@/pages/Alertas'))
const GestionCambio = lazy(() => import('@/pages/GestionCambio'))
const Auditoria     = lazy(() => import('@/pages/Auditoria'))
const Configuracion = lazy(() => import('@/pages/Configuracion'))
const Consolidado   = lazy(() => import('@/pages/Consolidado'))
const Checklist     = lazy(() => import('@/pages/Checklist'))
const PlanTrabajo          = lazy(() => import('@/pages/PlanTrabajo'))
const CondicionesInseguras = lazy(() => import('@/pages/CondicionesInseguras'))
const ExamenesMedicos      = lazy(() => import('@/pages/ExamenesMedicos'))
const ATIT                    = lazy(() => import('@/pages/ATIT'))
const IndicadoresCumplimiento = lazy(() => import('@/pages/IndicadoresCumplimiento'))
const SgSst0312               = lazy(() => import('@/pages/SgSst0312'))
const UsuariosRoles           = lazy(() => import('@/pages/UsuariosRoles'))
const AceptarEntrega          = lazy(() => import('@/pages/AceptarEntrega'))
const Inspecciones            = lazy(() => import('@/pages/Inspecciones'))
const Operario                = lazy(() => import('@/pages/Operario'))

// ─── Guarda de ruta ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useUser()
  if (loading) return <AppLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ─── Pantalla de carga (Suspense fallback) ───────────────────────────────────

// ─── Spinner corporativo ─────────────────────────────────────────────────────

function CorporateSpinner({ size = 28 }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: `2.5px solid transparent`,
        borderTopColor: '#1B62CC',
        borderRightColor: '#39B54A',
        animation: 'spin 0.9s linear infinite',
      }} />
      <div style={{
        position: 'absolute', inset: 3,
        borderRadius: '50%',
        border: `2px solid transparent`,
        borderTopColor: '#F7941D',
        animation: 'spin 1.4s linear infinite reverse',
      }} />
    </div>
  )
}

// ─── Pantalla de carga de módulo ─────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <CorporateSpinner size={32} />
      <p className="text-xs text-slate-400">Cargando módulo…</p>
    </div>
  )
}

// ─── Pantalla de inicialización de DB ────────────────────────────────────────

function AppLoader() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-7 relative overflow-hidden"
      style={{ background: 'linear-gradient(148deg, #eef5ff 0%, #f8fafc 50%, #f0f9f1 100%)' }}
    >
      {/* Marca de agua fondo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <img
          src="/logo.jpg" alt=""
          style={{
            position: 'absolute', bottom: -50, right: -40,
            width: 380, opacity: 0.06, transform: 'rotate(-6deg)',
            objectFit: 'contain',
          }}
        />
        {/* Resplandores */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27,98,204,0.10), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60, width: 280, height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(57,181,74,0.08), transparent 70%)',
        }} />
      </div>

      {/* Logo corporativo */}
      <div style={{ position: 'relative' }}>
        <img
          src="/logo.jpg"
          alt="GEPPI — Gestión de EPP"
          style={{ height: 80, width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Barra de progreso tricolor */}
      <div style={{
        width: 200, height: 3, borderRadius: 99,
        background: '#e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: '60%', borderRadius: 99,
          background: 'linear-gradient(90deg, #39B54A, #1b62cc, #F7941D)',
          backgroundSize: '200% auto',
          animation: 'shimmer 1.5s ease infinite',
        }} />
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: -12 }}>
        Verificando sesión…
      </p>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState(null)

  // Inicializar IndexedDB y datos de prueba al arrancar
  useEffect(() => {
    initSeedData()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error('[GEPPI] Error al iniciar DB:', e)
        setDbError(e.message)
        setDbReady(true) // permitir continuar aunque falle el seed
      })
  }, [])

  if (!dbReady) return <AppLoader />

  if (dbError) {
    console.warn('[GEPPI] DB inicializada con advertencias:', dbError)
  }

  return (
    <ThemeProvider>
    <UserProvider>
    <BrowserRouter>
      <Routes>

        {/* Ruta pública — aceptación de entrega por QR (no requiere login) */}
        <Route
          path="/aceptar/:token"
          element={<Suspense fallback={<PageLoader />}><AceptarEntrega /></Suspense>}
        />

        {/* Ruta pública — checklist preoperacional para conductores */}
        <Route
          path="/operario"
          element={<Suspense fallback={<PageLoader />}><Operario /></Suspense>}
        />

        {/* Login — pantalla de entrada */}
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />

        {/* Redirige la raíz al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Todas las rutas usan el Layout con Sidebar + Header */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          <Route
            path="/dashboard"
            element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>}
          />
          <Route
            path="/empresas"
            element={<Suspense fallback={<PageLoader />}><Empresas /></Suspense>}
          />
          <Route
            path="/trabajadores"
            element={<Suspense fallback={<PageLoader />}><Trabajadores /></Suspense>}
          />
          <Route
            path="/trabajadores/:id"
            element={<Suspense fallback={<PageLoader />}><Trabajadores /></Suspense>}
          />
          <Route
            path="/cargos"
            element={<Suspense fallback={<PageLoader />}><Cargos /></Suspense>}
          />
          <Route
            path="/matriz-epp"
            element={<Suspense fallback={<PageLoader />}><MatrizEPP /></Suspense>}
          />
          <Route
            path="/matriz-epp/:id"
            element={<Suspense fallback={<PageLoader />}><MatrizEPP /></Suspense>}
          />
          <Route
            path="/matriz-cargos"
            element={<Suspense fallback={<PageLoader />}><MatrizCargos /></Suspense>}
          />
          <Route
            path="/inventario"
            element={<Suspense fallback={<PageLoader />}><Inventario /></Suspense>}
          />
          <Route
            path="/entregas"
            element={<Suspense fallback={<PageLoader />}><Entregas /></Suspense>}
          />
          <Route
            path="/entregas/nueva"
            element={<Suspense fallback={<PageLoader />}><Entregas /></Suspense>}
          />
          <Route
            path="/historial"
            element={<Suspense fallback={<PageLoader />}><Historial /></Suspense>}
          />
          <Route
            path="/reportes"
            element={<Suspense fallback={<PageLoader />}><Reportes /></Suspense>}
          />
          <Route
            path="/alertas"
            element={<Suspense fallback={<PageLoader />}><Alertas /></Suspense>}
          />
          <Route
            path="/gestion-cambio"
            element={<Suspense fallback={<PageLoader />}><GestionCambio /></Suspense>}
          />
          <Route
            path="/auditoria"
            element={<Suspense fallback={<PageLoader />}><Auditoria /></Suspense>}
          />
          <Route
            path="/configuracion"
            element={<Suspense fallback={<PageLoader />}><Configuracion /></Suspense>}
          />
          <Route
            path="/consolidado"
            element={<Suspense fallback={<PageLoader />}><Consolidado /></Suspense>}
          />
          <Route
            path="/checklist"
            element={<Suspense fallback={<PageLoader />}><Checklist /></Suspense>}
          />
          <Route
            path="/plan-trabajo"
            element={<Suspense fallback={<PageLoader />}><PlanTrabajo /></Suspense>}
          />
          <Route
            path="/condiciones-inseguras"
            element={<Suspense fallback={<PageLoader />}><CondicionesInseguras /></Suspense>}
          />
          <Route
            path="/examenes-medicos"
            element={<Suspense fallback={<PageLoader />}><ExamenesMedicos /></Suspense>}
          />
          <Route
            path="/at-it"
            element={<Suspense fallback={<PageLoader />}><ATIT /></Suspense>}
          />
          <Route
            path="/indicadores"
            element={<Suspense fallback={<PageLoader />}><IndicadoresCumplimiento /></Suspense>}
          />
          <Route
            path="/sg-sst"
            element={<Suspense fallback={<PageLoader />}><SgSst0312 /></Suspense>}
          />
          <Route
            path="/usuarios-roles"
            element={<Suspense fallback={<PageLoader />}><UsuariosRoles /></Suspense>}
          />
          <Route
            path="/inspecciones"
            element={<Suspense fallback={<PageLoader />}><Inspecciones /></Suspense>}
          />

        </Route>

        {/* 404 — fuera del Layout para que se muestre a pantalla completa */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
    </UserProvider>
    </ThemeProvider>
  )
}
