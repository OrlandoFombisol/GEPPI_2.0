import { useRef, useState, useEffect, useCallback } from 'react'
import { FirmaCanvas }  from '@/components/firma'
import { Button }       from '@/components/ui'
import { entregaDB }    from '@/db'
import { QrCode, Copy, CheckCircle2, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'

export default function Paso3Firma({ trabajador, cargo, eppItems, onNext, onAnterior, onGenerarEntregaPendiente }) {
  const firmaRef   = useRef(null)
  const [hasFirma, setHasFirma] = useState(false)
  const [modo,     setModo]     = useState('presencial') // 'presencial' | 'qr'

  // Estado QR
  const [qrGenerando, setQrGenerando] = useState(false)
  const [qrData,      setQrData]      = useState(null)  // { entregaId, token, url, imgUrl }
  const [firmada,     setFirmada]     = useState(false)
  const [copiado,     setCopiado]     = useState(false)

  // ── Firma presencial ─────────────────────────────────────────────────────────
  const handleSiguiente = () => {
    const base64 = firmaRef.current?.getBase64()
    if (base64) onNext({ firmaBase64: base64 })
  }

  // ── Generar QR ───────────────────────────────────────────────────────────────
  const generarQR = useCallback(async () => {
    if (qrData || qrGenerando) return
    setQrGenerando(true)
    try {
      const { entregaId, token } = await onGenerarEntregaPendiente()
      const url    = `${window.location.origin}/aceptar/${token}`
      const imgUrl = await QRCode.toDataURL(url, {
        width: 280, margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
      setQrData({ entregaId, token, url, imgUrl })
    } catch (e) {
      alert('Error generando el QR: ' + e.message)
    } finally {
      setQrGenerando(false)
    }
  }, [qrData, qrGenerando, onGenerarEntregaPendiente])

  // ── Polling — detecta cuando el trabajador firmó ─────────────────────────────
  useEffect(() => {
    if (!qrData || firmada) return
    const interval = setInterval(async () => {
      try {
        const entrega = await entregaDB.getById(qrData.entregaId)
        if (entrega?.estado === 'FIRMADA') {
          setFirmada(true)
          clearInterval(interval)
          setTimeout(() => onNext({ modoQR: true, entregaId: qrData.entregaId }), 1800)
        }
      } catch { /* silencioso */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [qrData, firmada, onNext])

  // ── Copiar enlace ────────────────────────────────────────────────────────────
  const copiarLink = () => {
    navigator.clipboard.writeText(qrData.url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Firma digital del trabajador</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          <strong>{trabajador.nombres} {trabajador.apellidos}</strong> — elige cómo firmar.
        </p>
      </div>

      {/* ── Selector de modo ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setModo('presencial')}
          disabled={!!qrData}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
            modo === 'presencial'
              ? 'bg-white shadow text-primary-800'
              : 'text-slate-500 hover:text-slate-700 disabled:opacity-40',
          ].join(' ')}
        >
          ✏️ Firma aquí
        </button>
        <button
          onClick={() => { setModo('qr'); generarQR() }}
          disabled={firmada}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
            modo === 'qr'
              ? 'bg-white shadow text-primary-800'
              : 'text-slate-500 hover:text-slate-700',
          ].join(' ')}
        >
          <QrCode size={15} /> Firmar por QR
        </button>
      </div>

      {/* ── Modo presencial ── */}
      {modo === 'presencial' && (
        <>
          <FirmaCanvas ref={firmaRef} altura={220} onChange={setHasFirma} />
          <p className="text-[11px] text-slate-400 leading-relaxed border border-slate-100 rounded-lg p-3 bg-slate-50">
            Al firmar, el trabajador declara haber recibido los EPP relacionados en perfectas
            condiciones y haber recibido instrucción sobre su correcto uso, conforme al
            Artículo 2.2.4.6.24 del Decreto 1072 de 2015 y la Resolución 0312 de 2019.
          </p>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={onAnterior}>← Anterior</Button>
            <Button onClick={handleSiguiente} disabled={!hasFirma}>Siguiente →</Button>
          </div>
        </>
      )}

      {/* ── Modo QR ── */}
      {modo === 'qr' && (
        <div className="space-y-4">

          {/* Generando */}
          {qrGenerando && (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
              <Loader2 size={32} className="animate-spin text-primary-600" />
              <p className="text-sm">Generando enlace de firma…</p>
            </div>
          )}

          {/* QR listo */}
          {qrData && !firmada && (
            <>
              <div className="flex flex-col items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <img src={qrData.imgUrl} alt="QR firma" className="w-52 h-52 rounded-xl shadow-md" />
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  El trabajador escanea este código con la cámara de su celular y firma desde ahí.
                </p>
                <button
                  onClick={copiarLink}
                  className="flex items-center gap-2 text-xs bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                >
                  {copiado
                    ? <><CheckCircle2 size={13} className="text-green-600" /> ¡Enlace copiado!</>
                    : <><Copy size={13} /> Copiar enlace para WhatsApp</>}
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                <Loader2 size={15} className="animate-spin flex-shrink-0" />
                Esperando que <strong className="mx-1">{trabajador.nombres}</strong> firme…
              </div>
            </>
          )}

          {/* Firmado */}
          {firmada && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-600" strokeWidth={1.8} />
              </div>
              <p className="font-bold text-slate-900 text-lg">¡Firma recibida!</p>
              <p className="text-sm text-slate-500">Avanzando automáticamente…</p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={onAnterior} disabled={!!qrData}>
              ← Anterior
            </Button>
            {qrData && !firmada && (
              <span className="text-xs text-slate-400 self-center italic">
                Esperando firma remota…
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
