import { ESTADO_EPP, ESTADO_EPP_DOT, ESTADO_EPP_LABEL } from '@/constants'

const DOT_SIZE = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' }

/**
 * Indicador circular de estado para tablas y listas.
 * Muestra un tooltip nativo con el nombre del estado al hacer hover.
 *
 * @param {keyof ESTADO_EPP} status  — constante de estado del EPP
 * @param {'sm'|'md'|'lg'}   size
 * @param {string}           tooltip — texto personalizado (sobreescribe el label del estado)
 * @param {string}           className
 */
export default function StatusDot({ status, size = 'md', tooltip, className = '' }) {
  const dotColor  = ESTADO_EPP_DOT[status]  || 'bg-slate-300'
  const label     = tooltip || ESTADO_EPP_LABEL[status] || status || ''
  const sizeClass = DOT_SIZE[size] || DOT_SIZE.md

  return (
    <span
      title={label}
      aria-label={label}
      className={[
        'inline-block rounded-full flex-shrink-0',
        sizeClass,
        dotColor,
        status === ESTADO_EPP.VENCIDO       ? 'animate-pulse' : '',
        status === ESTADO_EPP.PROXIMO_VENCER ? 'animate-pulse' : '',
        className,
      ].join(' ')}
    />
  )
}
