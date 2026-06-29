// ─── Variantes del sistema GEPPI — Paleta corporativa ─────────────────────────
// Verde seguridad #39B54A | Azul cobalto #1B62CC | Naranja #F7941D
const VARIANTS = {
  // EPP semáforo
  vigente:        'border',   // inline styles below
  proximoVencer:  'border',
  vencido:        'bg-red-100    text-red-800    border-red-200',
  pendiente:      'bg-slate-100  text-slate-600  border-slate-200',
  sinEntrega:     'bg-slate-100  text-slate-500  border-slate-200',
  // Inventario
  bajoStock:      'border',   // naranja corporativo via inline
  agotado:        'bg-red-200    text-red-900    border-red-300',
  stockOk:        'border',   // verde corporativo via inline
  // Entregas
  firmada:        'border',
  anulada:        'bg-red-100    text-red-700    border-red-200',
  pendiente_e:    'bg-slate-100  text-slate-600  border-slate-200',
  // Genéricos corporativos
  success:        'border',   // verde corporativo
  warning:        'border',   // naranja corporativo
  danger:         'bg-red-100    text-red-800    border-red-200',
  info:           'border',   // azul cobalto
  primary:        'border',   // azul cobalto oscuro
  neutral:        'bg-slate-100  text-slate-700  border-slate-200',
  // Roles
  administrador:  'bg-purple-100 text-purple-800 border-purple-200',
  sst:            'border',   // azul cobalto
  almacen:        'border',   // naranja corporativo
  supervisor:     'bg-teal-100   text-teal-800   border-teal-200',
  trabajador:     'bg-slate-100  text-slate-700  border-slate-200',
}

// Estilos inline para variantes con colores corporativos exactos
const VARIANT_INLINE = {
  vigente:       { background: 'rgba(57,181,74,0.12)',   color: '#1f7a2c', borderColor: 'rgba(57,181,74,0.35)'  },
  stockOk:       { background: 'rgba(57,181,74,0.12)',   color: '#1f7a2c', borderColor: 'rgba(57,181,74,0.35)'  },
  firmada:       { background: 'rgba(57,181,74,0.12)',   color: '#1f7a2c', borderColor: 'rgba(57,181,74,0.35)'  },
  success:       { background: 'rgba(57,181,74,0.12)',   color: '#1f7a2c', borderColor: 'rgba(57,181,74,0.35)'  },
  proximoVencer: { background: 'rgba(247,148,29,0.12)',  color: '#92400e', borderColor: 'rgba(247,148,29,0.35)' },
  bajoStock:     { background: 'rgba(247,148,29,0.12)',  color: '#92400e', borderColor: 'rgba(247,148,29,0.35)' },
  warning:       { background: 'rgba(247,148,29,0.12)',  color: '#92400e', borderColor: 'rgba(247,148,29,0.35)' },
  almacen:       { background: 'rgba(247,148,29,0.12)',  color: '#92400e', borderColor: 'rgba(247,148,29,0.35)' },
  info:          { background: 'rgba(27,98,204,0.10)',   color: '#083278', borderColor: 'rgba(27,98,204,0.30)'  },
  primary:       { background: 'rgba(27,98,204,0.10)',   color: '#083278', borderColor: 'rgba(27,98,204,0.30)'  },
  sst:           { background: 'rgba(27,98,204,0.10)',   color: '#083278', borderColor: 'rgba(27,98,204,0.30)'  },
}

const SIZES = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded',
  md: 'text-xs     px-2   py-0.5 rounded-md',
}

/**
 * Badge de estado del sistema GEPPI.
 * @param {keyof VARIANTS} variant
 * @param {'sm'|'md'} size
 * @param {string} className
 */
export default function Badge({ variant = 'neutral', size = 'md', children, className = '' }) {
  const colors     = VARIANTS[variant]     || VARIANTS.neutral
  const inlineStyle = VARIANT_INLINE[variant] || {}

  return (
    <span
      className={[
        'inline-flex items-center font-medium border whitespace-nowrap',
        colors,
        SIZES[size] || SIZES.md,
        className,
      ].join(' ')}
      style={Object.keys(inlineStyle).length ? inlineStyle : undefined}
    >
      {children}
    </span>
  )
}
