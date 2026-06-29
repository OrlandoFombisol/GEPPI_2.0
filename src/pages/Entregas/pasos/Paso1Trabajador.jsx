import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, UserCheck, QrCode, CameraOff, X }  from 'lucide-react'
import { trabajadorDB, cargoDB, sedeDB } from '@/db'
import { obtenerIniciales }              from '@/utils/formatters'
import { Badge, Button }                 from '@/components/ui'

function TarjetaTrabajador({ t, seleccionado, onClick }) {
  const activo = seleccionado?.id === t.id
  return (
    <button
      type="button"
      onClick={() => onClick(t)}
      className={[
        'w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
        activo
          ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-300'
          : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40',
      ].join(' ')}
    >
      <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold">
          {obtenerIniciales(`${t.nombres} ${t.apellidos}`)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{t.nombres} {t.apellidos}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          CC {t.cedula} · {t.cargoNombre || '—'} · {t.sedeNombre || '—'}
        </p>
      </div>
      {activo && <UserCheck size={18} className="text-primary-700 flex-shrink-0" />}
    </button>
  )
}

// ─── Lector QR con cámara ─────────────────────────────────────────────────────

function LectorQR({ onDetectado, trabajadores }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)
  const rafRef      = useRef(null)
  const [estado, setEstado] = useState('iniciando') // iniciando | activo | error
  const [msg,    setMsg]    = useState('')

  useEffect(() => {
    iniciarCamara()
    return () => detenerCamara()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function iniciarCamara() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setEstado('activo')
        escanear()
      }
    } catch (e) {
      setEstado('error')
      setMsg('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }

  function detenerCamara() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  async function escanear() {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    async function frame() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const jsQR = (await import('jsqr')).default
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code?.data) {
            // Intentar parsear payload GEPPI-W
            let cedula = null
            try {
              const parsed = JSON.parse(code.data)
              if (parsed.t === 'GEPPI-W') cedula = parsed.c
            } catch {
              // Podría ser solo la cédula como texto plano
              if (/^\d{5,12}$/.test(code.data.trim())) cedula = code.data.trim()
            }

            if (cedula) {
              const trabajador = trabajadores.find(t => t.cedula === String(cedula))
              if (trabajador) {
                detenerCamara()
                onDetectado(trabajador)
                return
              } else {
                setMsg(`QR detectado pero cédula ${cedula} no está en el sistema.`)
              }
            }
          }
        } catch { /* ignorar errores de frame */ }
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }

  return (
    <div className="space-y-3">
      {estado === 'error' ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CameraOff size={32} className="text-slate-400" />
          <p className="text-sm text-slate-500">{msg || 'Error al acceder a la cámara.'}</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-slate-900" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} muted playsInline
            className="w-full h-full object-cover" />
          {/* Guía de escaneo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/60 rounded-xl relative">
              {[['top-0 left-0', 'border-t-4 border-l-4'],
                ['top-0 right-0', 'border-t-4 border-r-4'],
                ['bottom-0 left-0', 'border-b-4 border-l-4'],
                ['bottom-0 right-0', 'border-b-4 border-r-4'],
              ].map(([pos, cls], i) => (
                <div key={i} className={['absolute w-6 h-6 border-primary-400 rounded-sm', pos, cls].join(' ')} />
              ))}
            </div>
          </div>
          {estado === 'iniciando' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <p className="text-white text-sm">Iniciando cámara…</p>
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {msg && estado !== 'error' && (
        <p className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}
      <p className="text-xs text-slate-400 text-center">
        Apunta al código QR de la tarjeta del trabajador para auto-rellenar.
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Paso1Trabajador({ seleccionado, onNext }) {
  const [modo,         setModo]         = useState('busqueda') // 'busqueda' | 'qr'
  const [busqueda,     setBusqueda]     = useState('')
  const [trabajadores, setTrabajadores] = useState([])
  const [cargos,       setCargos]       = useState([])
  const [sedes,        setSedes]        = useState([])
  const [elegido,      setElegido]      = useState(seleccionado?.trabajador || null)

  useEffect(() => {
    async function cargar() {
      const [trabs, cgs, sds] = await Promise.all([
        trabajadorDB.getAll(), cargoDB.getAll(), sedeDB.getAll(),
      ])
      setCargos(cgs  || [])
      setSedes(sds   || [])
      setTrabajadores(
        (trabs || []).filter(t => t.estado === 'ACTIVO').map(t => ({
          ...t,
          cargoNombre: (cgs || []).find(c => c.id === t.cargoId)?.nombre || '—',
          sedeNombre:  (sds || []).find(s => s.id === t.sedeId)?.nombre  || '—',
        }))
      )
    }
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return trabajadores
    const q = busqueda.toLowerCase()
    return trabajadores.filter(t =>
      t.nombres?.toLowerCase().includes(q)  ||
      t.apellidos?.toLowerCase().includes(q) ||
      t.cedula?.includes(q)                 ||
      t.cargoNombre?.toLowerCase().includes(q)
    )
  }, [trabajadores, busqueda])

  function handleQRDetectado(trabajador) {
    setElegido(trabajador)
    setModo('busqueda')
  }

  const handleSiguiente = () => {
    if (!elegido) return
    const cargo = cargos.find(c => c.id === elegido.cargoId)
    onNext({ trabajador: elegido, cargo })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Seleccionar trabajador</h3>
        <p className="text-sm text-slate-500 mt-0.5">Busca por nombre, cédula o cargo, o escanea el QR de la tarjeta.</p>
      </div>

      {/* Tabs modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo('busqueda')}
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            modo === 'busqueda'
              ? 'bg-primary-700 border-primary-700 text-white'
              : 'bg-white border-slate-300 text-slate-600 hover:border-primary-300',
          ].join(' ')}
        >
          <Search size={14} /> Buscar
        </button>
        <button
          type="button"
          onClick={() => setModo('qr')}
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            modo === 'qr'
              ? 'bg-primary-700 border-primary-700 text-white'
              : 'bg-white border-slate-300 text-slate-600 hover:border-primary-300',
          ].join(' ')}
        >
          <QrCode size={14} /> Escanear QR
        </button>
      </div>

      {/* Modo búsqueda */}
      {modo === 'busqueda' && (
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Nombre, cédula, cargo…"
              autoFocus
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 text-sm
                         text-slate-900 placeholder:text-slate-400 bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtrados.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin trabajadores activos.'}
              </p>
            ) : (
              filtrados.map(t => (
                <TarjetaTrabajador
                  key={t.id}
                  t={t}
                  seleccionado={elegido}
                  onClick={setElegido}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Modo QR */}
      {modo === 'qr' && (
        <LectorQR trabajadores={trabajadores} onDetectado={handleQRDetectado} />
      )}

      {/* Resumen del seleccionado */}
      {elegido && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm">
          <span className="text-primary-700 font-medium">Trabajador seleccionado: </span>
          <span className="text-primary-900 font-bold">{elegido.nombres} {elegido.apellidos}</span>
          <span className="text-primary-600"> — {elegido.cargoNombre}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSiguiente} disabled={!elegido}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
