import { useState }                              from 'react'
import { Info, AlertTriangle, XCircle, X }       from 'lucide-react'

const CONFIG = {
  info:    { wrap: 'bg-blue-50   border-blue-200   text-blue-800',   Icon: Info          },
  warning: { wrap: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: AlertTriangle  },
  danger:  { wrap: 'bg-red-50    border-red-200    text-red-800',    Icon: XCircle        },
}

/**
 * Banner de alerta informativo dentro de módulos.
 * @param {'info'|'warning'|'danger'} level
 * @param {string}    message   — texto del mensaje
 * @param {boolean}   closable  — muestra botón de cierre
 * @param {string}    className
 */
export default function AlertBanner({ level = 'info', message, closable = false, className = '' }) {
  const [closed, setClosed] = useState(false)
  if (closed || !message) return null

  const { wrap, Icon } = CONFIG[level] || CONFIG.info

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        wrap,
        className,
      ].join(' ')}
    >
      <Icon size={16} className="flex-shrink-0 mt-0.5" strokeWidth={2} />
      <span className="flex-1">{message}</span>
      {closable && (
        <button
          onClick={() => setClosed(true)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
