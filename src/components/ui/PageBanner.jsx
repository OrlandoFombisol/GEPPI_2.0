import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronRight } from 'lucide-react'

// ── Imagen y título por ruta ──────────────────────────────────────────────────
const ROUTE_CONFIG = {
  '/dashboard': {
    img:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=75',
    title: 'Panel de Control',
    color: '#1B62CC',
  },
  '/empresas': {
    img:   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=75',
    title: 'Empresas y Sedes',
    color: '#083278',
  },
  '/trabajadores': {
    img:   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1400&q=75',
    title: 'Trabajadores',
    color: '#1B62CC',
  },
  '/cargos': {
    img:   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=75',
    title: 'Cargos',
    color: '#39B54A',
  },
  '/matriz-epp': {
    img:   'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=1400&q=75',
    title: 'Matriz Técnica de EPP',
    color: '#F7941D',
  },
  '/matriz-cargos': {
    img:   'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=1400&q=75',
    title: 'Matriz por Cargos',
    color: '#083278',
  },
  '/inventario': {
    img:   'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=75',
    title: 'Inventario',
    color: '#39B54A',
  },
  '/entregas': {
    img:   'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=75',
    title: 'Entregas de EPP',
    color: '#1B62CC',
  },
  '/historial': {
    img:   'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=75',
    title: 'Historial de Entregas',
    color: '#083278',
  },
  '/reportes': {
    img:   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=75',
    title: 'Reportes SST',
    color: '#1B62CC',
  },
  '/alertas': {
    img:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=75',
    title: 'Alertas Activas',
    color: '#dc2626',
  },
  '/gestion-cambio': {
    img:   'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=75',
    title: 'Gestión del Cambio',
    color: '#F7941D',
  },
  '/auditoria': {
    img:   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=75',
    title: 'Auditoría',
    color: '#083278',
  },
  '/configuracion': {
    img:   'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=75',
    title: 'Configuración',
    color: '#39B54A',
  },
  '/inspecciones': {
    img:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=75',
    title: 'Inspecciones de Seguridad',
    color: '#0369a1',
  },
}

// ── Tips SST aleatorios ───────────────────────────────────────────────────────
const TIPS = [
  'El 95 % de los accidentes laborales son prevenibles con EPP adecuado y capacitación constante.',
  'Inspecciona tu casco antes de cada turno: busca grietas, deformaciones o impactos previos.',
  'Los guantes de protección deben cambiarse al primer signo de deterioro o contaminación.',
  'La Resolución 0312 de 2019 establece los estándares mínimos del SG-SST. ¿Estás al día?',
  'Nunca modifiques tu EPP. Cualquier adaptación puede invalidar su certificación.',
  'Ante un incidente, repórtalo de inmediato aunque no haya lesionados. Los casi-accidentes salvan vidas.',
  'El calzado de seguridad con puntera de acero reduce el riesgo de aplastamiento en un 85 %.',
  'Verifica la fecha de vencimiento de tu EPP. Un equipo caducado no protege.',
  'Un arnés de seguridad debe inspeccionarse cada seis meses o después de una caída.',
  'El ruido laboral por encima de 85 dB requiere protección auditiva obligatoria.',
  'La norma GTC 45 es tu aliada para identificar y controlar peligros en el lugar de trabajo.',
  'Mantén tu área de trabajo ordenada. El desorden es la causa número uno de tropiezos.',
  'Los EPP de segunda mano no deben usarse. No conoces su historial de uso y daños.',
  'El sistema de bloqueado/etiquetado (LOTO) previene energización accidental. Úsalo siempre.',
  'Una buena iluminación en el área de trabajo reduce los errores y los accidentes en un 30 %.',
  'Reportar condiciones inseguras es responsabilidad de todos, no solo del área de seguridad.',
  'El uso correcto del cinturón en vehículos de empresa es de cumplimiento obligatorio en Colombia.',
  'Los extintores deben estar accesibles, sin obstrucciones y con mantenimiento vigente.',
  'Hidratarse bien durante la jornada reduce la fatiga y mejora la concentración en altura.',
  'El Decreto 1072 de 2015 regula el Sistema de Gestión de Seguridad y Salud en el Trabajo.',
  'Una inspección semanal de herramientas evita el 40 % de los accidentes por fallo de equipo.',
  'Antes de subir una escalera, verifica que esté asegurada y en buen estado estructural.',
  'La señalización de seguridad no es decoración: úsala correctamente y mantenla visible.',
  'Recuerda: cero accidentes no es un sueño, es una meta alcanzable con disciplina y EPP.',
  'Los riesgos ergonómicos causan el 30 % de las incapacidades laborales. Cuida tu postura.',
]

function getRandomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function findConfig(pathname) {
  const exact = ROUTE_CONFIG[pathname]
  if (exact) return exact
  const match = Object.entries(ROUTE_CONFIG).find(([k]) => pathname.startsWith(k))
  return match ? match[1] : ROUTE_CONFIG['/dashboard']
}

export default function PageBanner() {
  const location          = useLocation()
  const config            = findConfig(location.pathname)
  const [tip, setTip]     = useState(getRandomTip)
  const [show, setShow]   = useState(true)

  const rotateTip = useCallback(() => {
    setShow(false)
    setTimeout(() => { setTip(getRandomTip()); setShow(true) }, 380)
  }, [])

  useEffect(() => {
    const t = setInterval(rotateTip, 9000)
    return () => clearInterval(t)
  }, [rotateTip])

  // Cambiar tip al cambiar de página
  useEffect(() => {
    setShow(false)
    setTimeout(() => { setTip(getRandomTip()); setShow(true) }, 200)
  }, [location.pathname])

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative', width: '100%', minHeight: 172,
        overflow: 'hidden', borderRadius: 0,
      }}
    >
      {/* Imagen de fondo — más visible */}
      <motion.img
        key={config.img}
        src={config.img}
        alt=""
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.75 }}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: 'center 30%',
          filter: 'brightness(0.52) saturate(0.85)',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />

      {/* Overlay — más transparente para dejar ver la imagen */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(105deg,
          ${config.color}bb 0%,
          ${config.color}66 45%,
          rgba(0,0,0,0.22) 100%)`,
      }}/>

      {/* Degradado lateral izquierdo para mejorar legibilidad del texto */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
      }}/>

      {/* Patrón puntitos */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}/>

      {/* Contenido — centrado verticalmente */}
      <div style={{
        position: 'absolute', inset: 0,
        zIndex: 2, padding: '0 24px 0 28px',
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        {/* Título del módulo */}
        <div style={{ flexShrink: 0 }}>
          <p style={{
            margin: 0, color: 'rgba(255,255,255,0.7)',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            MÓDULO ACTIVO
          </p>
          <h2 style={{
            margin: '3px 0 0', color: 'white',
            fontSize: 22, fontWeight: 900, lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}>
            {config.title}
          </h2>
        </div>

        {/* Divisor */}
        <div style={{
          width: 1, height: 52, flexShrink: 0,
          background: 'rgba(255,255,255,0.28)',
        }}/>

        {/* Tip SST */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Lightbulb size={16} color="#F7941D" strokeWidth={2.2} />
            </motion.div>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 2px', color: 'rgba(255,255,255,0.6)',
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em' }}>
              CONSEJO SST
            </p>
            <AnimatePresence mode="wait">
              {show && (
                <motion.p
                  key={tip}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    margin: 0, color: 'rgba(255,255,255,0.9)',
                    fontSize: 12, lineHeight: 1.45, fontWeight: 500,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}
                >
                  {tip}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Botón siguiente tip */}
        <motion.button
          onClick={rotateTip}
          whileHover={{ scale: 1.12, background: 'rgba(255,255,255,0.22)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white',
          }}
          title="Siguiente consejo"
        >
          <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* Barra de progreso del tip (9s) */}
      <motion.div
        key={tip}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 9, ease: 'linear' }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: 'rgba(255,255,255,0.35)',
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  )
}
