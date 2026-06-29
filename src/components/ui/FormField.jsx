/**
 * Wrapper de campo de formulario con label, error y hint.
 * Uso: <FormField label="Nombre" required error={errors.nombre?.message}><Input .../></FormField>
 */
export function FormField({ label, required, error, hint, children, className = '' }) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      {label && (
        <label className="text-sm font-medium text-slate-700 select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const BASE = [
  'w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
  'placeholder:text-slate-400 bg-white',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
  'transition-colors duration-150',
].join(' ')

const borderClass = (error) =>
  error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-300'

/** Input de texto estilizado para GEPPI */
export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={[BASE, borderClass(error), className].join(' ')}
      {...props}
    />
  )
}

/** Textarea estilizado */
export function Textarea({ error, rows = 3, className = '', ...props }) {
  return (
    <textarea
      rows={rows}
      className={[BASE, borderClass(error), 'resize-none', className].join(' ')}
      {...props}
    />
  )
}

/** Select estilizado */
export function Select({ error, children, className = '', ...props }) {
  return (
    <select
      className={[BASE, borderClass(error), 'cursor-pointer', className].join(' ')}
      {...props}
    >
      {children}
    </select>
  )
}

/** Input de fecha estilizado */
export function DateInput({ error, className = '', ...props }) {
  return (
    <input
      type="date"
      className={[BASE, borderClass(error), className].join(' ')}
      {...props}
    />
  )
}

export default FormField
