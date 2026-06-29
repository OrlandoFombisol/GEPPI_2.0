import { Loader2 } from 'lucide-react'

// ─── Variantes ────────────────────────────────────────────────────────────────
const VARIANTS = {
  primary:   'text-white border-transparent',
  secondary: 'bg-white/70 text-slate-700 hover:bg-white/90 focus-visible:ring-slate-400 border-slate-200/80 backdrop-blur-sm',
  danger:    'text-white border-transparent',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-slate-400 border-transparent',
  outline:   'bg-white/70 text-slate-700 hover:bg-white/90 focus-visible:ring-primary-500 border-slate-200/80 backdrop-blur-sm',
}

// Estilos inline para variantes con gradiente
// Paleta corporativa GEPPI
const VARIANT_STYLE = {
  primary: { background: 'linear-gradient(135deg, #1b62cc 0%, #083278 100%)', boxShadow: '0 4px 14px rgba(27,98,204,0.40)' },
  danger:  { background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)', boxShadow: '0 4px 14px rgba(220,38,38,0.30)' },
}

// ─── Tamaños ─────────────────────────────────────────────────────────────────
const SIZES = {
  sm: 'h-7  px-3   text-xs  gap-1.5',
  md: 'h-9  px-4   text-sm  gap-2',
  lg: 'h-11 px-5   text-base gap-2',
}

const ICON_SIZES = { sm: 13, md: 15, lg: 17 }

/**
 * Botón base del sistema GEPPI.
 * @param {'primary'|'secondary'|'danger'|'ghost'|'outline'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading  — muestra spinner y deshabilita el botón
 * @param {React.ElementType} iconLeft  — ícono Lucide a la izquierda del texto
 * @param {React.ElementType} iconRight — ícono Lucide a la derecha del texto
 * @param {string} className — clases adicionales
 */
export default function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  iconLeft:  IconLeft,
  iconRight: IconRight,
  children,
  className = '',
  type      = 'button',
  ...props
}) {
  const isDisabled = disabled || loading
  const iconSize   = ICON_SIZES[size]

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium rounded-xl border',
        'transition-all duration-150 select-none whitespace-nowrap',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size]       || SIZES.md,
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        // Hover lift for solid variants
        (variant === 'primary' || variant === 'danger') && !isDisabled
          ? 'hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg' : '',
        className,
      ].join(' ')}
      style={VARIANT_STYLE[variant] || undefined}
      {...props}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin flex-shrink-0" />
        : IconLeft && <IconLeft size={iconSize} className="flex-shrink-0" strokeWidth={2} />
      }
      {children && <span className="truncate">{children}</span>}
      {!loading && IconRight && (
        <IconRight size={iconSize} className="flex-shrink-0" strokeWidth={2} />
      )}
    </button>
  )
}
