import { PackageSearch } from 'lucide-react'

/**
 * Estado vacío reutilizable para tablas, listas y módulos sin datos.
 * @param {string}            title       — título del estado vacío
 * @param {string}            description — descripción o instrucción
 * @param {React.ElementType} icon        — ícono Lucide (default: PackageSearch)
 * @param {{ label: string, onClick: ()=>void }} action — botón de acción opcional
 * @param {string}            className
 */
export default function EmptyState({
  title       = 'Sin registros',
  description = 'No hay datos disponibles para mostrar.',
  icon: Icon  = PackageSearch,
  action,
  className   = '',
}) {
  return (
    <div className={[
      'flex flex-col items-center justify-center py-14 px-6 text-center',
      className,
    ].join(' ')}>

      {/* Ícono */}
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-400" strokeWidth={1.5} />
      </div>

      {/* Texto */}
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{description}</p>
      )}

      {/* Acción */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 bg-primary-800 text-white
                     px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900
                     transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
