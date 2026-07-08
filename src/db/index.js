import { supabase }                          from '@/lib/supabase'
import { fromDB, manyFromDB, toDB, fromDBInventario } from '@/lib/mappers'
import { ESTADO_STOCK }                       from '@/constants'

// ─────────────────────────────────────────────────────────────────────────────
//  UTILIDAD INTERNA
// ─────────────────────────────────────────────────────────────────────────────

function err(ctx, error) {
  console.error(`[GEPPI DB] ${ctx}:`, error)
  throw new Error(`${ctx}: ${error?.message || error}`)
}

async function q(ctx, promise) {
  const { data, error } = await promise
  if (error) err(ctx, error)
  return data
}

// Supabase lanza PGRST116 cuando .single() no encuentra fila — lo convertimos en null
async function one(ctx, promise) {
  const { data, error } = await promise
  if (error) {
    if (error.code === 'PGRST116') return null
    err(ctx, error)
  }
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMPRESA
// ─────────────────────────────────────────────────────────────────────────────

export const empresaDB = {
  async getAll() {
    const data = await q('empresa.getAll', supabase.from('empresa').select('*').order('id'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('empresa.getById', supabase.from('empresa').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async create(data) {
    const row = await one('empresa.create', supabase.from('empresa').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('empresa.update', supabase.from('empresa').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('empresa.remove', supabase.from('empresa').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEDE
// ─────────────────────────────────────────────────────────────────────────────

export const sedeDB = {
  async getAll() {
    const data = await q('sede.getAll', supabase.from('sede').select('*').order('id'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('sede.getById', supabase.from('sede').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getPorEmpresa(empresaId) {
    const data = await q('sede.getPorEmpresa', supabase.from('sede').select('*').eq('empresa_id', empresaId))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('sede.create', supabase.from('sede').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('sede.update', supabase.from('sede').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('sede.remove', supabase.from('sede').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARGO
// ─────────────────────────────────────────────────────────────────────────────

export const cargoDB = {
  async getAll() {
    const data = await q('cargo.getAll', supabase.from('cargo').select('*').order('nombre'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('cargo.getById', supabase.from('cargo').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getActivos() {
    const data = await q('cargo.getActivos', supabase.from('cargo').select('*').eq('estado', 'ACTIVO').order('nombre'))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('cargo.create', supabase.from('cargo').insert({ ...toDB(data), estado: 'ACTIVO' }).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('cargo.update', supabase.from('cargo').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('cargo.remove', supabase.from('cargo').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EPP
// ─────────────────────────────────────────────────────────────────────────────

export const eppDB = {
  async getAll() {
    const data = await q('epp.getAll', supabase.from('epp').select('*').order('item'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('epp.getById', supabase.from('epp').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getActivos() {
    const data = await q('epp.getActivos', supabase.from('epp').select('*').eq('estado', 'ACTIVO').order('item'))
    return manyFromDB(data)
  },
  async create(data) {
    const { fichaTecnicaBlob, fichaTecnicaNombre, ...rest } = data
    const row = await one('epp.create', supabase.from('epp').insert({ ...toDB(rest), estado: 'ACTIVO' }).select('id').single())
    return row?.id
  },
  async update(id, data) {
    const { fichaTecnicaBlob, fichaTecnicaNombre, ...rest } = data
    await q('epp.update', supabase.from('epp').update(toDB(rest)).eq('id', id))
  },
  async remove(id) {
    await q('epp.remove', supabase.from('epp').delete().eq('id', id))
  },
  async bulkCreate(epps) {
    const rows = epps.map(e => ({ ...toDB(e), estado: 'ACTIVO' }))
    const data = await q('epp.bulkCreate', supabase.from('epp').insert(rows).select('id'))
    return data?.map(r => r.id)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASIGNACIÓN CARGO-EPP
// ─────────────────────────────────────────────────────────────────────────────

export const asignacionDB = {
  async getAll() {
    const data = await q('asignacion.getAll', supabase.from('asignacion_cargo_epp').select('*'))
    return manyFromDB(data)
  },
  async getEppPorCargo(cargoId) {
    const data = await q('asignacion.getEppPorCargo',
      supabase.from('asignacion_cargo_epp').select('*').eq('cargo_id', cargoId).eq('vigente', true))
    return manyFromDB(data)
  },
  async getCargosPorEpp(eppId) {
    const data = await q('asignacion.getCargosPorEpp',
      supabase.from('asignacion_cargo_epp').select('*').eq('epp_id', eppId).eq('vigente', true))
    return manyFromDB(data)
  },
  async getByCargoYEpp(cargoId, eppId) {
    const data = await one('asignacion.getByCargoYEpp',
      supabase.from('asignacion_cargo_epp').select('*')
        .eq('cargo_id', cargoId).eq('epp_id', eppId).single())
    return fromDB(data)
  },
  async toggle(cargoId, eppId) {
    const existente = await this.getByCargoYEpp(cargoId, eppId)
    if (existente) {
      await q('asignacion.toggle.update',
        supabase.from('asignacion_cargo_epp').update({ vigente: !existente.vigente }).eq('id', existente.id))
      return !existente.vigente
    }
    await q('asignacion.toggle.insert',
      supabase.from('asignacion_cargo_epp').insert({ cargo_id: cargoId, epp_id: eppId, vigente: true }))
    return true
  },
  async bulkCreate(asignaciones) {
    const rows = asignaciones.map(a => toDB(a))
    const data = await q('asignacion.bulkCreate', supabase.from('asignacion_cargo_epp').insert(rows).select('id'))
    return data?.map(r => r.id)
  },
  async limpiarPorCargo(cargoId) {
    await q('asignacion.limpiarPorCargo',
      supabase.from('asignacion_cargo_epp').delete().eq('cargo_id', cargoId))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRABAJADOR
// ─────────────────────────────────────────────────────────────────────────────

export const trabajadorDB = {
  async getAll() {
    const data = await q('trabajador.getAll', supabase.from('trabajador').select('*').order('apellidos'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('trabajador.getById', supabase.from('trabajador').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getByCedula(cedula) {
    const data = await one('trabajador.getByCedula',
      supabase.from('trabajador').select('*').eq('cedula', String(cedula)).single())
    return fromDB(data)
  },
  async getTrabajadoresPorSede(sedeId) {
    const data = await q('trabajador.getPorSede',
      supabase.from('trabajador').select('*').eq('sede_id', sedeId).eq('estado', 'ACTIVO'))
    return manyFromDB(data)
  },
  async getTrabajadoresPorEmpresa(empresaId) {
    const data = await q('trabajador.getPorEmpresa',
      supabase.from('trabajador').select('*').eq('empresa_id', empresaId).eq('estado', 'ACTIVO'))
    return manyFromDB(data)
  },
  async buscar(texto) {
    const data = await q('trabajador.buscar',
      supabase.from('trabajador').select('*')
        .or(`nombres.ilike.%${texto}%,apellidos.ilike.%${texto}%,cedula.ilike.%${texto}%`))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('trabajador.create',
      supabase.from('trabajador').insert({ ...toDB(data), cedula: String(data.cedula), estado: 'ACTIVO' }).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('trabajador.update', supabase.from('trabajador').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('trabajador.remove', supabase.from('trabajador').update({ estado: 'INACTIVO' }).eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────

export const inventarioDB = {
  async getAll() {
    const data = await q('inventario.getAll', supabase.from('inventario').select('*'))
    return (data || []).map(fromDBInventario)
  },
  async getById(id) {
    const data = await one('inventario.getById', supabase.from('inventario').select('*').eq('id', id).single())
    return fromDBInventario(data)
  },
  async getStockActual(eppId, sedeId) {
    const data = await one('inventario.getStockActual',
      supabase.from('inventario').select('*').eq('epp_id', eppId).eq('sede_id', sedeId).single())
    return fromDBInventario(data)
  },
  async getPorSede(sedeId) {
    const data = await q('inventario.getPorSede',
      supabase.from('inventario').select('*').eq('sede_id', sedeId))
    return (data || []).map(fromDBInventario)
  },
  async getAgotados() {
    const data = await q('inventario.getAgotados',
      supabase.from('inventario').select('*').eq('cantidad', 0))
    return (data || []).map(fromDBInventario)
  },
  async getBajoStock() {
    // Filtro en cliente: stockActual > 0 && stockActual <= stockMinimo
    const all = await this.getAll()
    return all.filter(i => i.stockActual > 0 && i.stockActual <= (i.stockMinimo || 5))
  },
  async create(data) {
    const row = await one('inventario.create',
      supabase.from('inventario').insert({
        epp_id: data.eppId, sede_id: data.sedeId,
        cantidad: data.stockActual ?? 0,
        stock_minimo: data.stockMinimo ?? 5,
      }).select('id').single())
    return row?.id
  },
  async update(id, data) {
    const dbData = {}
    if (data.stockActual !== undefined) dbData.cantidad    = data.stockActual
    if (data.stockMinimo !== undefined) dbData.stock_minimo = data.stockMinimo
    await q('inventario.update', supabase.from('inventario').update(dbData).eq('id', id))
  },
  async ajustarStock(eppId, sedeId, delta, tipo, meta = {}) {
    let registro = await this.getStockActual(eppId, sedeId)

    if (!registro) {
      const id = await this.create({ eppId, sedeId, stockActual: Math.max(0, delta), stockMinimo: 5 })
      registro = { id, stockActual: Math.max(0, delta), stockMinimo: 5, eppId, sedeId }
    }

    const saldoAnterior  = registro.stockActual
    const saldoPosterior = Math.max(0, saldoAnterior + delta)

    await this.update(registro.id, { stockActual: saldoPosterior })

    const { data: mov } = await supabase.from('movimiento_inventario').insert({
      inventario_id:          registro.id,
      epp_id:                 eppId,
      sede_id:                sedeId,
      tipo,
      cantidad:               Math.abs(delta),
      referencia_entrega_id:  meta.entregaId  || null,
      observacion:            meta.motivo     || null,
      usuario_id:             meta.usuarioId  || null,
    }).select('id').single()

    return { saldoPosterior, movimientoId: mov?.id }
  },
  getEstadoStock(registro) {
    if (!registro) return ESTADO_STOCK.AGOTADO
    if (registro.stockActual === 0) return ESTADO_STOCK.AGOTADO
    if (registro.stockActual <= (registro.stockMinimo || 5)) return ESTADO_STOCK.BAJO
    return ESTADO_STOCK.OK
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOVIMIENTO DE INVENTARIO (Kardex)
// ─────────────────────────────────────────────────────────────────────────────

export const movimientoDB = {
  async getPorEppYSede(eppId, sedeId, desde, hasta) {
    let query = supabase.from('movimiento_inventario').select('*')
      .eq('epp_id', eppId).eq('sede_id', sedeId).order('fecha', { ascending: false })
    if (desde) query = query.gte('fecha', desde)
    if (hasta) query = query.lte('fecha', hasta)
    const data = await q('movimiento.getPorEppYSede', query)
    return manyFromDB(data)
  },
  async getPorEntrega(entregaId) {
    const data = await q('movimiento.getPorEntrega',
      supabase.from('movimiento_inventario').select('*').eq('referencia_entrega_id', entregaId))
    return manyFromDB(data)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

export const entregaDB = {
  async getAll() {
    const data = await q('entrega.getAll',
      supabase.from('entrega').select('*').order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('entrega.getById', supabase.from('entrega').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getEntregasPorTrabajador(trabajadorId) {
    const data = await q('entrega.getPorTrabajador',
      supabase.from('entrega').select('*').eq('trabajador_id', trabajadorId).order('fecha_entrega', { ascending: false }))
    return manyFromDB(data)
  },
  async getUltimaEntregaEppTrabajador(trabajadorId, eppId) {
    const entregas = await this.getEntregasPorTrabajador(trabajadorId)
    const idsFirmadas = entregas.filter(e => e.estado === 'FIRMADA').map(e => e.id)
    if (!idsFirmadas.length) return null
    const data = await one('entrega.getUltimaDetalle',
      supabase.from('detalle_entrega').select('*')
        .eq('epp_id', eppId).in('entrega_id', idsFirmadas)
        .order('fecha_vencimiento', { ascending: false }).limit(1).single())
    return fromDB(data)
  },
  async getByToken(token) {
    const data = await one('entrega.getByToken',
      supabase.from('entrega').select('*').eq('token_aceptacion', token).single())
    return fromDB(data)
  },
  async crearPendiente({ trabajador, cargo, epps, usuarioId }) {
    const token = crypto.randomUUID()
    const entregaRow = await one('entrega.crearPendiente',
      supabase.from('entrega').insert({
        trabajador_id:    trabajador.id,
        cargo_id:         cargo.id,
        sede_id:          trabajador.sedeId,
        empresa_id:       trabajador.empresaId,
        fecha_entrega:    new Date().toISOString().slice(0, 10),
        estado:           'PENDIENTE',
        token_aceptacion: token,
        usuario_id:       usuarioId || null,
      }).select('id').single())
    const entregaId = entregaRow.id
    for (const item of epps) {
      await q('entrega.crearPendiente.detalle',
        supabase.from('detalle_entrega').insert({
          entrega_id:        entregaId,
          epp_id:            item.eppId,
          cantidad:          item.cantidad,
          fecha_vencimiento: item.fechaVencimiento || null,
          observacion:       item.observaciones    || null,
        }))
      await inventarioDB.ajustarStock(
        item.eppId, trabajador.sedeId, -item.cantidad, 'SALIDA',
        { entregaId, usuarioId }
      )
    }
    return { entregaId, token }
  },
  async confirmar({ trabajador, cargo, epps, observaciones, responsable, firmaBase64, usuarioId }) {
    // 1. Crear entrega
    const entregaRow = await one('entrega.confirmar.cabecera',
      supabase.from('entrega').insert({
        trabajador_id:      trabajador.id,
        cargo_id:           cargo.id,
        sede_id:            trabajador.sedeId,
        empresa_id:         trabajador.empresaId,
        fecha_entrega:      new Date().toISOString().slice(0, 10),
        estado:             'FIRMADA',
        observaciones:      observaciones || null,
        usuario_id:         usuarioId || null,
      }).select('id').single())
    const entregaId = entregaRow.id

    // 2. Detalle + descuento inventario
    for (const item of epps) {
      await q('entrega.confirmar.detalle',
        supabase.from('detalle_entrega').insert({
          entrega_id:       entregaId,
          epp_id:           item.eppId,
          cantidad:         item.cantidad,
          fecha_vencimiento: item.fechaVencimiento || null,
          observacion:      item.observaciones    || null,
        }))
      await inventarioDB.ajustarStock(
        item.eppId, trabajador.sedeId, -item.cantidad, 'SALIDA',
        { entregaId, usuarioId }
      )
    }

    // 3. Firma
    await q('entrega.confirmar.firma',
      supabase.from('firma').insert({
        entrega_id:   entregaId,
        firma_base64: firmaBase64,
        fecha_captura: new Date().toISOString(),
        dispositivo:  navigator.userAgent || 'Desconocido',
      }))

    return entregaId
  },
  async anular(id, motivo) {
    await q('entrega.anular',
      supabase.from('entrega').update({
        estado:           'ANULADA',
        observaciones:    motivo,
        fecha_aceptacion: new Date().toISOString(),
      }).eq('id', id))
  },
  async marcarPdfGenerado(id) {
    // campo legacy — no existe en v2, ignorar silenciosamente
  },
  async aceptarConToken(token, firmaBase64) {
    const entrega = await this.getByToken(token)
    if (!entrega) throw new Error('Token inválido o ya expirado.')
    if (entrega.estado === 'FIRMADA') throw new Error('Esta entrega ya fue aceptada.')
    await q('entrega.aceptarConToken.update',
      supabase.from('entrega').update({
        estado:           'FIRMADA',
        fecha_aceptacion: new Date().toISOString(),
      }).eq('token_aceptacion', token))
    await q('entrega.aceptarConToken.firma',
      supabase.from('firma').insert({
        entrega_id:   entrega.id,
        firma_base64: firmaBase64,
        fecha_captura: new Date().toISOString(),
        dispositivo:  navigator.userAgent || 'Desconocido',
        origen_qr:    true,
      }))
    return entrega.id
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  DETALLE ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

export const detalleEntregaDB = {
  async getAll() {
    const data = await q('detalle.getAll', supabase.from('detalle_entrega').select('*'))
    return manyFromDB(data)
  },
  async getPorEntrega(entregaId) {
    const data = await q('detalle.getPorEntrega',
      supabase.from('detalle_entrega').select('*').eq('entrega_id', entregaId))
    return manyFromDB(data)
  },
  async getProximosAVencer(diasMax) {
    const limite = new Date()
    limite.setDate(limite.getDate() + diasMax)
    const data = await q('detalle.getProximosAVencer',
      supabase.from('detalle_entrega').select('*')
        .not('fecha_vencimiento', 'is', null)
        .lte('fecha_vencimiento', limite.toISOString().slice(0, 10)))
    return manyFromDB(data)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIRMA
// ─────────────────────────────────────────────────────────────────────────────

export const firmaDB = {
  async getPorEntrega(entregaId) {
    const data = await one('firma.getPorEntrega',
      supabase.from('firma').select('*').eq('entrega_id', entregaId).single())
    return fromDB(data)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ALERTA
// ─────────────────────────────────────────────────────────────────────────────

export const alertaDB = {
  async getAll() {
    const data = await q('alerta.getAll',
      supabase.from('alerta').select('*').order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getNoLeidas() {
    const data = await q('alerta.getNoLeidas',
      supabase.from('alerta').select('*').eq('leida', false).order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async contarNoLeidas() {
    const { count } = await supabase.from('alerta').select('id', { count: 'exact', head: true }).eq('leida', false)
    return count || 0
  },
  async existeAlertaActiva(tipo, referenciaId) {
    const { count } = await supabase.from('alerta').select('id', { count: 'exact', head: true })
      .eq('tipo', tipo).eq('referencia_id', String(referenciaId)).eq('leida', false)
    return (count || 0) > 0
  },
  async create(data) {
    const row = await one('alerta.create',
      supabase.from('alerta').insert({
        ...toDB(data),
        leida:           false,
        fecha_generacion: new Date().toISOString(),
        referencia_id:   String(data.referenciaId || ''),
      }).select('id').single())
    return row?.id
  },
  async marcarLeida(id) {
    await q('alerta.marcarLeida', supabase.from('alerta').update({ leida: true }).eq('id', id))
  },
  async gestionar(id, accionTomada) {
    await q('alerta.gestionar', supabase.from('alerta').update({
      leida: true, gestionada: true,
      accion_tomada: accionTomada,
      fecha_gestion: new Date().toISOString(),
    }).eq('id', id))
  },
  async marcarTodasLeidas() {
    await q('alerta.marcarTodasLeidas', supabase.from('alerta').update({ leida: true }).eq('leida', false))
  },
  async remove(id) {
    await q('alerta.remove', supabase.from('alerta').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  INSPECCIONES DE SEGURIDAD
// ─────────────────────────────────────────────────────────────────────────────

const INSPECCION_SELECT = '*, empresa:empresa_id(id, razon_social, ciudad)'

export const inspeccionDB = {
  async getAll() {
    const data = await q('inspeccion.getAll',
      supabase.from('inspeccion').select(INSPECCION_SELECT).order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getPorEmpresa(empresaId) {
    const data = await q('inspeccion.getPorEmpresa',
      supabase.from('inspeccion').select(INSPECCION_SELECT).eq('empresa_id', empresaId).order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('inspeccion.getById',
      supabase.from('inspeccion').select(INSPECCION_SELECT).eq('id', id).single())
    return fromDB(data)
  },
  async create(data) {
    const row = await one('inspeccion.create',
      supabase.from('inspeccion').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async remove(id) {
    await q('inspeccion.remove', supabase.from('inspeccion').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EVIDENCIAS PLAN DE TRABAJO
// ─────────────────────────────────────────────────────────────────────────────

const TIPOS_PERMITIDOS = [
  'image/jpeg', 'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]
const MAX_BYTES   = 5 * 1024 * 1024  // 5 MB
const MAX_POR_ACT = 5                 // máx. evidencias por actividad

export const evidenciaDB = {
  async getByPlan(planId) {
    const data = await q('evidencia.getByPlan',
      supabase.from('evidencia_plan').select('*').eq('plan_id', planId).order('fecha_subida', { ascending: false }))
    return manyFromDB(data)
  },
  async upload(planId, file, usuarioId) {
    if (!TIPOS_PERMITIDOS.includes(file.type))
      throw new Error('Tipo no permitido. Solo JPG, PNG, PDF o Excel.')
    if (file.size > MAX_BYTES)
      throw new Error(`El archivo supera el límite de 5 MB (pesa ${(file.size / 1024 / 1024).toFixed(1)} MB).`)

    const { count } = await supabase
      .from('evidencia_plan').select('id', { count: 'exact', head: true }).eq('plan_id', planId)
    if ((count || 0) >= MAX_POR_ACT)
      throw new Error(`Límite alcanzado: máximo ${MAX_POR_ACT} evidencias por actividad.`)

    const nombreSeguro = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
    const path = `${planId}/${Date.now()}_${nombreSeguro}`

    const { error: upErr } = await supabase.storage
      .from('evidencias').upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error('Error al subir el archivo: ' + upErr.message)

    const tipo = file.type.includes('image') ? 'imagen'
               : file.type.includes('pdf')   ? 'pdf'
               : 'excel'

    await q('evidencia.create',
      supabase.from('evidencia_plan').insert({
        plan_id: planId, nombre: file.name, tipo,
        storage_path: path, tamaño_bytes: file.size,
        usuario_id: usuarioId || null,
      }))
  },
  async getUrl(storagePath) {
    const { data, error } = await supabase.storage
      .from('evidencias').createSignedUrl(storagePath, 3600)
    if (error) throw new Error('No se pudo obtener el enlace del archivo.')
    return data.signedUrl
  },
  async remove(id, storagePath) {
    await supabase.storage.from('evidencias').remove([storagePath])
    await q('evidencia.remove', supabase.from('evidencia_plan').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  GESTIÓN DEL CAMBIO
// ─────────────────────────────────────────────────────────────────────────────

export const gestionCambioDB = {
  async getAll() {
    const data = await q('gestionCambio.getAll',
      supabase.from('gestion_cambio').select('*').order('fecha', { ascending: false }))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('gestionCambio.create',
      supabase.from('gestion_cambio').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async bulkCreate(registros) {
    const data = await q('gestionCambio.bulkCreate',
      supabase.from('gestion_cambio').insert(registros.map(toDB)).select('id'))
    return data?.map(r => r.id)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUDITORÍA
// ─────────────────────────────────────────────────────────────────────────────

export const auditoriaDB = {
  async getAll(filtros = {}) {
    let query = supabase.from('auditoria').select('*').order('id', { ascending: false }).limit(1000)
    if (filtros.modulo) query = query.eq('modulo', filtros.modulo)
    if (filtros.accion) query = query.eq('accion', filtros.accion)
    if (filtros.desde)  query = query.gte('fecha', filtros.desde)
    if (filtros.hasta)  query = query.lte('fecha', filtros.hasta)
    const data = await q('auditoria.getAll', query)
    return manyFromDB(data)
  },
  async registrar(modulo, accion, detalle, referenciaId = null, usuarioId = null) {
    try {
      await supabase.from('auditoria').insert({
        modulo, accion,
        detalle:       detalle || null,
        referencia_id: referenciaId ? String(referenciaId) : null,
        usuario_id:    usuarioId || null,
        fecha:         new Date().toISOString(),
      })
    } catch {
      console.warn('[GEPPI] No se pudo registrar auditoría')
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  USUARIO
// ─────────────────────────────────────────────────────────────────────────────

export const usuarioDB = {
  async getAll() {
    const data = await q('usuario.getAll', supabase.from('usuario').select('*'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('usuario.getById', supabase.from('usuario').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getByCorreo(correo) {
    const data = await one('usuario.getByCorreo',
      supabase.from('usuario').select('*').eq('correo', correo.toLowerCase()).single())
    return fromDB(data)
  },
  async create({ nombre, correo, password, rol, estado }) {
    // signUp preserva la sesión existente del admin (Supabase v2)
    const { data, error } = await supabase.auth.signUp({
      email: correo.toLowerCase(),
      password,
      options: { data: { nombre, rol: rol || 'COLABORADOR' } },
    })
    if (error) throw error
    if (!data.user) throw new Error('No se pudo crear el usuario.')
    // El trigger handle_new_user ya insertó la fila; actualizamos campos extra
    await supabase.from('usuario').update({
      nombre,
      rol:    rol    || 'COLABORADOR',
      estado: estado || 'ACTIVO',
    }).eq('id', data.user.id)
    return data.user.id
  },
  async update(id, data) {
    await q('usuario.update', supabase.from('usuario').update(toDB(data)).eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  VEHÍCULO
// ─────────────────────────────────────────────────────────────────────────────

export const vehiculoDB = {
  async getAll() {
    const data = await q('vehiculo.getAll', supabase.from('vehiculo').select('*'))
    return manyFromDB(data)
  },
  async getActivos() {
    const data = await q('vehiculo.getActivos', supabase.from('vehiculo').select('*').eq('estado', 'ACTIVO'))
    return manyFromDB(data)
  },
  async getPorEmpresa(empresaId) {
    const data = await q('vehiculo.getPorEmpresa',
      supabase.from('vehiculo').select('*').eq('empresa_id', empresaId).eq('estado', 'ACTIVO'))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('vehiculo.getById', supabase.from('vehiculo').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getByPlaca(placa) {
    const { data } = await supabase.from('vehiculo').select('id').eq('placa', String(placa).toUpperCase().trim()).maybeSingle()
    return data?.id || null
  },
  async create(data) {
    const row = await one('vehiculo.create',
      supabase.from('vehiculo').insert({ ...toDB(data), placa: String(data.placa).toUpperCase().trim(), estado: 'ACTIVO' }).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('vehiculo.update', supabase.from('vehiculo').update(toDB(data)).eq('id', id))
  },
  async desactivar(id) {
    await q('vehiculo.desactivar', supabase.from('vehiculo').update({ estado: 'INACTIVO' }).eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHECKLIST PREOPERACIONAL
// ─────────────────────────────────────────────────────────────────────────────

export const checklistDB = {
  async getAll() {
    const data = await q('checklist.getAll',
      supabase.from('checklist_preoperacional').select('*').order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getList() {
    // Like getAll() but excludes foto_base64 / firma_base64 for fast list rendering
    const data = await q('checklist.getList',
      supabase.from('checklist_preoperacional')
        .select('id, empresa_id, vehiculo_id, vehiculo_placa, conductor_nombre, conductor_cedula, fecha, items, observacion_general, foto_fecha, usuario_id')
        .order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getById(id) {
    const data = await one('checklist.getById',
      supabase.from('checklist_preoperacional').select('*').eq('id', id).single())
    return fromDB(data)
  },
  async getPorEmpresa(empresaId) {
    const data = await q('checklist.getPorEmpresa',
      supabase.from('checklist_preoperacional').select('*').eq('empresa_id', empresaId).order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async getPorVehiculo(vehiculoId) {
    const data = await q('checklist.getPorVehiculo',
      supabase.from('checklist_preoperacional').select('*').eq('vehiculo_id', vehiculoId).order('id', { ascending: false }))
    return manyFromDB(data)
  },
  async filtrar({ empresaId, vehiculoId, conductorCedula, desde, hasta } = {}) {
    let query = supabase.from('checklist_preoperacional').select('*').order('id', { ascending: false })
    if (empresaId)       query = query.eq('empresa_id', empresaId)
    if (vehiculoId)      query = query.eq('vehiculo_id', vehiculoId)
    if (conductorCedula) query = query.eq('conductor_cedula', conductorCedula)
    if (desde) query = query.gte('fecha', desde)
    if (hasta) query = query.lte('fecha', hasta)
    const data = await q('checklist.filtrar', query)
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('checklist.create',
      supabase.from('checklist_preoperacional').insert(toDB(data)).select('id').single())
    return row?.id
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAN ANUAL DE TRABAJO SST
// ─────────────────────────────────────────────────────────────────────────────

export const planTrabajoDB = {
  async getAll() {
    const data = await q('planTrabajo.getAll', supabase.from('plan_trabajo').select('*'))
    return manyFromDB(data)
  },
  async getByAño(año) {
    const data = await q('planTrabajo.getByAño', supabase.from('plan_trabajo').select('*').eq('año', año))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('planTrabajo.create',
      supabase.from('plan_trabajo').insert(toDB({ ...data, estado: data.estado || 'PENDIENTE', año: data.año || new Date().getFullYear() })).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('planTrabajo.update', supabase.from('plan_trabajo').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('planTrabajo.remove', supabase.from('plan_trabajo').delete().eq('id', id))
  },
  async bulkCreate(actividades) {
    const data = await q('planTrabajo.bulkCreate',
      supabase.from('plan_trabajo').insert(actividades.map(toDB)).select('id'))
    return data?.map(r => r.id)
  },
  async count() {
    const { count } = await supabase.from('plan_trabajo').select('id', { count: 'exact', head: true })
    return count || 0
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONDICIONES INSEGURAS
// ─────────────────────────────────────────────────────────────────────────────

export const condicionesDB = {
  async getAll() {
    const data = await q('condiciones.getAll', supabase.from('condicion_insegura').select('*'))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('condiciones.create',
      supabase.from('condicion_insegura').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('condiciones.update', supabase.from('condicion_insegura').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('condiciones.remove', supabase.from('condicion_insegura').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXÁMENES MÉDICOS
// ─────────────────────────────────────────────────────────────────────────────

export const examenMedicoDB = {
  async getAll() {
    const data = await q('examen.getAll', supabase.from('examen_medico').select('*'))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('examen.create',
      supabase.from('examen_medico').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('examen.update', supabase.from('examen_medico').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('examen.remove', supabase.from('examen_medico').delete().eq('id', id))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE ALERTAS
// ─────────────────────────────────────────────────────────────────────────────

export const configuracionAlertaDB = {
  async getAll() {
    const data = await q('configAlerta.getAll', supabase.from('configuracion_alerta').select('*'))
    return manyFromDB(data)
  },
  async upsert(tipo, data) {
    const { error } = await supabase.from('configuracion_alerta')
      .upsert({ tipo, ...toDB(data) }, { onConflict: 'tipo' })
    if (error) err('configAlerta.upsert', error)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  HALLAZGOS AT/IT
// ─────────────────────────────────────────────────────────────────────────────

export const hallazgoDB = {
  async getAll() {
    const data = await q('hallazgo.getAll', supabase.from('hallazgo').select('*'))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('hallazgo.create',
      supabase.from('hallazgo').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('hallazgo.update', supabase.from('hallazgo').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('hallazgo.remove', supabase.from('hallazgo').delete().eq('id', id))
  },
  async bulkCreate(items) {
    const data = await q('hallazgo.bulkCreate',
      supabase.from('hallazgo').insert(items.map(toDB)).select('id'))
    return data?.map(r => r.id)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  INDICADORES
// ─────────────────────────────────────────────────────────────────────────────

export const indicadorDB = {
  async getAll() {
    const data = await q('indicador.getAll', supabase.from('indicador').select('*'))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('indicador.create',
      supabase.from('indicador').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('indicador.update', supabase.from('indicador').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('indicador.remove', supabase.from('indicador').delete().eq('id', id))
  },
}

export const datoIndicadorDB = {
  async getByIndicadorAño(indicadorId, año) {
    const data = await q('dato.getByIndicadorAño',
      supabase.from('dato_indicador').select('*').eq('indicador_id', indicadorId).eq('año', año))
    return manyFromDB(data)
  },
  async upsert(indicadorId, mes, año, data) {
    const { error } = await supabase.from('dato_indicador')
      .upsert({ indicador_id: indicadorId, mes, año, ...toDB(data) }, { onConflict: 'indicador_id,mes,año' })
    if (error) err('dato.upsert', error)
  },
  async removeByIndicador(indicadorId) {
    await q('dato.removeByIndicador',
      supabase.from('dato_indicador').delete().eq('indicador_id', indicadorId))
  },
}

export const planAccionIndicadorDB = {
  async getByIndicador(indicadorId) {
    const data = await q('planInd.getByIndicador',
      supabase.from('plan_accion_indicador').select('*').eq('indicador_id', indicadorId))
    return manyFromDB(data)
  },
  async create(data) {
    const row = await one('planInd.create',
      supabase.from('plan_accion_indicador').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('planInd.update', supabase.from('plan_accion_indicador').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('planInd.remove', supabase.from('plan_accion_indicador').delete().eq('id', id))
  },
  async removeByIndicador(indicadorId) {
    await q('planInd.removeByIndicador',
      supabase.from('plan_accion_indicador').delete().eq('indicador_id', indicadorId))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EVALUACIÓN SG-SST
// ─────────────────────────────────────────────────────────────────────────────

export const evaluacionSGSSTDB = {
  async getAll() {
    const data = await q('evalSGSST.getAll', supabase.from('evaluacion_sgsst').select('*'))
    return manyFromDB(data)
  },
  async getByEmpresaAño(empresaId, año) {
    const data = await one('evalSGSST.getByEmpresaAño',
      supabase.from('evaluacion_sgsst').select('*').eq('empresa_id', empresaId).eq('año', año).single())
    return fromDB(data)
  },
  async create(data) {
    const row = await one('evalSGSST.create',
      supabase.from('evaluacion_sgsst').insert(toDB(data)).select('id').single())
    return row?.id
  },
  async update(id, data) {
    await q('evalSGSST.update', supabase.from('evaluacion_sgsst').update(toDB(data)).eq('id', id))
  },
  async remove(id) {
    await q('evalSGSST.remove', supabase.from('evaluacion_sgsst').delete().eq('id', id))
  },
}

export const itemEvaluacionDB = {
  async getByEvaluacion(evaluacionId) {
    const data = await q('itemEval.getByEvaluacion',
      supabase.from('item_evaluacion').select('*').eq('evaluacion_id', evaluacionId))
    return manyFromDB(data)
  },
  async upsert(evaluacionId, codigo, data) {
    const { error } = await supabase.from('item_evaluacion')
      .upsert({ evaluacion_id: evaluacionId, codigo, ...toDB(data) }, { onConflict: 'evaluacion_id,codigo' })
    if (error) err('itemEval.upsert', error)
  },
  async removeByEvaluacion(evaluacionId) {
    await q('itemEval.removeByEvaluacion',
      supabase.from('item_evaluacion').delete().eq('evaluacion_id', evaluacionId))
  },
}

// Alias de compatibilidad — algunos archivos importan db directamente
export { supabase as db }
