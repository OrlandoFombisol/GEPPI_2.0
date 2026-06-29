import { useState }           from 'react'
import { AlertTriangle }      from 'lucide-react'
import { Modal, Button }      from '@/components/ui'

export default function AnularModal({ entrega, onConfirmar, onClose, saving = false }) {
  const [motivo, setMotivo] = useState('')
  const [error,  setError]  = useState('')

  const handleConfirmar = () => {
    if (motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      return
    }
    setError('')
    onConfirmar(motivo.trim())
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Anular entrega"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmar} loading={saving}>
            Confirmar anulación
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-3 items-start p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            La anulación es <strong>irreversible</strong>. El acta quedará marcada como
            anulada y no podrá reactivarse. El stock <strong>no</strong> se restaura automáticamente.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Motivo de anulación <span className="text-red-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            rows={3}
            placeholder="Describe por qué se anula esta entrega (mínimo 10 caracteres)…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                       text-slate-900 placeholder:text-slate-400 bg-white resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
                       transition-colors"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </Modal>
  )
}
