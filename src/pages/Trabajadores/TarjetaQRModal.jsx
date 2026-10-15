import { useState, useEffect, useRef } from 'react'
import { Loader2, Printer } from 'lucide-react'
import { Modal, Button } from '@/components/ui'

// ─── Modal tarjeta QR imprimible ─────────────────────────────────────────────
// Usado tanto desde el perfil del trabajador como desde "Nueva Entrega",
// para poder generar o reimprimir la tarjeta sin tener que salir del flujo.
export default function TarjetaQRModal({ trabajador, cargoNombre, sedeNombre, onClose }) {
  const [qrUrl, setQrUrl] = useState(null)
  const cardRef           = useRef(null)

  useEffect(() => {
    async function generarQR() {
      try {
        const QRCode  = await import('qrcode')
        const payload = JSON.stringify({
          t: 'GEPPI-W',
          c: trabajador.cedula,
          n: `${trabajador.nombres} ${trabajador.apellidos}`,
        })
        const url = await QRCode.default.toDataURL(payload, {
          width: 180, margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        setQrUrl(url)
      } catch (e) {
        console.error('[QR]', e)
      }
    }
    generarQR()
  }, [trabajador])

  function imprimir() {
    const w = window.open('', '_blank', 'width=420,height=600')
    if (!w) return
    w.document.write(`
      <html><head><title>Tarjeta GEPPI</title>
      <style>
        @page { size: 85mm 54mm; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
        .card {
          width: 85mm; height: 54mm; box-sizing: border-box;
          padding: 4mm 5mm; display: flex; gap: 5mm; align-items: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%);
          color: white; position: relative; overflow: hidden;
        }
        .card::before {
          content: ''; position: absolute; top: -10mm; right: -10mm;
          width: 30mm; height: 30mm; border-radius: 50%;
          background: rgba(255,255,255,0.08);
        }
        .card::after {
          content: ''; position: absolute; bottom: -8mm; left: 20mm;
          width: 20mm; height: 20mm; border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .qr { background: white; padding: 2mm; border-radius: 2mm; flex-shrink: 0; }
        .qr img { width: 22mm; height: 22mm; display: block; }
        .info { flex: 1; min-width: 0; }
        .logo-text { font-size: 10pt; font-weight: 900; letter-spacing: 0.18em; color: #93c5fd; margin-bottom: 1mm; }
        .name { font-size: 9pt; font-weight: 700; line-height: 1.2; margin-bottom: 1.5mm; }
        .cargo { font-size: 7pt; color: #bfdbfe; margin-bottom: 1mm; }
        .cedula { font-size: 7pt; color: #bfdbfe; font-family: monospace; }
        .sede { font-size: 6pt; color: rgba(191,219,254,0.7); margin-top: 0.5mm; }
        .footer { position: absolute; bottom: 2mm; right: 5mm; font-size: 5pt; color: rgba(255,255,255,0.4); }
      </style></head><body>
      <div class="card">
        <div class="qr"><img src="${qrUrl}" alt="QR" /></div>
        <div class="info">
          <div class="logo-text">GEPPI · EPP</div>
          <div class="name">${trabajador.nombres}<br/>${trabajador.apellidos}</div>
          <div class="cargo">${cargoNombre || '—'}</div>
          <div class="cedula">CC ${trabajador.cedula}</div>
          <div class="sede">${sedeNombre || ''}</div>
        </div>
        <div class="footer">MT-SST-005</div>
      </div>
      </body></html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); }, 400)
  }

  return (
    <Modal open onClose={onClose} title="Tarjeta QR del trabajador" size="sm"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          {qrUrl && (
            <Button onClick={imprimir} className="flex items-center gap-2">
              <Printer size={15} /> Imprimir tarjeta
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Tarjeta de identificación para acuse de recibo de EPP. Escaneando el QR
          se auto-rellena el formulario de entrega.
        </p>

        {/* Vista previa */}
        <div ref={cardRef}
          className="rounded-2xl overflow-hidden mx-auto"
          style={{
            width: 340, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
            padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center',
            boxShadow: '0 8px 32px rgba(30,64,175,0.45)',
          }}>
          {qrUrl ? (
            <div style={{ background: 'white', padding: 8, borderRadius: 8, flexShrink: 0 }}>
              <img src={qrUrl} alt="QR" style={{ width: 88, height: 88, display: 'block' }} />
            </div>
          ) : (
            <div style={{ width: 104, height: 104, background: 'rgba(255,255,255,0.1)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Loader2 size={24} style={{ color: 'rgba(255,255,255,0.5)' }} className="animate-spin" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, color: 'white' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: '#93c5fd', marginBottom: 4 }}>
              GEPPI · EPP
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, marginBottom: 4 }}>
              {trabajador.nombres}<br />{trabajador.apellidos}
            </p>
            <p style={{ fontSize: 11, color: '#bfdbfe', marginBottom: 2 }}>{cargoNombre || '—'}</p>
            <p style={{ fontSize: 11, color: '#bfdbfe', fontFamily: 'monospace' }}>CC {trabajador.cedula}</p>
            {sedeNombre && <p style={{ fontSize: 9, color: 'rgba(191,219,254,0.65)', marginTop: 2 }}>{sedeNombre}</p>}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Vista previa de la tarjeta · Tamaño de impresión: 85 × 54 mm (tarjeta de crédito)
        </p>
      </div>
    </Modal>
  )
}
