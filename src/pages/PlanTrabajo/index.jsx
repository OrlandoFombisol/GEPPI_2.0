import { useState, useEffect, useMemo } from 'react'
import {
  ClipboardCheck, Plus, AlertTriangle, CheckCircle2,
  Circle, Building2, Filter, Calendar, Paperclip,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { planTrabajoDB, empresaDB } from '@/db'
import { useUser } from '@/contexts/UserContext'
import { Badge, Button, Card, StatsCard } from '@/components/ui'
import ActividadModal  from './ActividadModal'
import EvidenciaPanel  from './EvidenciaPanel'

const AÑO_ACTUAL = new Date().getFullYear()
const MES_ACTUAL = new Date().getMonth() + 1

const MESES_LABEL = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]
const MESES_FULL = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ─── Datos semilla CRO-SST-003 Ver 006 ───────────────────────────────────────
const SEED_PLAN = [
  { actividad: 'Elaboración y socialización del Plan Anual de Trabajo SST 2025', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Planificar las actividades SST del año', metas: '100% Plan aprobado y socializado en enero', estado: 'EJECUTADO', mesEjecucion: 1, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Afiliación de nuevos trabajadores al SGRL', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Garantizar cobertura SGRL al 100% del personal', metas: '100% de trabajadores afiliados', estado: 'EJECUTADO', mesEjecucion: 1, año: 2025, responsable: 'Recursos Humanos' },
  { actividad: 'Capacitación en identificación de peligros y valoración de riesgos', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Fortalecer la cultura de reporte de condiciones inseguras', metas: '90% de asistencia del personal operativo', estado: 'EJECUTADO', mesEjecucion: 2, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Actualización Matriz de Identificación de Peligros (MIPER)', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Mantener actualizada la MIPER con los procesos actuales', metas: 'MIPER actualizada y aprobada por la dirección', estado: 'EJECUTADO', mesEjecucion: 2, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Inspección de instalaciones locativas y puestos de trabajo', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Identificar y controlar condiciones inseguras en sedes', metas: '100% de sedes inspeccionadas; acciones correctivas ≤15 días', estado: 'EJECUTADO', mesEjecucion: 3, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Reunión ordinaria COPASST - Primer trimestre', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Dar cumplimiento a las reuniones mensuales del COPASST', metas: '100% de reuniones realizadas y actas firmadas', estado: 'EJECUTADO', mesEjecucion: 3, año: 2025, responsable: 'COPASST' },
  { actividad: 'Capacitación en manejo, uso y cuidado de EPP', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Garantizar el correcto uso de EPP en todos los cargos', metas: '100% del personal capacitado; registro de asistencia', estado: 'EJECUTADO', mesEjecucion: 4, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Entrega de Elementos de Protección Personal – 1er ciclo 2025', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Dotar al personal con los EPP requeridos según cargo', metas: '100% de trabajadores activos con EPP entregados y firmados', estado: 'EJECUTADO', mesEjecucion: 4, año: 2025, responsable: 'Almacén / SST' },
  { actividad: 'Simulacro de evacuación y atención de emergencias', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Evaluar la capacidad de respuesta ante emergencias', metas: 'Simulacro realizado con informe de resultados y plan de mejora', estado: 'EJECUTADO', mesEjecucion: 5, año: 2025, responsable: 'Brigada de emergencias' },
  { actividad: 'Actualización y revisión del Plan de Emergencias', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Mantener vigente el plan de emergencias conforme a cambios operativos', metas: 'Plan actualizado y socializado al 100% del personal', estado: 'EJECUTADO', mesEjecucion: 5, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Exámenes médicos ocupacionales periódicos', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Vigilar el estado de salud de los trabajadores expuestos a riesgos prioritarios', metas: '≥ 80% de trabajadores con examen periódico realizado', estado: 'EJECUTADO', mesEjecucion: 6, año: 2025, responsable: 'Medicina Laboral' },
  { actividad: 'Reunión ordinaria COPASST - Segundo trimestre', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Dar cumplimiento a las reuniones mensuales del COPASST', metas: '100% de reuniones realizadas y actas firmadas', estado: 'EJECUTADO', mesEjecucion: 6, año: 2025, responsable: 'COPASST' },
  { actividad: 'Capacitación en higiene postural y manejo manual de cargas', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Reducir la incidencia de lesiones osteomusculares', metas: '90% de trabajadores con exposición a carga física capacitados', estado: 'PENDIENTE', mesEjecucion: 7, año: 2025, responsable: 'ARL / Profesional SST' },
  { actividad: 'Seguimiento a programas de vigilancia epidemiológica', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Controlar los riesgos con mayor prevalencia de enfermedad laboral', metas: 'Informe semestral de seguimiento emitido', estado: 'PENDIENTE', mesEjecucion: 7, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Inspección de herramientas, equipos y elementos de trabajo', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Verificar condiciones de seguridad de herramientas y equipos', metas: '100% de equipos inspeccionados; acciones correctivas documentadas', estado: 'PENDIENTE', mesEjecucion: 8, año: 2025, responsable: 'Supervisores de área' },
  { actividad: 'Actualización de perfiles de cargo con requisitos SST', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Incluir los requisitos SST en los perfiles de cargo actualizados', metas: '100% de perfiles de cargo actualizados', estado: 'PENDIENTE', mesEjecucion: 8, año: 2025, responsable: 'RRHH / SST' },
  { actividad: 'Simulacro de atención de emergencias (derrame de sustancias)', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Evaluar la respuesta ante emergencias químicas', metas: 'Simulacro realizado; informe con indicadores de efectividad', estado: 'PENDIENTE', mesEjecucion: 9, año: 2025, responsable: 'Brigada de emergencias' },
  { actividad: 'Revisión de indicadores del SGSST – Tercer trimestre', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Medir el cumplimiento de los objetivos SST a septiembre', metas: 'Informe trimestral con análisis de indicadores aprobado por dirección', estado: 'PENDIENTE', mesEjecucion: 9, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Capacitación en prevención de accidentes de trabajo y enfermedad laboral', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Fortalecer conocimientos de prevención en todos los niveles', metas: '100% del personal capacitado; evaluación con nota ≥ 80%', estado: 'PENDIENTE', mesEjecucion: 10, año: 2025, responsable: 'ARL / Profesional SST' },
  { actividad: 'Inspección y reposición de botiquines de primeros auxilios', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Mantener los botiquines dotados y en condiciones óptimas', metas: '100% de botiquines inspeccionados y elementos vencidos reemplazados', estado: 'PENDIENTE', mesEjecucion: 10, año: 2025, responsable: 'Brigada de emergencias' },
  { actividad: 'Semana de la Salud y Seguridad en el Trabajo', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Fomentar la cultura SST mediante actividades de bienestar', metas: '≥ 70% de participación del personal en actividades programadas', estado: 'PENDIENTE', mesEjecucion: 11, año: 2025, responsable: 'SST / Bienestar' },
  { actividad: 'Actualización del Reglamento de Higiene y Seguridad Industrial', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Mantener vigente el Reglamento conforme a normativa actual', metas: 'Reglamento actualizado, aprobado y publicado en todas las sedes', estado: 'PENDIENTE', mesEjecucion: 11, año: 2025, responsable: 'Profesional SST / Dirección' },
  { actividad: 'Revisión por la alta dirección del SGSST', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Evaluar la eficacia del SGSST y definir directrices para el siguiente año', metas: 'Acta de revisión por la alta dirección emitida y archivada', estado: 'PENDIENTE', mesEjecucion: 12, año: 2025, responsable: 'Dirección / SST' },
  { actividad: 'Elaboración del informe anual de gestión SST 2025', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Documentar los resultados del SGSST durante el año 2025', metas: 'Informe anual aprobado y presentado a la dirección antes del 31 dic', estado: 'PENDIENTE', mesEjecucion: 12, año: 2025, responsable: 'Profesional SST' },
  { actividad: 'Evaluación del cumplimiento del Plan Anual de Trabajo 2025', empresa: 'Corporación para el Fomento del Bienestar Social', objetivo: 'Medir el porcentaje de cumplimiento del PAT 2025 y definir Plan 2026', metas: '≥ 90% de actividades ejecutadas; informe con plan de mejora', estado: 'PENDIENTE', mesEjecucion: 12, año: 2025, responsable: 'Profesional SST' },
]

// ─── Tooltip para BarChart ────────────────────────────────────────────────────
function TooltipCumplimiento({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const { programadas, ejecutadas, pct } = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-xs min-w-[140px]">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      <p className="text-slate-500">Programadas: <span className="font-semibold text-slate-700">{programadas}</span></p>
      <p className="text-slate-500">Ejecutadas: <span className="font-semibold text-green-600">{ejecutadas}</span></p>
      <p className="text-primary-700 font-bold mt-1">{pct}% cumplimiento</p>
    </div>
  )
}

// ─── Tarjeta de cumplimiento por empresa ─────────────────────────────────────
function EmpresaCompliance({ empresa, actividades }) {
  const total     = actividades.length
  const ejecutadas = actividades.filter(a => a.estado === 'EJECUTADO').length
  const pct       = total > 0 ? Math.round((ejecutadas / total) * 100) : 0

  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const bgColor = pct >= 80 ? 'bg-green-50 border-green-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-slate-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-700 leading-tight truncate" title={empresa}>{empresa}</p>
          <p className="text-xs text-slate-500 mt-0.5">{ejecutadas} / {total} actividades</p>
          <div className="mt-2 h-2 bg-white/70 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
          <p className="text-sm font-bold mt-1" style={{ color }}>{pct}% cumplimiento</p>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de actividad ────────────────────────────────────────────────────────
function FilaActividad({ act, onEdit, onDelete, onToggle, onEvidencias }) {
  const esEjecutado = act.estado === 'EJECUTADO'
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <button
            onClick={() => onToggle(act)}
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
            title={esEjecutado ? 'Marcar como pendiente' : 'Marcar como ejecutado'}
          >
            {esEjecutado
              ? <CheckCircle2 size={18} className="text-green-500" />
              : <Circle size={18} className="text-slate-300" />
            }
          </button>
          <div className="min-w-0">
            <p className={`text-sm font-medium leading-snug ${esEjecutado ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {act.actividad}
            </p>
            {act.responsable && (
              <p className="text-xs text-slate-400 mt-0.5">{act.responsable}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px]">
        <p className="truncate" title={act.empresa}>{act.empresa}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px]">
        <p className="line-clamp-2" title={act.objetivo}>{act.objetivo}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px]">
        <p className="line-clamp-2" title={act.metas}>{act.metas}</p>
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <Badge variant={esEjecutado ? 'success' : 'neutral'} size="sm">
          {esEjecutado ? 'Ejecutado' : 'Pendiente'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap text-center">
        {MESES_FULL[act.mesEjecucion]}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onEvidencias(act)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Ver / subir evidencias"
          >
            <Paperclip size={14} />
          </button>
          <button
            onClick={() => onEdit(act)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            onClick={() => onDelete(act)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PlanTrabajo() {
  const { user }                      = useUser()
  const [actividades, setActividades] = useState([])
  const [empresas,    setEmpresas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [modal,       setModal]       = useState(null)
  const [confirmar,   setConfirmar]   = useState(null)
  const [evidenciaAct, setEvidenciaAct] = useState(null)

  // Filtros
  const [filtroAño,     setFiltroAño]     = useState(AÑO_ACTUAL)
  const [filtroMes,     setFiltroMes]     = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [acts, emps] = await Promise.all([
        planTrabajoDB.getAll(),
        empresaDB.getAll(),
      ])
      // Si no hay datos, insertar seed CRO-SST-003
      if (!acts || acts.length === 0) {
        await planTrabajoDB.bulkCreate(SEED_PLAN.map(a => ({
          ...a,
          fechaCreacion: new Date().toISOString(),
        })))
        const nuevas = await planTrabajoDB.getAll()
        setActividades(nuevas || [])
      } else {
        setActividades(acts)
      }
      setEmpresas(emps || [])
    } finally {
      setLoading(false)
    }
  }

  // ── Filtrado ────────────────────────────────────────────────────────────────
  const actsFiltradas = useMemo(() => {
    return actividades.filter(a => {
      if (filtroAño     && a.año !== Number(filtroAño))       return false
      if (filtroMes     && a.mesEjecucion !== Number(filtroMes)) return false
      if (filtroEstado  && a.estado !== filtroEstado)         return false
      if (filtroEmpresa && a.empresa !== filtroEmpresa)       return false
      return true
    })
  }, [actividades, filtroAño, filtroMes, filtroEstado, filtroEmpresa])

  // ── Actividades del mes actual (alertas) ────────────────────────────────────
  const alertasMesActual = useMemo(() =>
    actividades.filter(a =>
      a.año === AÑO_ACTUAL &&
      a.mesEjecucion === MES_ACTUAL &&
      a.estado === 'PENDIENTE'
    ), [actividades])

  // ── Stats globales (por año) ────────────────────────────────────────────────
  const actsPorAño = useMemo(() =>
    actividades.filter(a => a.año === Number(filtroAño)),
    [actividades, filtroAño])

  const stats = useMemo(() => {
    const total     = actsPorAño.length
    const ejecutadas = actsPorAño.filter(a => a.estado === 'EJECUTADO').length
    const pendientes = total - ejecutadas
    const pct       = total > 0 ? Math.round((ejecutadas / total) * 100) : 0
    return { total, ejecutadas, pendientes, pct }
  }, [actsPorAño])

  // ── Gráfico de cumplimiento mensual ────────────────────────────────────────
  const dataMensual = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1
      const mesActs = actsPorAño.filter(a => a.mesEjecucion === mes)
      const programadas = mesActs.length
      const ejecutadas  = mesActs.filter(a => a.estado === 'EJECUTADO').length
      const pct = programadas > 0 ? Math.round((ejecutadas / programadas) * 100) : 0
      return { mes: MESES_LABEL[mes], mesN: mes, programadas, ejecutadas, pct }
    })
  }, [actsPorAño])

  // ── Cumplimiento por empresa ────────────────────────────────────────────────
  const porEmpresa = useMemo(() => {
    const mapa = {}
    actsPorAño.forEach(a => {
      if (!mapa[a.empresa]) mapa[a.empresa] = []
      mapa[a.empresa].push(a)
    })
    return Object.entries(mapa).map(([emp, acts]) => ({ empresa: emp, actividades: acts }))
  }, [actsPorAño])

  // ── Lista de empresas únicas para filtro ───────────────────────────────────
  const empresasUnicas = useMemo(() => {
    const s = new Set(actividades.map(a => a.empresa).filter(Boolean))
    return [...s]
  }, [actividades])

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const guardar = async (data) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        mesEjecucion: Number(data.mesEjecucion),
        año:          Number(data.año),
      }
      if (modal?.id) {
        await planTrabajoDB.update(modal.id, payload)
      } else {
        await planTrabajoDB.create(payload)
      }
      setModal(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const toggleEstado = async (act) => {
    const nuevoEstado = act.estado === 'EJECUTADO' ? 'PENDIENTE' : 'EJECUTADO'
    await planTrabajoDB.update(act.id, { estado: nuevoEstado })
    setActividades(prev =>
      prev.map(a => a.id === act.id ? { ...a, estado: nuevoEstado } : a)
    )
  }

  const eliminar = async () => {
    if (!confirmar) return
    setSaving(true)
    try {
      await planTrabajoDB.remove(confirmar.id)
      setConfirmar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const AÑOS_DISP = useMemo(() => {
    const s = new Set(actividades.map(a => a.año).filter(Boolean))
    s.add(AÑO_ACTUAL)
    return [...s].sort()
  }, [actividades])

  // ── Bar colors ─────────────────────────────────────────────────────────────
  const barColor = (pct) => pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-primary-700" strokeWidth={1.8} />
            Plan Anual de Trabajo SST
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            CRO-SST-003 · Ver. 006 · {stats.pct}% cumplimiento {filtroAño}
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setModal({})}>
          Nueva actividad
        </Button>
      </div>

      {/* ── Alerta mes actual ─────────────────────────────────────────────── */}
      {alertasMesActual.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {alertasMesActual.length} actividad{alertasMesActual.length > 1 ? 'es pendientes' : ' pendiente'} para {MESES_FULL[MES_ACTUAL]}
            </p>
            <ul className="mt-1 space-y-0.5">
              {alertasMesActual.map(a => (
                <li key={a.id} className="text-xs text-amber-700 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                  {a.actividad}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard title="Total actividades" value={stats.total} icon={ClipboardCheck} color="blue" />
        <StatsCard title="Ejecutadas" value={stats.ejecutadas} icon={CheckCircle2} color="green" />
        <StatsCard title="Pendientes" value={stats.pendientes} icon={Circle} color="orange" />
        <StatsCard title="% Cumplimiento" value={`${stats.pct}%`} icon={Calendar} color={stats.pct >= 80 ? 'green' : stats.pct >= 50 ? 'orange' : 'red'} />
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Filter size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Año</label>
            <select
              value={filtroAño}
              onChange={e => setFiltroAño(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {AÑOS_DISP.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Mes</label>
            <select
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{MESES_FULL[i+1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EJECUTADO">Ejecutado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <select
              value={filtroEmpresa}
              onChange={e => setFiltroEmpresa(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas</option>
              {empresasUnicas.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>
        {(filtroMes || filtroEstado || filtroEmpresa) && (
          <p className="text-xs text-slate-500 mt-2">
            Mostrando <strong>{actsFiltradas.length}</strong> de <strong>{actsPorAño.length}</strong> actividades
            <button
              onClick={() => { setFiltroMes(''); setFiltroEstado(''); setFiltroEmpresa('') }}
              className="ml-2 text-primary-600 hover:underline"
            >
              Limpiar filtros
            </button>
          </p>
        )}
      </Card>

      {/* ── Gráfico mensual + Por empresa ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <p className="text-sm font-semibold text-slate-700 mb-4">
            Cumplimiento por mes — {filtroAño}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataMensual} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<TooltipCumplimiento />} />
              <Bar dataKey="pct" radius={[5, 5, 0, 0]} maxBarSize={36}>
                {dataMensual.map((entry, idx) => (
                  <Cell key={idx}
                    fill={entry.mesN === MES_ACTUAL && entry.programadas > 0
                      ? '#f59e0b'
                      : barColor(entry.pct)
                    }
                    opacity={entry.programadas === 0 ? 0.2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-1 text-center">
            Amarillo = mes actual · Rojo &lt; 50% · Naranja 50–79% · Verde ≥ 80%
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            Cumplimiento por empresa — {filtroAño}
          </p>
          {porEmpresa.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {porEmpresa.map(({ empresa, actividades: acts }) => (
                <EmpresaCompliance key={empresa} empresa={empresa} actividades={acts} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Tabla de actividades ─────────────────────────────────────────── */}
      <Card noPadding>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            Actividades {filtroAño}
            {filtroMes ? ` · ${MESES_FULL[filtroMes]}` : ''}
            {filtroEstado ? ` · ${filtroEstado === 'EJECUTADO' ? 'Ejecutadas' : 'Pendientes'}` : ''}
          </p>
          <span className="text-xs text-slate-400">{actsFiltradas.length} actividades</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Cargando…</div>
        ) : actsFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-400">
            <ClipboardCheck size={28} strokeWidth={1.3} />
            <p className="text-sm">Sin actividades para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actividad</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Objetivo</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Metas</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Mes</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actsFiltradas.map(act => (
                  <FilaActividad
                    key={act.id}
                    act={act}
                    onEdit={setModal}
                    onDelete={setConfirmar}
                    onToggle={toggleEstado}
                    onEvidencias={setEvidenciaAct}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Panel de evidencias ─────────────────────────────────────────── */}
      {evidenciaAct && (
        <EvidenciaPanel
          actividad={evidenciaAct}
          usuarioId={user?.id}
          onClose={() => setEvidenciaAct(null)}
        />
      )}

      {/* ── Modal crear/editar ───────────────────────────────────────────── */}
      {modal !== null && (
        <ActividadModal
          actividad={modal?.id ? modal : null}
          empresas={empresas}
          onSave={guardar}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* ── Confirmar eliminación ────────────────────────────────────────── */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Eliminar actividad</p>
                <p className="text-xs text-slate-500 mt-1">{confirmar.actividad}</p>
                <p className="text-xs text-slate-400 mt-1">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmar(null)} disabled={saving}>Cancelar</Button>
              <Button variant="danger" onClick={eliminar} loading={saving}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
