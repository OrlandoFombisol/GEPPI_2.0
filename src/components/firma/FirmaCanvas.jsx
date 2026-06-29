import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { Eraser, Undo2, PenLine } from 'lucide-react'

// ─── Paleta de colores ────────────────────────────────────────────────────────
const COLORES = [
  { valor: '#111827', label: 'Negro',       bg: 'bg-slate-900' },
  { valor: '#1e3a5f', label: 'Azul marino', bg: 'bg-blue-950'  },
  { valor: '#2563eb', label: 'Azul',        bg: 'bg-blue-600'  },
  { valor: '#dc2626', label: 'Rojo',        bg: 'bg-red-600'   },
]

// ─── Opciones de grosor ───────────────────────────────────────────────────────
const GROSORES = [
  { valor: 1.5, label: 'Fino'   },
  { valor: 2.5, label: 'Normal' },
  { valor: 4.0, label: 'Grueso' },
]

/**
 * Canvas de firma digital reutilizable para GEPPI.
 *
 * Ref expone: { getBase64(), limpiar(), getHasContent() }
 *
 * @prop {number}   altura        — alto del área de dibujo (default 200)
 * @prop {string}   colorInicial  — color de trazo inicial
 * @prop {number}   grosorInicial — grosor inicial (1.5 / 2.5 / 4)
 * @prop {Function} onChange      — (hasContent: boolean) => void
 * @prop {boolean}  disabled      — modo solo lectura / visualización
 * @prop {string}   className
 */
const FirmaCanvas = forwardRef(({
  altura        = 200,
  colorInicial  = '#1e3a5f',
  grosorInicial = 2.5,
  onChange,
  disabled      = false,
  className     = '',
}, ref) => {

  const canvasRef  = useRef(null)
  const dibujando  = useRef(false)
  const snapshots  = useRef([])          // historial de imágenes para deshacer
  const colorRef   = useRef(colorInicial)
  const grosorRef  = useRef(grosorInicial)

  const [colorUI,      setColorUI]      = useState(colorInicial)
  const [grosorUI,     setGrosorUI]     = useState(grosorInicial)
  const [hasContent,   setHasContent]   = useState(false)
  const [puedeDeshacer, setPuedeDeshacer] = useState(false)

  // ── Inicializar canvas (DPI-aware) ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr  = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width  = Math.round(rect.width  * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = colorRef.current
    ctx.lineWidth   = grosorRef.current
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
  }, [])

  // ── Cambiar color ─────────────────────────────────────────────────────────
  const mudarColor = useCallback((c) => {
    colorRef.current = c
    setColorUI(c)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.strokeStyle = c
  }, [])

  // ── Cambiar grosor ────────────────────────────────────────────────────────
  const mudarGrosor = useCallback((g) => {
    grosorRef.current = g
    setGrosorUI(g)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.lineWidth = g
  }, [])

  // ── Detectar si el canvas tiene contenido ─────────────────────────────────
  const verificarContenido = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return false
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
    const tiene = data.some((v, i) => i % 4 === 3 && v > 0)
    setHasContent(tiene)
    onChange?.(tiene)
    return tiene
  }, [onChange])

  // ── Coordenadas normalizadas (mouse / touch) ──────────────────────────────
  const getCoordenadas = useCallback((e) => {
    const rect   = canvasRef.current.getBoundingClientRect()
    const fuente = e.touches ? e.touches[0] : e
    return { x: fuente.clientX - rect.left, y: fuente.clientY - rect.top }
  }, [])

  // ── Comenzar trazo ────────────────────────────────────────────────────────
  const iniciar = useCallback((e) => {
    if (disabled) return
    e.preventDefault()
    // Guardar snapshot antes de empezar
    const snap = canvasRef.current.toDataURL()
    snapshots.current = [...snapshots.current.slice(-19), snap]
    setPuedeDeshacer(true)
    dibujando.current = true
    const { x, y } = getCoordenadas(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [disabled, getCoordenadas])

  // ── Dibujar ───────────────────────────────────────────────────────────────
  const dibujar = useCallback((e) => {
    e.preventDefault()
    if (!dibujando.current || disabled) return
    const { x, y } = getCoordenadas(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasContent) { setHasContent(true); onChange?.(true) }
  }, [disabled, getCoordenadas, hasContent, onChange])

  // ── Terminar trazo ────────────────────────────────────────────────────────
  const terminar = useCallback(() => { dibujando.current = false }, [])

  // ── Deshacer último trazo ─────────────────────────────────────────────────
  const deshacer = useCallback(() => {
    if (snapshots.current.length === 0) return
    const snap = snapshots.current[snapshots.current.length - 1]
    snapshots.current = snapshots.current.slice(0, -1)
    setPuedeDeshacer(snapshots.current.length > 0)

    const canvas = canvasRef.current
    const dpr    = window.devicePixelRatio || 1
    const ctx    = canvas.getContext('2d')
    const img    = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
      ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr)
      // Restaurar estilo actual
      ctx.strokeStyle = colorRef.current
      ctx.lineWidth   = grosorRef.current
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      verificarContenido()
    }
    img.src = snap
  }, [verificarContenido])

  // ── Limpiar todo ──────────────────────────────────────────────────────────
  const limpiar = useCallback(() => {
    const canvas = canvasRef.current
    const dpr    = window.devicePixelRatio || 1
    canvas.getContext('2d').clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    snapshots.current = []
    setPuedeDeshacer(false)
    setHasContent(false)
    onChange?.(false)
  }, [onChange])

  // ── API imperativa expuesta al padre vía ref ──────────────────────────────
  useImperativeHandle(ref, () => ({
    getBase64:     () => canvasRef.current?.toDataURL('image/png') ?? null,
    limpiar,
    getHasContent: () => hasContent,
  }), [limpiar, hasContent])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={['space-y-2 select-none', className].join(' ')}>

      {/* Área de dibujo */}
      <div
        className="relative rounded-xl border-2 bg-white overflow-hidden transition-colors"
        style={{
          height:      altura,
          borderColor: hasContent ? '#1e40af' : '#cbd5e1',
          borderStyle: 'dashed',
        }}
      >
        {/* Línea guía de firma */}
        <div className="absolute bottom-10 left-8 right-8 border-b border-slate-100 pointer-events-none" />
        <span className="absolute bottom-2 left-0 right-0 text-center text-[10px]
                         text-slate-200 pointer-events-none">
          Firma aquí
        </span>

        {/* Placeholder vacío */}
        {!hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2
                          text-slate-300 pointer-events-none">
            <PenLine size={26} strokeWidth={1.5} />
            <span className="text-xs">{disabled ? 'Sin firma registrada' : 'Dibuja tu firma aquí'}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            width: '100%', height: '100%',
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'crosshair',
          }}
          onMouseDown={iniciar}
          onMouseMove={dibujar}
          onMouseUp={terminar}
          onMouseLeave={terminar}
          onTouchStart={iniciar}
          onTouchMove={dibujar}
          onTouchEnd={terminar}
        />
      </div>

      {/* Barra de herramientas */}
      {!disabled && (
        <div className="flex items-center gap-3 flex-wrap">

          {/* Paleta de colores */}
          <div className="flex items-center gap-1.5">
            {COLORES.map(c => (
              <button
                key={c.valor}
                type="button"
                title={c.label}
                onClick={() => mudarColor(c.valor)}
                className={[
                  'w-5 h-5 rounded-full transition-transform',
                  c.bg,
                  colorUI === c.valor
                    ? 'ring-2 ring-offset-2 ring-slate-600 scale-110'
                    : 'hover:scale-110 opacity-70 hover:opacity-100',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Separador */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Selector de grosor */}
          <div className="flex items-center gap-1">
            {GROSORES.map(g => (
              <button
                key={g.valor}
                type="button"
                title={g.label}
                onClick={() => mudarGrosor(g.valor)}
                className={[
                  'w-8 h-7 rounded-md flex items-center justify-center transition-colors',
                  grosorUI === g.valor
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                ].join(' ')}
              >
                {/* Preview visual del grosor */}
                <div
                  className="rounded-full"
                  style={{
                    backgroundColor: 'currentColor',
                    width:  g.valor * 2.2,
                    height: g.valor * 2.2,
                  }}
                />
              </button>
            ))}
          </div>

          {/* Acciones (alineadas a la derecha) */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={deshacer}
              disabled={!puedeDeshacer}
              title="Deshacer último trazo (hasta 20)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                         text-slate-600 hover:bg-slate-100
                         disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Undo2 size={13} /> Deshacer
            </button>

            <button
              type="button"
              onClick={limpiar}
              disabled={!hasContent}
              title="Borrar toda la firma"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium
                         text-slate-600 hover:bg-red-50 hover:text-red-700
                         disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Eraser size={13} /> Limpiar
            </button>
          </div>

          {/* Indicador de firma capturada */}
          {hasContent && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              ✓ Firma lista
            </span>
          )}
        </div>
      )}
    </div>
  )
})

FirmaCanvas.displayName = 'FirmaCanvas'
export default FirmaCanvas
