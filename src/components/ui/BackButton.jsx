import { ArrowLeft } from 'lucide-react'

export default function BackButton({ onClick, label = 'Volver al listado', disabled = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
        'bg-primary-50 border border-primary-200 text-primary-700',
        'hover:bg-primary-100 hover:border-primary-400',
        'font-semibold text-sm transition-all select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
    >
      <ArrowLeft size={15} strokeWidth={2.5} className="flex-shrink-0" />
      {label}
    </button>
  )
}
