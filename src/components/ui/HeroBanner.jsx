import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Shield, TrendingUp, CheckCircle2 } from 'lucide-react'

const BANNER_IMG = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=75'

const pillVariants = {
  hidden:  { opacity: 0, y: 16, scale: 0.9 },
  visible: i => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

export default function HeroBanner({ stats = {} }) {
  const now  = new Date()
  const hora = now.getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'
  const fecha  = format(now, "EEEE d 'de' MMMM", { locale: es })

  const pills = [
    { icon: Shield,       label: 'Sistema activo',            color: '#39B54A' },
    { icon: TrendingUp,   label: `${stats.entregas ?? 0} entregas hoy`, color: '#1b62cc' },
    { icon: CheckCircle2, label: `${stats.alertas ?? 0} alertas pendientes`, color: '#F7941D' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ minHeight: 180 }}
    >
      {/* Imagen de fondo */}
      <img
        src={BANNER_IMG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={e => { e.target.style.display = 'none' }}
      />

      {/* Overlay degradado */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(110deg, rgba(8,50,120,0.88) 0%, rgba(27,98,204,0.72) 50%, rgba(57,181,74,0.55) 100%)',
        }}
      />

      {/* Patrón decorativo */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />

      {/* Contenido */}
      <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* Texto izquierdo */}
        <div>
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="text-white/70 text-xs font-medium capitalize"
          >
            {fecha}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="text-white text-2xl font-black mt-0.5"
          >
            {saludo}, Administrador
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.26, duration: 0.45 }}
            className="text-white/60 text-xs mt-1"
          >
            Aquí tienes el resumen operativo de hoy
          </motion.p>
        </div>

        {/* Pills de estado */}
        <div className="flex flex-wrap gap-2">
          {pills.map(({ icon: Icon, label, color }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={pillVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <Icon size={13} style={{ color }} strokeWidth={2.2} />
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
