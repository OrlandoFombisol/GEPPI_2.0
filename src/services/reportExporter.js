import * as XLSX from 'xlsx'
import db                    from '@/db/schema'
import {
  trabajadorDB, entregaDB, inventarioDB,
  eppDB, cargoDB, sedeDB, empresaDB, asignacionDB,
} from '@/db'
import { calcularEstadoEPP, formatearFecha, formatearFechaHora } from '@/utils/dates'
import { ESTADO_EPP_LABEL, ESTADO_STOCK_LABEL, TIPO_CONTRATO, SISTEMA } from '@/constants'
import { formatearNumeroActa } from '@/utils/formatters'

// ─── Helpers internos ─────────────────────────────────────────────────────────

const hoy    = () => new Date().toISOString().slice(0, 10)
const ahora  = () => new Date().toLocaleString('es-CO')

const CONTRATO_LABEL = Object.fromEntries(TIPO_CONTRATO.map(t => [t.value, t.label]))

function crearHoja(filas, anchosCols) {
  const ws = XLSX.utils.json_to_sheet(filas)
  if (anchosCols) ws['!cols'] = anchosCols
  return ws
}

function hojaMetadatos(empresa) {
  const info = [
    { Campo: 'Sistema',           Valor: SISTEMA.NOMBRE_COMPLETO       },
    { Campo: 'Documento',         Valor: SISTEMA.CODIGO_DOCUMENTO       },
    { Campo: 'Versión matriz',    Valor: `${SISTEMA.VERSION_MATRIZ}`    },
    { Campo: 'Empresa',           Valor: empresa?.razonSocial || '—'    },
    { Campo: 'NIT',               Valor: empresa?.nit || '—'            },
    { Campo: 'Normativa',         Valor: SISTEMA.NORMATIVA              },
    { Campo: 'Generado el',       Valor: ahora()                        },
  ]
  return XLSX.utils.json_to_sheet(info)
}

function descargar(wb, nombre) {
  XLSX.writeFile(wb, `${nombre}_${hoy()}.xlsx`)
}

// ─── Carga base compartida ────────────────────────────────────────────────────

async function cargarBase() {
  const [trabajadores, entregas, detalles, inventario, epps, cargos, sedes, empresas, asigs] =
    await Promise.all([
      trabajadorDB.getAll(),
      entregaDB.getAll(),
      db.detalleEntrega.toArray(),
      inventarioDB.getAll(),
      eppDB.getAll(),
      cargoDB.getAll(),
      sedeDB.getAll(),
      empresaDB.getAll(),
      asignacionDB.getAll(),
    ])
  return {
    trabajadores: trabajadores || [],
    entregas:     entregas     || [],
    detalles:     detalles     || [],
    inventario:   inventario   || [],
    epps:         epps         || [],
    cargos:       cargos       || [],
    sedes:        sedes        || [],
    empresa:     (empresas     || [])[0] || null,
    asigs:        asigs        || [],
    eppMap:    Object.fromEntries((epps    || []).map(e => [e.id, e])),
    cargoMap:  Object.fromEntries((cargos  || []).map(c => [c.id, c])),
    sedeMap:   Object.fromEntries((sedes   || []).map(s => [s.id, s.nombre])),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REPORTE 1 — Historial de Entregas
// ═══════════════════════════════════════════════════════════════════════════════

export async function generarReporteEntregas({ sedeId, desde, hasta } = {}) {
  const { trabajadores, entregas, detalles, epps, cargos, sedes, empresa } = await cargarBase()

  const trabMap  = Object.fromEntries(trabajadores.map(t => [t.id, t]))
  const cargoMap = Object.fromEntries(cargos.map(c => [c.id, c]))
  const sedeMap  = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))
  const eppMap   = Object.fromEntries(epps.map(e => [e.id, e]))
  const detMap   = {}
  detalles.forEach(d => {
    if (!detMap[d.entregaId]) detMap[d.entregaId] = []
    detMap[d.entregaId].push(d)
  })

  let filtradasE = entregas
  if (sedeId)  filtradasE = filtradasE.filter(e => String(e.sedeId) === String(sedeId))
  if (desde)   filtradasE = filtradasE.filter(e => e.fechaEntrega >= desde)
  if (hasta)   filtradasE = filtradasE.filter(e => e.fechaEntrega <= hasta + 'T23:59:59')

  const filas = []
  for (const ent of filtradasE) {
    const trab    = trabMap[ent.trabajadorId] || {}
    const items   = detMap[ent.id] || []
    const baseRow = {
      'Acta N°':         formatearNumeroActa(ent.id, new Date(ent.fechaEntrega).getFullYear()),
      'Fecha entrega':   formatearFecha(ent.fechaEntrega),
      'Estado entrega':  ent.estado,
      'Cédula':          trab.cedula || '—',
      'Nombres':         trab.nombres || '—',
      'Apellidos':       trab.apellidos || '—',
      'Cargo':           cargoMap[ent.cargoId]?.nombre || '—',
      'Sede':            sedeMap[ent.sedeId] || '—',
      'Responsable':     ent.responsableNombre || '—',
      'Observaciones':   ent.observaciones || '',
    }
    if (items.length === 0) {
      filas.push({ ...baseRow, 'Ítem EPP': '—', 'Nombre EPP': '—', Cantidad: '', 'Fecha vencimiento': '' })
    } else {
      for (const d of items) {
        const epp = eppMap[d.eppId] || {}
        filas.push({
          ...baseRow,
          'Ítem EPP':           String(epp.item || '').padStart(2, '0'),
          'Nombre EPP':         epp.nombre || '—',
          'Cantidad':           d.cantidad,
          'Vida útil (días)':   d.vidaUtilDias || '',
          'Fecha vencimiento':  d.fechaVencimiento ? formatearFecha(d.fechaVencimiento) : '—',
        })
      }
    }
  }

  const anchos = [12, 14, 12, 12, 18, 18, 22, 20, 22, 20, 8, 28, 8, 14, 16].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, crearHoja(filas, anchos), 'Entregas')
  XLSX.utils.book_append_sheet(wb, hojaMetadatos(empresa), 'Info')
  descargar(wb, 'Reporte_Entregas_GEPPI')
  return filas.length
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REPORTE 2 — Estado de EPP por Trabajador
// ═══════════════════════════════════════════════════════════════════════════════

export async function generarReporteEstadoEPP({ sedeId } = {}) {
  const { trabajadores, entregas, detalles, epps, cargos, sedes, empresa, asigs, eppMap, cargoMap, sedeMap } =
    await cargarBase()

  let activos = trabajadores.filter(t => t.estado === 'ACTIVO')
  if (sedeId) activos = activos.filter(t => String(t.sedeId) === String(sedeId))

  // Mapa: cargoId → [eppId]
  const eppPorCargo = {}
  asigs.filter(a => a.vigente !== false).forEach(a => {
    if (!eppPorCargo[a.cargoId]) eppPorCargo[a.cargoId] = []
    eppPorCargo[a.cargoId].push(a.eppId)
  })

  // Mapa: entregaId → trabajadorId (solo firmadas)
  const entregaATrab = {}
  entregas.filter(e => e.estado === 'FIRMADA').forEach(e => { entregaATrab[e.id] = e.trabajadorId })

  // Última fecha de vencimiento por (trabajadorId, eppId)
  const ultimaFV = {}  // `tid-eppId` → fechaVencimiento
  detalles.forEach(d => {
    const tid = entregaATrab[d.entregaId]
    if (!tid) return
    const key = `${tid}-${d.eppId}`
    const fv = d.fechaVencimiento || ''
    if (!ultimaFV[key] || fv > ultimaFV[key]) ultimaFV[key] = fv
  })

  const filas = []
  for (const t of activos) {
    const eppIds = eppPorCargo[t.cargoId] || []
    if (eppIds.length === 0) {
      filas.push({
        Cédula: t.cedula, Nombres: t.nombres, Apellidos: t.apellidos,
        Cargo: cargoMap[t.cargoId]?.nombre || '—', Sede: sedeMap[t.sedeId] || '—',
        Contrato: CONTRATO_LABEL[t.tipoContrato] || t.tipoContrato || '—',
        'Ítem': '—', 'Nombre EPP': 'Sin EPP asignado', 'Vencimiento': '—', Estado: '—',
      })
      continue
    }
    for (const eppId of eppIds) {
      const epp  = eppMap[eppId]
      const fv   = ultimaFV[`${t.id}-${eppId}`] || null
      const est  = calcularEstadoEPP(fv)
      filas.push({
        Cédula:     t.cedula,
        Nombres:    t.nombres,
        Apellidos:  t.apellidos,
        Cargo:      cargoMap[t.cargoId]?.nombre || '—',
        Sede:       sedeMap[t.sedeId]   || '—',
        Contrato:   CONTRATO_LABEL[t.tipoContrato] || t.tipoContrato || '—',
        Ítem:       String(epp?.item || '').padStart(2, '0'),
        'Nombre EPP':   epp?.nombre || '—',
        Vencimiento:    fv ? formatearFecha(fv) : 'Sin entrega',
        Estado:         ESTADO_EPP_LABEL[est] || est,
      })
    }
  }

  const anchos = [12, 18, 18, 24, 20, 26, 6, 30, 16, 20].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, crearHoja(filas, anchos), 'Estado EPP')
  XLSX.utils.book_append_sheet(wb, hojaMetadatos(empresa), 'Info')
  descargar(wb, 'Estado_EPP_Trabajadores_GEPPI')
  return filas.length
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REPORTE 3 — Inventario actual
// ═══════════════════════════════════════════════════════════════════════════════

export async function generarReporteInventario({ sedeId } = {}) {
  const { inventario, epps, sedes, empresa } = await cargarBase()
  const eppMap  = Object.fromEntries(epps.map(e => [e.id, e]))
  const sedeMap = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))

  let inv = inventario
  if (sedeId) inv = inv.filter(i => String(i.sedeId) === String(sedeId))

  const filas = inv
    .sort((a, b) => (eppMap[a.eppId]?.item || 99) - (eppMap[b.eppId]?.item || 99))
    .map(i => {
      const epp    = eppMap[i.eppId] || {}
      const min    = i.stockMinimo ?? 5
      const estado = i.stockActual === 0 ? 'AGOTADO' : i.stockActual <= min ? 'BAJO' : 'OK'
      return {
        'Ítem':             String(epp.item || '').padStart(2, '0'),
        'Nombre EPP':       epp.nombre || '—',
        Sede:               sedeMap[i.sedeId] || '—',
        'Stock actual':     i.stockActual,
        'Stock mínimo':     min,
        'Unidad de medida': i.unidadMedida || 'Unidad',
        Estado:             ESTADO_STOCK_LABEL[estado] || estado,
        'Última actualización': formatearFecha(i.fechaUltimaActualizacion),
      }
    })

  const anchos = [6, 34, 20, 12, 12, 14, 14, 20].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, crearHoja(filas, anchos), 'Inventario')
  XLSX.utils.book_append_sheet(wb, hojaMetadatos(empresa), 'Info')
  descargar(wb, 'Inventario_EPP_GEPPI')
  return filas.length
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REPORTE 4 — Cumplimiento SST
// ═══════════════════════════════════════════════════════════════════════════════

export async function generarReporteCumplimiento({ sedeId } = {}) {
  const { trabajadores, entregas, detalles, epps, cargos, sedes, empresa, asigs, eppMap, cargoMap, sedeMap } =
    await cargarBase()

  let activos = trabajadores.filter(t => t.estado === 'ACTIVO')
  if (sedeId) activos = activos.filter(t => String(t.sedeId) === String(sedeId))

  const eppPorCargo = {}
  asigs.filter(a => a.vigente !== false).forEach(a => {
    if (!eppPorCargo[a.cargoId]) eppPorCargo[a.cargoId] = []
    eppPorCargo[a.cargoId].push(a.eppId)
  })

  const entregaATrab = {}
  entregas.filter(e => e.estado === 'FIRMADA').forEach(e => { entregaATrab[e.id] = e.trabajadorId })

  const ultimaFV = {}
  detalles.forEach(d => {
    const tid = entregaATrab[d.entregaId]
    if (!tid) return
    const key = `${tid}-${d.eppId}`
    const fv = d.fechaVencimiento || ''
    if (!ultimaFV[key] || fv > ultimaFV[key]) ultimaFV[key] = fv
  })

  let cumpleTodos = 0, tieneVencido = 0, tienePendiente = 0

  const detalle = []
  for (const t of activos) {
    const eppIds = eppPorCargo[t.cargoId] || []
    let vencidoCount = 0, pendienteCount = 0, vigente = 0
    for (const eppId of eppIds) {
      const fv  = ultimaFV[`${t.id}-${eppId}`] || null
      const est = calcularEstadoEPP(fv)
      if (est === 'VENCIDO')          vencidoCount++
      else if (est === 'SIN_ENTREGA') pendienteCount++
      else                            vigente++
    }
    const estado = vencidoCount > 0   ? 'NO CUMPLE — EPP vencido'    :
                   pendienteCount > 0  ? 'PENDIENTE — Sin primera entrega' :
                                         'CUMPLE'
    if (vencidoCount > 0)   tieneVencido++
    else if (pendienteCount > 0) tienePendiente++
    else                     cumpleTodos++

    detalle.push({
      Cédula:     t.cedula,
      Nombres:    `${t.nombres} ${t.apellidos}`,
      Cargo:      cargoMap[t.cargoId]?.nombre || '—',
      Sede:       sedeMap[t.sedeId] || '—',
      'Total EPP asignados':  eppIds.length,
      'EPP vigentes':         vigente,
      'EPP vencidos':         vencidoCount,
      'Sin primera entrega':  pendienteCount,
      'Cumplimiento':         estado,
    })
  }

  const pct  = activos.length > 0 ? Math.round((cumpleTodos / activos.length) * 100) : 0
  const resumen = [
    { Indicador: 'Total trabajadores activos evaluados', Valor: activos.length },
    { Indicador: 'Cumplen (todos los EPP vigentes)',     Valor: cumpleTodos   },
    { Indicador: 'No cumplen (EPP vencido)',             Valor: tieneVencido  },
    { Indicador: 'Pendientes (sin primera entrega)',     Valor: tienePendiente },
    { Indicador: '% Cumplimiento legal',                 Valor: `${pct}%`     },
    { Indicador: 'Normativa',                            Valor: SISTEMA.NORMATIVA },
    { Indicador: 'Fecha evaluación',                     Valor: ahora()       },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
  XLSX.utils.book_append_sheet(wb, crearHoja(detalle, [12,28,24,20,14,12,12,14,28].map(w=>({wch:w}))), 'Detalle')
  XLSX.utils.book_append_sheet(wb, hojaMetadatos(empresa), 'Info')
  descargar(wb, 'Cumplimiento_SST_GEPPI')
  return { total: activos.length, cumpleTodos, tieneVencido, tienePendiente, pct }
}
