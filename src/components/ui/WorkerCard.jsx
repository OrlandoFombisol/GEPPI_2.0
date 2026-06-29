import { motion } from 'framer-motion'
import { HardHat, Building2, CheckCircle2, Clock } from 'lucide-react'

const WORKER_IMGS = [
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80',
]

const STATUS_CFG = {
  ACTIVO:   { label: 'Activo',   bg: 'rgba(57,181,74,0.12)',  text: '#39B54A', icon: CheckCircle2 },
  INACTIVO: { label: 'Inactivo', bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', icon: Clock        },
  PENDIENTE:{ label: 'Pendiente',bg: 'rgba(247,148,29,0.12)', text: '#F7941D', icon: Clock        },
}

export default function WorkerCard({ trabajador, index = 0, onClick }) {
  const imgSrc = WORKER_IMGS[index % WORKER_IMGS.length]
  const status = STATUS_CFG[trabajador?.estado] || STATUS_CFG.ACTIVO
  const StatusIcon = status.icon

  const initials = (trabajador?.nombre || 'NN')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(27,98,204,0.16)' }}
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid rgba(226,232,240,0.8)',
        transition: 'box-shadow 0.25s',
      }}
    >
      {/* Franja superior de color */}
      <div style={{
        height: 5,
        background: 'linear-gradient(90deg, #39B54A, #1b62cc, #F7941D)',
      }} />

      <div className="p-4">
        {/* Avatar */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={imgSrc}
              alt={trabajador?.nombre}
              className="w-12 h-12 rounded-xl object-cover"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div
              className="w-12 h-12 rounded-xl items-center justify-center text-white font-bold text-sm hidden"
              style={{ background: 'linear-gradient(135deg, #1b62cc, #083278)' }}
            >
              {initials}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {trabajador?.nombre || 'Sin nombre'}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {trabajador?.cargo || 'Sin cargo'}
            </p>
          </div>

          {/* Badge estado */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: status.bg }}
          >
            <StatusIcon size={10} style={{ color: status.text }} />
            <span className="text-[10px] font-semibold" style={{ color: status.text }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Info extra */}
        <div className="mt-3 pt-3 flex items-center gap-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Building2 size={11} className="text-slate-400" />
            <span className="truncate max-w-[100px]">{trabajador?.empresa || 'Sin empresa'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 ml-auto">
            <HardHat size={11} className="text-primary-500" style={{ color: '#1b62cc' }} />
            <span>{trabajador?.eppAsignados ?? 0} EPP</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
