import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const GRADIENT_MAP = {
  primary: {
    iconBg: 'linear-gradient(135deg, #1b62cc 0%, #083278 100%)',
    glow:   'rgba(27,98,204,0.28)', accent: '#083278',
    card:   'rgba(238,245,255,0.68)', border: 'rgba(165,202,255,0.65)',
  },
  success: {
    iconBg: 'linear-gradient(135deg, #39B54A 0%, #2A8C38 100%)',
    glow:   'rgba(57,181,74,0.28)', accent: '#1f7a2c',
    card:   'rgba(237,252,240,0.68)', border: 'rgba(157,220,165,0.65)',
  },
  warning: {
    iconBg: 'linear-gradient(135deg, #F7941D 0%, #D97706 100%)',
    glow:   'rgba(247,148,29,0.28)', accent: '#b45309',
    card:   'rgba(255,247,232,0.68)', border: 'rgba(253,186,116,0.65)',
  },
  danger: {
    iconBg: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    glow:   'rgba(248,113,113,0.25)', accent: '#dc2626',
    card:   'rgba(254,242,242,0.68)', border: 'rgba(252,165,165,0.65)',
  },
  orange: {
    iconBg: 'linear-gradient(135deg, #F7941D 0%, #ea580c 100%)',
    glow:   'rgba(247,148,29,0.28)', accent: '#c2410c',
    card:   'rgba(255,247,237,0.68)', border: 'rgba(253,186,116,0.65)',
  },
  neutral: {
    iconBg: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    glow:   'rgba(148,163,184,0.2)', accent: '#475569',
    card:   'rgba(248,250,252,0.68)', border: 'rgba(226,232,240,0.7)',
  },
  green: {
    iconBg: 'linear-gradient(135deg, #39B54A 0%, #2A8C38 100%)',
    glow:   'rgba(57,181,74,0.25)', accent: '#1f7a2c',
    card:   'rgba(237,252,240,0.68)', border: 'rgba(157,220,165,0.65)',
  },
  yellow: {
    iconBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    glow:   'rgba(251,191,36,0.22)', accent: '#b45309',
    card:   'rgba(255,251,235,0.68)', border: 'rgba(253,230,138,0.65)',
  },
  red: {
    iconBg: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
    glow:   'rgba(248,113,113,0.22)', accent: '#dc2626',
    card:   'rgba(254,242,242,0.68)', border: 'rgba(252,165,165,0.65)',
  },
}

// Anima un número de 0 al valor objetivo
function useCountUp(target, duration = 900) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const numeric = typeof target === 'number' ? target : parseInt(String(target).replace(/\D/g, ''), 10)
    if (isNaN(numeric) || numeric === 0) { setDisplay(target); return }

    const start = performance.now()
    const step  = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      const current  = Math.round(eased * numeric)
      setDisplay(typeof target === 'string' ? String(target).replace(/\d+/, current) : current)
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return display
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  trend,
  trendLabel = 'vs mes anterior',
  color      = 'primary',
  className  = '',
  delay      = 0,
}) {
  const g           = GRADIENT_MAP[color] || GRADIENT_MAP.primary
  const TrendIcon   = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor  = trend > 0 ? '#16a34a' : trend < 0 ? '#dc2626' : '#94a3b8'
  const displayVal  = useCountUp(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -5,
        boxShadow: `0 16px 36px ${g.glow}, 0 4px 12px rgba(0,0,0,0.08)`,
        transition: { duration: 0.22 },
      }}
      className={['rounded-2xl border overflow-hidden backdrop-blur-sm cursor-default', className].join(' ')}
      style={{
        background:  g.card,
        borderColor: g.border,
        boxShadow:   `0 2px 14px ${g.glow}, 0 1px 4px rgba(0,0,0,0.04)`,
      }}
    >
      {/* Barra superior animada */}
      <motion.div
        className="h-1 w-full"
        style={{ background: g.iconBg }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: g.iconBg, transformOrigin: 'left', height: 4 }}
      />

      <div className="flex items-start gap-4 p-5">
        {Icon && (
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.1, type: 'spring', stiffness: 280, damping: 18 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: g.iconBg, boxShadow: `0 4px 14px ${g.glow}` }}
          >
            <Icon size={20} className="text-white" strokeWidth={2} />
          </motion.div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate mb-1">{label}</p>
          <motion.p
            className="text-2xl font-black tabular-nums leading-none"
            style={{ color: g.accent }}
          >
            {displayVal ?? '—'}
          </motion.p>

          {trend !== undefined && trend !== null && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.4, duration: 0.3 }}
              className="flex items-center gap-1 mt-2 text-xs font-semibold"
              style={{ color: trendColor }}
            >
              <TrendIcon size={12} strokeWidth={2.5} />
              <span>
                {trend > 0 ? '+' : ''}{trend}
                {trendLabel && (
                  <span className="text-slate-400 font-normal ml-1 text-[10px]">{trendLabel}</span>
                )}
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
