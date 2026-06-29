import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle2, ShieldCheck, AlertTriangle, Loader2,
  User, Calendar, MapPin, Briefcase, Package,
} from 'lucide-react'
import db                    from '@/db/schema'
import { eppDB, empresaDB, trabajadorDB, cargoDB, sedeDB } from '@/db'
import { formatearFecha, formatearFechaLarga }             from '@/utils/dates'
import { formatearNumeroActa }                             from '@/utils/formatters'
import { FirmaCanvas }                                     from '@/components/firma'
import { SISTEMA }                                         from '@/constants'

const logoPng = '/logo.jpg'

const COMPROMISOS = [
  'Usar el EPP en todas las actividades y áreas de riesgo indicadas por mi supervisor.',
  'Reportar inmediatamente cualquier daño, deterioro o pérdida al área de SST.',
  'No prestar, modificar ni adaptar los elementos de protección recibidos.',
  'Participar en las capacitaciones sobre uso correcto del EPP cuando sean programadas.',
]

// ─── Pantalla de carga ────────────────────────────────────────────────────────
function Cargando() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 size={36} className="text-blue-600 animate-spin" strokeWidth={1.5} />
      <p className="text-sm text-slate-500">Cargando entrega…</p>
    </div>
  )
}

// ─── Pantalla de error ────────────────────────────────────────────────────────
function Problema({ mensaje }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-500" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-lg">Enlace no válido</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{mensaje}</p>
      </div>
    </div>
  )
}

// ─── Pantalla ya firmada ──────────────────────────────────────────────────────
function YaFirmada() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 size={28} className="text-green-600" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-lg">Entrega ya aceptada</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Esta entrega ya fue firmada y registrada en el sistema. No es necesario firmar de nuevo.
        </p>
      </div>
    </div>
  )
}

// ─── Pantalla de éxito ────────────────────────────────────────────────────────
function Aceptado({ datos }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-green-600" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-bold text-slate-900 text-xl">¡Entrega aceptada!</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Tu firma ha sido registrada exitosamente. Conserva tus EPP en buen estado
          y reporta cualquier novedad a tu supervisor.
        </p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Resumen</p>
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{datos.trabajador?.nombres} {datos.trabajador?.apellidos}</span>
        </p>
        <p className="text-xs text-slate-500">Acta N° {datos.nroActa} · {formatearFechaLarga(new Date().toISOString())}</p>
        <p className="text-xs text-slate-400 mt-1">
          {datos.empresa?.razonSocial || SISTEMA.EMPRESA_CLIENTE}
        </p>
      </div>
      <p className="text-xs text-slate-400">Puedes cerrar esta ventana.</p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AceptarEntrega() {
  const { token }  = useParams()
  const firmaRef   = useRef(null)
  const [fase,     setFase]     = useState('cargando')
  const [error,    setError]    = useState('')
  const [hasFirma, setHasFirma] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [datos,    setDatos]    = useState(null)

  useEffect(() => { cargar() }, [token])

  async function cargar() {
    try {
      const entrega = await db.entrega.where('tokenAceptacion').equals(token).first()
      if (!entrega) { setError('El enlace no es válido o ha expirado.'); setFase('error'); return }
      if (entrega.estado === 'FIRMADA') { setFase('ya_firmada'); return }

      const [trabajador, cargo, sede, empresa, detalles, todosEPP] = await Promise.all([
        trabajadorDB.getById(entrega.trabajadorId),
        cargoDB.getById(entrega.cargoId),
        sedeDB.getById(entrega.sedeId),
        empresaDB.getById(entrega.empresaId),
        db.detalleEntrega.where('entregaId').equals(entrega.id).toArray(),
        eppDB.getAll(),
      ])

      const eppMap = Object.fromEntries((todosEPP || []).map(e => [e.id, e]))
      const epps   = detalles.map(d => ({
        ...d,
        eppNombre:  eppMap[d.eppId]?.nombre    || '—',
        esDotacion: eppMap[d.eppId]?.esDotacion || false,
      }))

      setDatos({
        entrega, trabajador, cargo, sede, empresa, epps,
        nroActa: formatearNumeroActa(entrega.id, new Date(entrega.fechaEntrega).getFullYear()),
      })
      setFase('datos')
    } catch {
      setError('Ocurrió un error al cargar los datos. Intenta de nuevo.')
      setFase('error')
    }
  }

  async function handleAceptar() {
    const base64 = firmaRef.current?.getBase64()
    if (!base64 || guardando) return
    setGuardando(true)
    try {
      await db.transaction('rw', db.entrega, db.firma, async () => {
        const entrega = await db.entrega.where('tokenAceptacion').equals(token).first()
        if (!entrega) throw new Error('Token no encontrado')
        await db.entrega.update(entrega.id, {
          estado:          'FIRMADA',
          fechaAceptacion: new Date().toISOString(),
        })
        await db.firma.add({
          entregaId:    entrega.id,
          firmaBase64:  base64,
          fechaCaptura: new Date().toISOString(),
          dispositivo:  navigator.userAgent || 'Desconocido',
          origenQR:     true,
        })
      })
      setFase('aceptado')
    } catch {
      setError('No se pudo registrar la firma. Intenta de nuevo.')
      setGuardando(false)
    }
  }

  if (fase === 'cargando')  return <Cargando />
  if (fase === 'error')     return <Problema mensaje={error} />
  if (fase === 'ya_firmada') return <YaFirmada />
  if (fase === 'aceptado')  return <Aceptado datos={datos} />

  const { entrega, trabajador, cargo, sede, empresa, epps, nroActa } = datos

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Encabezado ── */}
      <div className="bg-[#0f2044] text-white">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex-shrink-0">
              <img src={logoPng} alt="GEPPI" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-300 uppercase">GEPPI</p>
              <p className="text-sm font-semibold leading-tight">Acta de Entrega de EPP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-300">Acta N°</p>
            <p className="text-lg font-bold font-mono">{nroActa}</p>
          </div>
        </div>

        {/* Empresa */}
        <div className="max-w-lg mx-auto px-4 pb-4">
          <p className="text-xs text-blue-200/70">
            {empresa?.razonSocial || SISTEMA.EMPRESA_CLIENTE}
          </p>
          <p className="text-xs text-blue-200/50 mt-0.5">
            {formatearFechaLarga(entrega.fechaEntrega)}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* ── Datos del trabajador ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Datos del trabajador
          </p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-base font-bold">
                {(trabajador?.nombres?.[0] || '') + (trabajador?.apellidos?.[0] || '')}
              </span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base leading-tight">
                {trabajador?.nombres} {trabajador?.apellidos}
              </p>
              <p className="text-sm text-slate-500">
                CC {Number(trabajador?.cedula).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Briefcase size={13} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{cargo?.nombre || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={13} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">{sede?.nombre || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── EPP recibidos ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Elementos que está recibiendo
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {epps.map((item, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck size={14} className="text-blue-600" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {item.eppNombre}
                    {item.esDotacion && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                        Dotación Art.230
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">×{item.cantidad}</span>
                    {item.fechaVencimiento && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar size={10} />
                        Vence: {formatearFecha(item.fechaVencimiento)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Compromisos ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-widest">
            Compromisos del trabajador
          </p>
          <ul className="space-y-2">
            {COMPROMISOS.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-blue-900">
                <span className="text-blue-400 font-bold flex-shrink-0 mt-0.5">•</span>
                <span className="leading-snug">{c}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-blue-700/70 leading-relaxed pt-1 border-t border-blue-200">
            Al firmar, declara haber recibido los EPP relacionados en buen estado y haber sido
            instruido sobre su uso correcto, conforme al Art. 2.2.4.6.24 del Decreto 1072/2015
            y la Resolución 0312/2019.
          </p>
        </div>

        {/* ── Firma ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Firma del trabajador
          </p>
          <p className="text-sm text-slate-600">
            Dibuja tu firma con el dedo en el recuadro de abajo.
          </p>
          <FirmaCanvas
            ref={firmaRef}
            altura={180}
            onChange={setHasFirma}
          />
        </div>

        {/* ── Error inline ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Botón aceptar ── */}
        <button
          onClick={handleAceptar}
          disabled={!hasFirma || guardando}
          className={[
            'w-full py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2',
            hasFirma && !guardando
              ? 'bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-95'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed',
          ].join(' ')}
        >
          {guardando ? (
            <><Loader2 size={18} className="animate-spin" /> Registrando…</>
          ) : (
            <><CheckCircle2 size={18} /> ACEPTO Y FIRMO</>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 pb-6">
          {SISTEMA.CODIGO_DOCUMENTO} · {SISTEMA.NORMATIVA}
        </p>

      </div>
    </div>
  )
}
