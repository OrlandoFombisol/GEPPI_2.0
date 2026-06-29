/**
 * Contenedor tipo card del sistema GEPPI — estilo glassmorphism.
 * @param {string}    title      — título del encabezado (opcional)
 * @param {string}    subtitle   — subtítulo debajo del título
 * @param {ReactNode} action     — botón u elemento a la derecha del encabezado
 * @param {boolean}   noPadding  — sin padding en el cuerpo (útil para tablas)
 * @param {boolean}   interactive — añade hover lift animation
 * @param {string}    className
 */
export default function Card({
  title,
  subtitle,
  action,
  noPadding     = false,
  interactive   = false,
  className     = '',
  children,
}) {
  const hasHeader = title || action

  return (
    <div
      className={[
        'rounded-2xl border shadow-sm overflow-hidden',
        // Glass effect
        'backdrop-blur-sm',
        interactive ? 'card-interactive cursor-pointer' : '',
        className,
      ].join(' ')}
      style={{
        background:   'rgba(255,255,255,0.80)',
        borderColor:  'rgba(226,232,240,0.7)',
        boxShadow:    '0 2px 12px rgba(30,64,175,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Encabezado */}
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 px-5 py-4"
             style={{ borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
          {title && (
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800 truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Cuerpo */}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  )
}
