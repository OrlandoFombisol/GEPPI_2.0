import { useEffect, useCallback } from 'react'
import { createPortal }           from 'react-dom'
import { X }                      from 'lucide-react'

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

export default function Modal({
  open,
  onClose,
  title,
  icon,
  color,
  size            = 'md',
  closeOnBackdrop = true,
  footer,
  className       = '',
  children,
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const Icon = icon

  return createPortal(
    <div
      className={[
        'fixed inset-0 z-50 flex',
        'items-end sm:items-center',
        'justify-center',
        'p-0 sm:p-4',
      ].join(' ')}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={[
          'relative z-10 w-full flex flex-col',
          'bg-white shadow-2xl',
          'rounded-t-2xl rounded-b-none',
          'max-h-[92vh]',
          'sm:rounded-2xl',
          'sm:max-h-[90vh]',
          SIZES[size] || SIZES.md,
          'animate-slide-up',
          className,
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tirador — solo en móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        {title && (color ? (
          // ── Header con color de módulo ────────────────────────────────────
          <div style={{
            padding: '13px 16px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, borderRadius: '16px 16px 0 0',
            boxShadow: `0 2px 12px ${color}44`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
              {Icon && (
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={17} color="white" strokeWidth={2.2} />
                </div>
              )}
              <h2 id="modal-title" style={{
                margin: 0, fontSize: 15, fontWeight: 700,
                color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginLeft: 10,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} color="rgba(255,255,255,0.9)" />
            </button>
          </div>
        ) : (
          // ── Header neutro (sin color) ─────────────────────────────────────
          <div className="flex items-center justify-between px-5 py-3.5 sm:py-4
                          border-b border-slate-100 flex-shrink-0">
            <h2 id="modal-title" className="text-base font-semibold text-slate-900 truncate pr-4">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600
                         hover:bg-slate-100 transition-colors flex-shrink-0
                         min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        ))}

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4
                          border-t border-slate-100 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
