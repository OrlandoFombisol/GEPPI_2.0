import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Copy, Download, CheckCheck } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

export default function QrAccesoModal({ onClose }) {
  const url = `${window.location.origin}/operario`
  const [qrSrc,   setQrSrc]   = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrSrc)
  }, [url])

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2200)
  }

  function descargar() {
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = 'GEPPI_checklist_operario.png'
    a.click()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="QR — Acceso al checklist"
      icon={QrCode}
      color="#1B62CC"
      size="sm"
      footer={
        <div className="flex gap-2 w-full">
          <Button
            variant="secondary"
            iconLeft={copiado ? CheckCheck : Copy}
            onClick={copiar}
            className="flex-1"
          >
            {copiado ? 'Copiado' : 'Copiar enlace'}
          </Button>
          <Button
            iconLeft={Download}
            onClick={descargar}
            disabled={!qrSrc}
            className="flex-1"
          >
            Descargar PNG
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">

        {/* QR */}
        <div style={{
          padding: 12,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {qrSrc
            ? <img src={qrSrc} alt="QR checklist operario" style={{ width: 220, height: 220, display: 'block' }} />
            : <div style={{ width: 220, height: 220, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-xs text-slate-400">Generando…</span>
              </div>
          }
        </div>

        {/* Instrucción */}
        <p className="text-sm text-slate-600 text-center leading-relaxed">
          Comparte este QR con los conductores.<br />
          Cada conductor escanea, selecciona su empresa y nombre, ingresa su cédula y llena el checklist.
        </p>

        {/* URL */}
        <div style={{
          width: '100%',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
            {url}
          </span>
        </div>

      </div>
    </Modal>
  )
}
