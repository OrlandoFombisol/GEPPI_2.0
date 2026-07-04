import { useState, useEffect, useMemo, useCallback } from 'react'
import { Bell, BellOff, RefreshCw, Zap, Stethoscope, Settings2, Save, ExternalLink, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { alertaDB, examenMedicoDB, configuracionAlertaDB, checklistDB } from '@/db'
import { TIPO_ALERTA, NIVEL_ALERTA }                       from '@/constants'
import { formatearFechaHora }                              from '@/utils/dates'
import { generarAlertas }                                  from '@/services/alertasGenerator'
import { generarAlertasExamenes }                          from '@/services/alertasExamenes'
import { Button, Card, AlertBanner }                       from '@/components/ui'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS_LABEL = {
  sistema:    'Alertas del sistema',
  examenes:   'Exámenes médicos',
  config:     'Configuración',
}

const TIPOS_EXAMEN = [
  { value: 'INGRESO',     label: 'Ingreso'           },
  { value: 'PERIODICO',   label: 'Periódico'          },
  { value: 'RETIRO',      label: 'Retiro'             },
  { value: 'RESTRICCION', label: 'Restricción médica' },
]

const DEFAULT_CONFIG = { diasAnticipacion: 30, activa: true, observacion: '' }

const NIVEL_LABEL  = { CRITICO: 'Crítico', WARNING: 'Advertencia', INFO: 'Info' }
const NIVEL_VAR    = { CRITICO: 'danger',  WARNING: 'warning',      INFO: 'info' }
const TIPO_LABEL   = {
  [TIPO_ALERTA.VENCIMIENTO_EPP]:   'Vencimiento EPP',
  [TIPO_ALERTA.STOCK_BAJO]:        'Stock bajo',
  [TIPO_ALERTA.STOCK_AGOTADO]:     'Stock agotado',
  [TIPO_ALERTA.ENTREGA_PENDIENTE]: 'Entrega pendiente',
  [TIPO_ALERTA.FIRMA_PENDIENTE]:   'Firma pendiente',
}

// ─── Tarjeta especial: Checklist hallazgo ─────────────────────────────────────

function ChecklistAlertaCard({ alerta, onMarcarLeida }) {
  const [checklist, setChecklist] = useState(null)
  const isLeida = Boolean(alerta.leida)
  const esCritico = alerta.nivel === 'CRITICO'

  useEffect(() => {
    if (!alerta.referenciaId) return
    checklistDB.getById(Number(alerta.referenciaId))
      .then(c => setChecklist(c))
      .catch(() => {})
  }, [alerta.referenciaId])

  const itemsMalo    = checklist?.items?.filter(i => i.estado === 'MALO')    || []
  const itemsRegular = checklist?.items?.filter(i => i.estado === 'REGULAR') || []

  return (
    <div className={[
      'rounded-xl border transition-colors overflow-hidden',
      isLeida ? 'opacity-60' : '',
      esCritico ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50',
    ].join(' ')}>

      {/* Header */}
      <div className={`flex items-center justify-between gap-2 px-4 py-2.5 ${esCritico ? 'bg-red-100' : 'bg-yellow-100'}`}>
        <div className="flex items-center gap-2">
          <CheckSquare size={13} className={esCritico ? 'text-red-600' : 'text-yellow-700'} />
          <span className={`text-xs font-bold ${esCritico ? 'text-red-700' : 'text-yellow-700'}`}>
            Checklist preoperacional — {esCritico ? 'CRÍTICO' : 'ADVERTENCIA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {formatearFechaHora(alerta.fechaGeneracion)}
          </span>
          {!isLeida && (
            <button onClick={() => onMarcarLeida(alerta.id)} title="Marcar como leída"
              className="p-1 rounded text-slate-400 hover:text-green-600 hover:bg-green-100 transition-colors">
              <BellOff size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 p-4">
        {/* Foto del vehículo */}
        {checklist?.fotoBase64 && (
          <img
            src={checklist.fotoBase64}
            alt="Foto vehículo"
            className="w-24 h-24 object-cover rounded-lg border border-slate-200 flex-shrink-0 shadow-sm"
          />
        )}

        {/* Detalle */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
            {checklist?.vehiculoPlaca && (
              <span><span className="font-semibold">Vehículo:</span> {checklist.vehiculoPlaca}</span>
            )}
            {checklist?.conductorNombre && (
              <span><span className="font-semibold">Conductor:</span> {checklist.conductorNombre}</span>
            )}
            {checklist?.fecha && (
              <span><span className="font-semibold">Fecha:</span> {checklist.fecha}</span>
            )}
          </div>

          {itemsMalo.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">MALO</p>
              <div className="flex flex-wrap gap-1">
                {itemsMalo.map(i => (
                  <span key={i.id} className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full">
                    {i.label}{i.observacion ? ` — ${i.observacion}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {itemsRegular.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">REGULAR</p>
              <div className="flex flex-wrap gap-1">
                {itemsRegular.map(i => (
                  <span key={i.id} className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {i.label}{i.observacion ? ` — ${i.observacion}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta alerta sistema ────────────────────────────────────────────────────

function AlertaCard({ alerta, onMarcarLeida }) {
  const isLeida = Boolean(alerta.leida)
  return (
    <div className={[
      'flex items-start gap-3 p-4 rounded-xl border transition-colors',
      isLeida ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm',
    ].join(' ')}>
      <div className={[
        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
        alerta.nivel === NIVEL_ALERTA.CRITICO ? 'bg-red-500 animate-pulse' :
        alerta.nivel === NIVEL_ALERTA.WARNING  ? 'bg-yellow-500' : 'bg-blue-500',
      ].join(' ')} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
            alerta.nivel === NIVEL_ALERTA.CRITICO ? 'bg-red-50 text-red-700 border-red-200' :
            alerta.nivel === NIVEL_ALERTA.WARNING  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>{NIVEL_LABEL[alerta.nivel] || alerta.nivel}</span>
          <span className="text-xs text-slate-400">
            {TIPO_LABEL[alerta.tipo] || alerta.tipo}
          </span>
          <span className="text-xs text-slate-300 ml-auto font-mono">
            {formatearFechaHora(alerta.fechaGeneracion)}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-snug">
          {alerta.mensaje || alerta.detalle || '—'}
        </p>
      </div>
      {!isLeida && (
        <button onClick={() => onMarcarLeida(alerta.id)} title="Marcar como leída"
          className="p-1.5 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors flex-shrink-0">
          <BellOff size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Tarjeta alerta examen médico ─────────────────────────────────────────────

function ExamenAlertCard({ examen, trabajadorNombre }) {
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = examen.fechaVencimiento ? new Date(examen.fechaVencimiento + 'T00:00:00') : null
  const dias  = venc ? Math.round((venc - hoy) / 86400000) : null
  const vencido = dias !== null && dias < 0
  const tipoLabel = TIPOS_EXAMEN.find(t => t.value === examen.tipo)?.label || examen.tipo

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${vencido ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${vencido ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
            vencido ? 'bg-red-100 text-red-700 border-red-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
          }`}>{vencido ? 'Vencido' : 'Próximo a vencer'}</span>
          <span className="text-xs text-slate-600 font-medium">{tipoLabel}</span>
        </div>
        <p className="text-sm text-slate-800 font-medium">{trabajadorNombre}</p>
        <p className="text-xs text-slate-600">
          {vencido
            ? `Examen de ${tipoLabel.toLowerCase()} venció hace ${Math.abs(dias)} día(s) — ${examen.fechaVencimiento}`
            : `Examen de ${tipoLabel.toLowerCase()} vence en ${dias} día(s) — ${examen.fechaVencimiento}`
          }
        </p>
        {examen.observacionAlerta && (
          <p className="text-xs italic text-slate-500 mt-1">{examen.observacionAlerta}</p>
        )}
        {examen.restricciones && (
          <p className="text-xs text-slate-500">Restricción: {examen.restricciones}</p>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Exámenes Médicos ────────────────────────────────────────────────────

function TabExamenes() {
  const navigate = useNavigate()
  const [examenes,     setExamenes]    = useState([])
  const [trabajadores, setTrabajadores]= useState([])
  const [configs,      setConfigs]     = useState([])
  const [loading,      setLoading]     = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [ex, cf] = await Promise.all([
          examenMedicoDB.getAll(),
          configuracionAlertaDB.getAll(),
        ])
        setExamenes(ex  || [])
        setConfigs(cf   || [])
        // Cargar trabajadores básico (solo nombres)
        const { trabajadorDB } = await import('@/db')
        const tr = await trabajadorDB.getAll()
        setTrabajadores(tr || [])
      } finally { setLoading(false) }
    })()
  }, [])

  const configMap = useMemo(
    () => Object.fromEntries(configs.map(c => [c.tipo, c])),
    [configs]
  )
  const trabajadorMap = useMemo(
    () => Object.fromEntries(trabajadores.map(t => [t.id, t])),
    [trabajadores]
  )

  const alertasExamen = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    return examenes
      .filter(ex => {
        if (!ex.fechaVencimiento) return false
        const venc = new Date(ex.fechaVencimiento + 'T00:00:00')
        if (venc < hoy) return true // vencido
        const cfg = configMap[ex.tipo]
        if (!cfg || !cfg.activa) {
          // Config por defecto: 30 días
          const lim = new Date(hoy); lim.setDate(lim.getDate() + 30)
          return venc <= lim
        }
        const lim = new Date(hoy); lim.setDate(lim.getDate() + (cfg.diasAnticipacion ?? 30))
        return venc <= lim
      })
      .map(ex => ({
        ...ex,
        observacionAlerta: configMap[ex.tipo]?.observacion || '',
      }))
      .sort((a, b) => (a.fechaVencimiento || '').localeCompare(b.fechaVencimiento || ''))
  }, [examenes, configMap])

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {alertasExamen.length > 0
            ? `${alertasExamen.length} examen(es) requieren atención`
            : 'Todos los exámenes están al día'}
        </p>
        <button onClick={() => navigate('/examenes-medicos')}
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
          <ExternalLink size={12} />
          Gestionar todos los exámenes
        </button>
      </div>

      {alertasExamen.length === 0 ? (
        <Card>
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <Stethoscope size={24} className="text-green-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-slate-700">Sin alertas de exámenes médicos</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Todos los exámenes están vigentes o no tienen vencimientos próximos según la configuración.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertasExamen.map(ex => {
            const t = trabajadorMap[ex.trabajadorId]
            const nombre = t ? `${t.nombres} ${t.apellidos} (${t.cedula})` : `Trabajador #${ex.trabajadorId}`
            return <ExamenAlertCard key={ex.id} examen={ex} trabajadorNombre={nombre} />
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Configuración ───────────────────────────────────────────────────────

function TabConfig() {
  const navigate = useNavigate()
  const [configs,  setConfigs]  = useState([])
  const [local,    setLocal]    = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    configuracionAlertaDB.getAll().then(cf => {
      setConfigs(cf || [])
      const m = {}
      TIPOS_EXAMEN.forEach(t => {
        const c = (cf || []).find(x => x.tipo === t.value)
        m[t.value] = c
          ? { diasAnticipacion: c.diasAnticipacion ?? 30, activa: c.activa ?? true, observacion: c.observacion ?? '' }
          : { ...DEFAULT_CONFIG }
      })
      setLocal(m)
      setLoading(false)
    })
  }, [])

  const update = (tipo, field, val) =>
    setLocal(p => ({ ...p, [tipo]: { ...p[tipo], [field]: val } }))

  const handleSave = async () => {
    setSaving(true); setSaved(false)
    try {
      await Promise.all(Object.entries(local).map(([tipo, data]) => configuracionAlertaDB.upsert(tipo, data)))
      const cf = await configuracionAlertaDB.getAll()
      setConfigs(cf || [])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />

  return (
    <div className="space-y-5">
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          Configuración guardada correctamente.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 size={16} className="text-primary-700" />
          <h2 className="text-sm font-bold text-slate-800">Alertas de exámenes médicos</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Configura cuántos días antes del vencimiento se genera la alerta y el mensaje que aparece.
          La <strong>observación</strong> es el texto personalizado que se mostrará en la alerta.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPOS_EXAMEN.map(t => {
            const cfg = local[t.value] || { ...DEFAULT_CONFIG }
            return (
              <div key={t.value}
                className={`rounded-xl border p-4 transition-colors ${cfg.activa ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200 bg-slate-50/60 opacity-70'}`}>

                {/* Header + toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                  <button
                    onClick={() => update(t.value, 'activa', !cfg.activa)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cfg.activa ? 'bg-primary-600' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${cfg.activa ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </button>
                </div>

                {/* Días */}
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1">Días de anticipación</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={365} value={cfg.diasAnticipacion}
                      onChange={e => update(t.value, 'diasAnticipacion', Number(e.target.value))}
                      className="w-20 h-8 px-2 rounded-lg border border-slate-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-xs text-slate-400">días antes del vencimiento</span>
                  </div>
                </div>

                {/* Observación */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Observación de alerta
                    <span className="text-slate-400 ml-1">(mensaje personalizado)</span>
                  </label>
                  <textarea value={cfg.observacion}
                    onChange={e => update(t.value, 'observacion', e.target.value)}
                    rows={3}
                    placeholder={`Ej: Programar examen de ${t.label.toLowerCase()} con la ARL antes del vencimiento…`}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <button onClick={() => navigate('/examenes-medicos')}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
            <ExternalLink size={12} />
            Ir a gestión de exámenes médicos
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
            <Save size={14} />
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [alertas,   setAlertas]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [generando, setGenerando] = useState(false)
  const [msgNuevas, setMsgNuevas] = useState(null)
  const [tab,       setTab]       = useState('sistema')

  const [filtroLeida, setFiltroLeida] = useState('NO_LEIDAS')
  const [filtroNivel, setFiltroNivel] = useState('TODOS')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await alertaDB.getAll()
      setAlertas(data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const alertasFiltradas = useMemo(() => {
    let r = alertas
    if (filtroLeida === 'NO_LEIDAS') r = r.filter(a => !a.leida)
    if (filtroLeida === 'LEIDAS')    r = r.filter(a =>  a.leida)
    if (filtroNivel !== 'TODOS')     r = r.filter(a => a.nivel === filtroNivel)
    return r
  }, [alertas, filtroLeida, filtroNivel])

  const noLeidas = alertas.filter(a => !a.leida).length
  const criticos = alertas.filter(a => !a.leida && a.nivel === NIVEL_ALERTA.CRITICO).length

  const marcarLeida = async (id) => {
    await alertaDB.marcarLeida(id)
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: 1 } : a))
  }
  const marcarTodasLeidas = async () => {
    await alertaDB.marcarTodasLeidas()
    setAlertas(prev => prev.map(a => ({ ...a, leida: 1 })))
  }

  const handleGenerar = async () => {
    setGenerando(true); setMsgNuevas(null)
    try {
      const [n1, n2] = await Promise.all([generarAlertas(), generarAlertasExamenes()])
      setMsgNuevas(n1 + n2)
      await cargar()
    } finally { setGenerando(false) }
  }

  const SELECT_CLS = `h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white
                      text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500`
  const FILTROS_LEIDA = [
    { key: 'NO_LEIDAS', label: `No leídas (${noLeidas})` },
    { key: 'LEIDAS',    label: 'Leídas'                  },
    { key: 'TODAS',     label: `Todas (${alertas.length})` },
  ]

  const TABS = [
    { key: 'sistema',  label: 'Alertas del sistema',  icon: Bell    },
    { key: 'examenes', label: 'Exámenes médicos',      icon: Stethoscope },
    { key: 'config',   label: 'Configuración',         icon: Settings2 },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell size={22} className="text-primary-700" strokeWidth={1.8} />
            Alertas
            {noLeidas > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded-full font-bold">
                {noLeidas}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {criticos > 0 && <span className="text-red-600 font-medium">{criticos} crítica{criticos !== 1 ? 's' : ''} · </span>}
            Centro de notificaciones del sistema GEPPI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {noLeidas > 0 && (
            <Button variant="ghost" size="sm" onClick={marcarTodasLeidas}>
              Marcar todas leídas
            </Button>
          )}
          <Button variant="outline" size="sm" iconLeft={Zap} onClick={handleGenerar} loading={generando}>
            {generando ? 'Escaneando…' : 'Generar alertas'}
          </Button>
          <Button variant="ghost" size="sm" iconLeft={RefreshCw} onClick={cargar} disabled={loading}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Resultado de generación */}
      {msgNuevas !== null && (
        <AlertBanner
          level={msgNuevas > 0 ? 'warning' : 'info'}
          message={msgNuevas > 0
            ? `Se generaron ${msgNuevas} alerta${msgNuevas !== 1 ? 's' : ''} nueva${msgNuevas !== 1 ? 's' : ''}.`
            : 'Sin alertas nuevas. Todo el sistema está al día.'}
          closable
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key}
            onClick={() => setTab(key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              tab === key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Sistema */}
      {tab === 'sistema' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {FILTROS_LEIDA.map(({ key, label }) => (
                <button key={key}
                  onClick={() => setFiltroLeida(key)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    filtroLeida === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
            <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} className={SELECT_CLS}>
              <option value="TODOS">Todos los niveles</option>
              <option value={NIVEL_ALERTA.CRITICO}>Crítico</option>
              <option value={NIVEL_ALERTA.WARNING}>Advertencia</option>
              <option value={NIVEL_ALERTA.INFO}>Info</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : alertasFiltradas.length === 0 ? (
            <Card>
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Bell size={24} className="text-green-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Sin alertas del sistema</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  {filtroLeida === 'NO_LEIDAS'
                    ? 'Todas las alertas están leídas. Pulsa "Generar alertas" para escanear el sistema.'
                    : 'No hay alertas con los filtros seleccionados.'}
                </p>
                <Button variant="outline" size="sm" iconLeft={Zap} onClick={handleGenerar} loading={generando}>
                  Escanear sistema
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {alertasFiltradas.map(a =>
                a.tipo === 'CHECKLIST_HALLAZGO'
                  ? <ChecklistAlertaCard key={a.id} alerta={a} onMarcarLeida={marcarLeida} />
                  : <AlertaCard         key={a.id} alerta={a} onMarcarLeida={marcarLeida} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Exámenes */}
      {tab === 'examenes' && <TabExamenes />}

      {/* Tab: Configuración */}
      {tab === 'config' && <TabConfig />}

    </div>
  )
}
