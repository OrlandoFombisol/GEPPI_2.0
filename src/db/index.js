import db from './schema'
import { TIPO_MOVIMIENTO, ESTADO_ENTREGA, ESTADO_STOCK } from '@/constants'

// ─────────────────────────────────────────────────────────────────────────────
//  UTILIDAD INTERNA
// ─────────────────────────────────────────────────────────────────────────────

function nowISO() {
  return new Date().toISOString()
}

function err(contexto, error) {
  console.error(`[GEPPI DB] ${contexto}:`, error)
  throw new Error(`${contexto}: ${error.message || error}`)
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMPRESA
// ─────────────────────────────────────────────────────────────────────────────

export const empresaDB = {
  async getAll() {
    try { return await db.empresa.toArray() }
    catch (e) { err('empresa.getAll', e) }
  },

  async getById(id) {
    try { return await db.empresa.get(id) }
    catch (e) { err('empresa.getById', e) }
  },

  async create(data) {
    try {
      const id = await db.empresa.add({ ...data, fechaCreacion: nowISO() })
      return id
    } catch (e) { err('empresa.create', e) }
  },

  async update(id, data) {
    try { await db.empresa.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('empresa.update', e) }
  },

  async remove(id) {
    try { await db.empresa.delete(id) }
    catch (e) { err('empresa.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  SEDE
// ─────────────────────────────────────────────────────────────────────────────

export const sedeDB = {
  async getAll() {
    try { return await db.sede.toArray() }
    catch (e) { err('sede.getAll', e) }
  },

  async getById(id) {
    try { return await db.sede.get(id) }
    catch (e) { err('sede.getById', e) }
  },

  async getPorEmpresa(empresaId) {
    try { return await db.sede.where('empresaId').equals(empresaId).toArray() }
    catch (e) { err('sede.getPorEmpresa', e) }
  },

  async create(data) {
    try { return await db.sede.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('sede.create', e) }
  },

  async update(id, data) {
    try { await db.sede.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('sede.update', e) }
  },

  async remove(id) {
    try { await db.sede.delete(id) }
    catch (e) { err('sede.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARGO
// ─────────────────────────────────────────────────────────────────────────────

export const cargoDB = {
  async getAll() {
    try { return await db.cargo.orderBy('nombre').toArray() }
    catch (e) { err('cargo.getAll', e) }
  },

  async getById(id) {
    try { return await db.cargo.get(id) }
    catch (e) { err('cargo.getById', e) }
  },

  async getActivos() {
    try { return await db.cargo.where('estado').equals('ACTIVO').sortBy('nombre') }
    catch (e) { err('cargo.getActivos', e) }
  },

  async create(data) {
    try { return await db.cargo.add({ ...data, estado: 'ACTIVO', fechaCreacion: nowISO() }) }
    catch (e) { err('cargo.create', e) }
  },

  async update(id, data) {
    try { await db.cargo.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('cargo.update', e) }
  },

  async remove(id) {
    try { await db.cargo.delete(id) }
    catch (e) { err('cargo.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EPP
// ─────────────────────────────────────────────────────────────────────────────

export const eppDB = {
  async getAll() {
    try { return await db.epp.orderBy('item').toArray() }
    catch (e) { err('epp.getAll', e) }
  },

  async getById(id) {
    try { return await db.epp.get(id) }
    catch (e) { err('epp.getById', e) }
  },

  async getActivos() {
    try { return await db.epp.where('estado').equals('ACTIVO').sortBy('item') }
    catch (e) { err('epp.getActivos', e) }
  },

  async create(data) {
    try {
      return await db.epp.add({
        ...data,
        estado:         'ACTIVO',
        version:        data.version || 1,
        fechaCreacion:  nowISO(),
      })
    } catch (e) { err('epp.create', e) }
  },

  async update(id, data) {
    try { await db.epp.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('epp.update', e) }
  },

  async remove(id) {
    try { await db.epp.delete(id) }
    catch (e) { err('epp.remove', e) }
  },

  async bulkCreate(epps) {
    try { return await db.epp.bulkAdd(epps, { allKeys: true }) }
    catch (e) { err('epp.bulkCreate', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ASIGNACIÓN CARGO-EPP (Matriz por Cargos)
// ─────────────────────────────────────────────────────────────────────────────

export const asignacionDB = {
  async getAll() {
    try { return await db.asignacionCargoEpp.toArray() }
    catch (e) { err('asignacion.getAll', e) }
  },

  /** Devuelve los EPP asignados a un cargo específico */
  async getEppPorCargo(cargoId) {
    try {
      return await db.asignacionCargoEpp
        .where('cargoId').equals(cargoId)
        .filter(a => a.vigente !== false)
        .toArray()
    } catch (e) { err('asignacion.getEppPorCargo', e) }
  },

  /** Devuelve los cargos que tienen asignado un EPP específico */
  async getCargosPorEpp(eppId) {
    try {
      return await db.asignacionCargoEpp
        .where('eppId').equals(eppId)
        .filter(a => a.vigente !== false)
        .toArray()
    } catch (e) { err('asignacion.getCargosPorEpp', e) }
  },

  async getByCargoYEpp(cargoId, eppId) {
    try {
      return await db.asignacionCargoEpp
        .where('[cargoId+eppId]').equals([cargoId, eppId])
        .first()
    } catch (e) { err('asignacion.getByCargoYEpp', e) }
  },

  async toggle(cargoId, eppId) {
    try {
      const existente = await db.asignacionCargoEpp
        .where('[cargoId+eppId]').equals([cargoId, eppId]).first()

      if (existente) {
        await db.asignacionCargoEpp.update(existente.id, {
          vigente: !existente.vigente,
          fechaActualizacion: nowISO(),
        })
        return !existente.vigente
      } else {
        await db.asignacionCargoEpp.add({
          cargoId, eppId,
          vigente:          true,
          obligatorio:      true,
          cantidadEntrega:  1,
          fechaCreacion:    nowISO(),
        })
        return true
      }
    } catch (e) { err('asignacion.toggle', e) }
  },

  async bulkCreate(asignaciones) {
    try { return await db.asignacionCargoEpp.bulkAdd(asignaciones, { allKeys: true }) }
    catch (e) { err('asignacion.bulkCreate', e) }
  },

  async limpiarPorCargo(cargoId) {
    try { await db.asignacionCargoEpp.where('cargoId').equals(cargoId).delete() }
    catch (e) { err('asignacion.limpiarPorCargo', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRABAJADOR
// ─────────────────────────────────────────────────────────────────────────────

export const trabajadorDB = {
  async getAll() {
    try { return await db.trabajador.toArray() }
    catch (e) { err('trabajador.getAll', e) }
  },

  async getById(id) {
    try { return await db.trabajador.get(id) }
    catch (e) { err('trabajador.getById', e) }
  },

  async getByCedula(cedula) {
    try { return await db.trabajador.where('cedula').equals(String(cedula)).first() }
    catch (e) { err('trabajador.getByCedula', e) }
  },

  async getTrabajadoresPorSede(sedeId) {
    try {
      return await db.trabajador
        .where('sedeId').equals(sedeId)
        .filter(t => t.estado === 'ACTIVO')
        .toArray()
    } catch (e) { err('trabajador.getTrabajadoresPorSede', e) }
  },

  async getTrabajadoresPorEmpresa(empresaId) {
    try {
      return await db.trabajador
        .where('empresaId').equals(empresaId)
        .filter(t => t.estado === 'ACTIVO')
        .toArray()
    } catch (e) { err('trabajador.getTrabajadoresPorEmpresa', e) }
  },

  async buscar(texto) {
    try {
      const q = texto.toLowerCase()
      return await db.trabajador
        .filter(t =>
          t.nombres?.toLowerCase().includes(q) ||
          t.apellidos?.toLowerCase().includes(q) ||
          t.cedula?.includes(q)
        )
        .toArray()
    } catch (e) { err('trabajador.buscar', e) }
  },

  async create(data) {
    try {
      return await db.trabajador.add({
        ...data,
        cedula:        String(data.cedula),
        estado:        'ACTIVO',
        fechaCreacion: nowISO(),
      })
    } catch (e) { err('trabajador.create', e) }
  },

  async update(id, data) {
    try { await db.trabajador.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('trabajador.update', e) }
  },

  async remove(id) {
    try { await db.trabajador.update(id, { estado: 'INACTIVO', fechaActualizacion: nowISO() }) }
    catch (e) { err('trabajador.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  INVENTARIO
// ─────────────────────────────────────────────────────────────────────────────

export const inventarioDB = {
  async getAll() {
    try { return await db.inventario.toArray() }
    catch (e) { err('inventario.getAll', e) }
  },

  async getById(id) {
    try { return await db.inventario.get(id) }
    catch (e) { err('inventario.getById', e) }
  },

  /** Retorna el registro de stock para un EPP en una sede específica */
  async getStockActual(eppId, sedeId) {
    try {
      return await db.inventario
        .where('[eppId+sedeId]').equals([eppId, sedeId])
        .first()
    } catch (e) { err('inventario.getStockActual', e) }
  },

  async getPorSede(sedeId) {
    try { return await db.inventario.where('sedeId').equals(sedeId).toArray() }
    catch (e) { err('inventario.getPorSede', e) }
  },

  /** Devuelve todos los EPP agotados (stock = 0) */
  async getAgotados() {
    try { return await db.inventario.filter(i => i.stockActual === 0).toArray() }
    catch (e) { err('inventario.getAgotados', e) }
  },

  /** Devuelve los EPP con stock ≤ stock mínimo */
  async getBajoStock() {
    try {
      return await db.inventario
        .filter(i => i.stockActual > 0 && i.stockActual <= (i.stockMinimo || 5))
        .toArray()
    } catch (e) { err('inventario.getBajoStock', e) }
  },

  async create(data) {
    try {
      return await db.inventario.add({
        stockMinimo:           5,
        unidadMedida:          'Unidad',
        ...data,
        fechaUltimaActualizacion: nowISO(),
      })
    } catch (e) { err('inventario.create', e) }
  },

  async update(id, data) {
    try {
      await db.inventario.update(id, {
        ...data,
        fechaUltimaActualizacion: nowISO(),
      })
    } catch (e) { err('inventario.update', e) }
  },

  /** Ajuste de stock: suma o resta delta, crea movimiento */
  async ajustarStock(eppId, sedeId, delta, tipo, meta = {}) {
    try {
      return await db.transaction('rw', db.inventario, db.movimientoInventario, async () => {
        let registro = await db.inventario
          .where('[eppId+sedeId]').equals([eppId, sedeId]).first()

        if (!registro) {
          const id = await db.inventario.add({
            eppId, sedeId,
            stockActual:              Math.max(0, delta),
            stockMinimo:              5,
            unidadMedida:             'Unidad',
            fechaUltimaActualizacion: nowISO(),
          })
          registro = await db.inventario.get(id)
        }

        const saldoAnterior  = registro.stockActual
        const saldoPosterior = Math.max(0, saldoAnterior + delta)

        await db.inventario.update(registro.id, {
          stockActual:              saldoPosterior,
          fechaUltimaActualizacion: nowISO(),
        })

        const movId = await db.movimientoInventario.add({
          inventarioId:        registro.id,
          eppId,
          sedeId,
          tipo,
          cantidad:            Math.abs(delta),
          saldoAnterior,
          saldoPosterior,
          fecha:               nowISO(),
          proveedor:           meta.proveedor     || null,
          costoUnitario:       meta.costoUnitario || null,
          motivoAjuste:        meta.motivo        || null,
          referenciaEntregaId: meta.entregaId     || null,
          usuarioId:           meta.usuarioId     || null,
        })

        return { saldoPosterior, movimientoId: movId }
      })
    } catch (e) { err('inventario.ajustarStock', e) }
  },

  /** Estado semáforo del stock */
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
    try {
      let query = db.movimientoInventario
        .where('[eppId+sedeId]').equals([eppId, sedeId])
      const resultado = await query.toArray()
      if (desde || hasta) {
        return resultado.filter(m => {
          const f = new Date(m.fecha)
          if (desde && f < new Date(desde)) return false
          if (hasta && f > new Date(hasta)) return false
          return true
        })
      }
      return resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    } catch (e) { err('movimiento.getPorEppYSede', e) }
  },

  async getPorEntrega(entregaId) {
    try {
      return await db.movimientoInventario
        .where('referenciaEntregaId').equals(entregaId).toArray()
    } catch (e) { err('movimiento.getPorEntrega', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

export const entregaDB = {
  async getAll() {
    try { return await db.entrega.reverse().toArray() }
    catch (e) { err('entrega.getAll', e) }
  },

  async getById(id) {
    try { return await db.entrega.get(id) }
    catch (e) { err('entrega.getById', e) }
  },

  async getEntregasPorTrabajador(trabajadorId) {
    try {
      return await db.entrega
        .where('trabajadorId').equals(trabajadorId)
        .reverse()
        .sortBy('fechaEntrega')
    } catch (e) { err('entrega.getEntregasPorTrabajador', e) }
  },

  async getUltimaEntregaEppTrabajador(trabajadorId, eppId) {
    try {
      const detalles = await db.detalleEntrega
        .where('eppId').equals(eppId).toArray()

      const entregas = await db.entrega
        .where('trabajadorId').equals(trabajadorId)
        .filter(e => e.estado === ESTADO_ENTREGA.FIRMADA)
        .toArray()

      const idsEntregas = new Set(entregas.map(e => e.id))

      const detalle = detalles
        .filter(d => idsEntregas.has(d.entregaId))
        .sort((a, b) => new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento))[0]

      return detalle || null
    } catch (e) { err('entrega.getUltimaEntregaEppTrabajador', e) }
  },

  /** Crea la entrega, descuenta inventario y guarda firma en una transacción atómica */
  async confirmar({ trabajador, cargo, epps, observaciones, responsable, firmaBase64, usuarioId }) {
    try {
      return await db.transaction(
        'rw',
        db.entrega,
        db.detalleEntrega,
        db.firma,
        db.inventario,
        db.movimientoInventario,
        async () => {
          // 1. Crear cabecera de entrega
          const entregaId = await db.entrega.add({
            trabajadorId:     trabajador.id,
            cargoId:          cargo.id,
            sedeId:           trabajador.sedeId,
            empresaId:        trabajador.empresaId,
            fechaEntrega:     nowISO(),
            estado:           ESTADO_ENTREGA.FIRMADA,
            observaciones:    observaciones || null,
            responsableNombre: responsable,
            usuarioEntregaId: usuarioId || null,
            pdfGenerado:      false,
          })

          // 2. Crear detalle por cada EPP
          for (const item of epps) {
            await db.detalleEntrega.add({
              entregaId,
              eppId:            item.eppId,
              cantidad:         item.cantidad,
              vidaUtilDias:     item.vidaUtilDias || 0,
              fechaVencimiento: item.fechaVencimiento || null,
              disposicionFinal: item.disposicionFinal || null,
              observaciones:    item.observaciones || null,
            })

            // 3. Descontar inventario
            const registro = await db.inventario
              .where('[eppId+sedeId]').equals([item.eppId, trabajador.sedeId]).first()

            if (registro) {
              const saldoAnterior  = registro.stockActual
              const saldoPosterior = Math.max(0, saldoAnterior - item.cantidad)

              await db.inventario.update(registro.id, {
                stockActual:              saldoPosterior,
                fechaUltimaActualizacion: nowISO(),
              })

              await db.movimientoInventario.add({
                inventarioId:        registro.id,
                eppId:               item.eppId,
                sedeId:              trabajador.sedeId,
                tipo:                TIPO_MOVIMIENTO.SALIDA,
                cantidad:            item.cantidad,
                saldoAnterior,
                saldoPosterior,
                referenciaEntregaId: entregaId,
                fecha:               nowISO(),
                usuarioId:           usuarioId || null,
              })
            }
          }

          // 4. Guardar firma digital
          await db.firma.add({
            entregaId,
            firmaBase64,
            fechaCaptura: nowISO(),
            dispositivo:  navigator.userAgent || 'Desconocido',
          })

          return entregaId
        }
      )
    } catch (e) { err('entrega.confirmar', e) }
  },

  async anular(id, motivo, usuarioId) {
    try {
      await db.entrega.update(id, {
        estado:            ESTADO_ENTREGA.ANULADA,
        motivoAnulacion:   motivo,
        fechaAnulacion:    nowISO(),
        usuarioAnulacionId: usuarioId || null,
      })
    } catch (e) { err('entrega.anular', e) }
  },

  async marcarPdfGenerado(id) {
    try { await db.entrega.update(id, { pdfGenerado: true }) }
    catch (e) { err('entrega.marcarPdfGenerado', e) }
  },

  async getByToken(token) {
    try { return await db.entrega.where('tokenAceptacion').equals(token).first() }
    catch (e) { err('entrega.getByToken', e) }
  },

  async aceptarConToken(token, firmaBase64) {
    try {
      return await db.transaction('rw', db.entrega, db.firma, async () => {
        const entrega = await db.entrega.where('tokenAceptacion').equals(token).first()
        if (!entrega) throw new Error('Token inválido o ya expirado.')
        if (entrega.estado === 'FIRMADA') throw new Error('Esta entrega ya fue aceptada.')
        await db.entrega.update(entrega.id, {
          estado:          'FIRMADA',
          fechaAceptacion: nowISO(),
        })
        await db.firma.add({
          entregaId:    entrega.id,
          firmaBase64,
          fechaCaptura: nowISO(),
          dispositivo:  navigator.userAgent || 'Desconocido',
          origenQR:     true,
        })
        return entrega.id
      })
    } catch (e) { err('entrega.aceptarConToken', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  DETALLE ENTREGA
// ─────────────────────────────────────────────────────────────────────────────

export const detalleEntregaDB = {
  async getPorEntrega(entregaId) {
    try { return await db.detalleEntrega.where('entregaId').equals(entregaId).toArray() }
    catch (e) { err('detalleEntrega.getPorEntrega', e) }
  },

  /** Todos los detalles activos con fecha de vencimiento próxima */
  async getProximosAVencer(diasMax) {
    try {
      const limite = new Date()
      limite.setDate(limite.getDate() + diasMax)

      return await db.detalleEntrega
        .filter(d => {
          if (!d.fechaVencimiento) return false
          const fv = new Date(d.fechaVencimiento)
          return fv <= limite
        })
        .toArray()
    } catch (e) { err('detalleEntrega.getProximosAVencer', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  FIRMA
// ─────────────────────────────────────────────────────────────────────────────

export const firmaDB = {
  async getPorEntrega(entregaId) {
    try { return await db.firma.where('entregaId').equals(entregaId).first() }
    catch (e) { err('firma.getPorEntrega', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  ALERTA
// ─────────────────────────────────────────────────────────────────────────────

export const alertaDB = {
  async getAll() {
    try { return await db.alerta.reverse().toArray() }
    catch (e) { err('alerta.getAll', e) }
  },

  async getNoLeidas() {
    try { return await db.alerta.where('leida').equals(0).reverse().toArray() }
    catch (e) { err('alerta.getNoLeidas', e) }
  },

  async contarNoLeidas() {
    try { return await db.alerta.where('leida').equals(0).count() }
    catch (e) { err('alerta.contarNoLeidas', e) }
  },

  async existeAlertaActiva(tipo, referenciaId) {
    try {
      return await db.alerta
        .where('[tipo+referenciaId]').equals([tipo, String(referenciaId)])
        .filter(a => !a.leida)
        .count() > 0
    } catch (e) { err('alerta.existeAlertaActiva', e) }
  },

  async create(data) {
    try {
      return await db.alerta.add({
        ...data,
        leida:            0,
        fechaGeneracion:  nowISO(),
        referenciaId:     String(data.referenciaId || ''),
      })
    } catch (e) { err('alerta.create', e) }
  },

  async marcarLeida(id) {
    try { await db.alerta.update(id, { leida: 1, fechaLectura: nowISO() }) }
    catch (e) { err('alerta.marcarLeida', e) }
  },

  async marcarTodasLeidas() {
    try {
      await db.alerta.where('leida').equals(0).modify({ leida: 1, fechaLectura: nowISO() })
    } catch (e) { err('alerta.marcarTodasLeidas', e) }
  },

  async remove(id) {
    try { await db.alerta.delete(id) }
    catch (e) { err('alerta.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  GESTIÓN DEL CAMBIO
// ─────────────────────────────────────────────────────────────────────────────

export const gestionCambioDB = {
  async getAll() {
    try { return await db.gestionCambio.orderBy('fecha').reverse().toArray() }
    catch (e) { err('gestionCambio.getAll', e) }
  },

  async create(data) {
    try { return await db.gestionCambio.add({ ...data, fecha: data.fecha || nowISO() }) }
    catch (e) { err('gestionCambio.create', e) }
  },

  async bulkCreate(registros) {
    try { return await db.gestionCambio.bulkAdd(registros, { allKeys: true }) }
    catch (e) { err('gestionCambio.bulkCreate', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUDITORÍA
// ─────────────────────────────────────────────────────────────────────────────

export const auditoriaDB = {
  async getAll(filtros = {}) {
    try {
      let query = db.auditoria.reverse()
      const todos = await query.toArray()
      return todos.filter(a => {
        if (filtros.modulo && a.modulo !== filtros.modulo) return false
        if (filtros.accion && a.accion !== filtros.accion) return false
        if (filtros.desde && new Date(a.fecha) < new Date(filtros.desde)) return false
        if (filtros.hasta && new Date(a.fecha) > new Date(filtros.hasta)) return false
        return true
      })
    } catch (e) { err('auditoria.getAll', e) }
  },

  async registrar(modulo, accion, detalle, referenciaId = null, usuarioId = null) {
    try {
      await db.auditoria.add({
        modulo, accion, detalle,
        referenciaId: referenciaId ? String(referenciaId) : null,
        usuarioId,
        fecha: nowISO(),
      })
      // Mantener solo los últimos 1000 registros
      const total = await db.auditoria.count()
      if (total > 1000) {
        const sobra = total - 1000
        const ids = await db.auditoria.orderBy('id').limit(sobra).primaryKeys()
        await db.auditoria.bulkDelete(ids)
      }
    } catch (e) {
      // La auditoría nunca debe bloquear el flujo principal
      console.warn('[GEPPI] No se pudo registrar auditoría:', e)
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  USUARIO
// ─────────────────────────────────────────────────────────────────────────────

export const usuarioDB = {
  async getAll() {
    try { return await db.usuario.toArray() }
    catch (e) { err('usuario.getAll', e) }
  },

  async getById(id) {
    try { return await db.usuario.get(id) }
    catch (e) { err('usuario.getById', e) }
  },

  async getByCorreo(correo) {
    try { return await db.usuario.where('correo').equals(correo.toLowerCase()).first() }
    catch (e) { err('usuario.getByCorreo', e) }
  },

  async create(data) {
    try {
      return await db.usuario.add({
        ...data,
        correo:        data.correo.toLowerCase(),
        estado:        'ACTIVO',
        ultimoAcceso:  null,
        fechaCreacion: nowISO(),
      })
    } catch (e) { err('usuario.create', e) }
  },

  async update(id, data) {
    try { await db.usuario.update(id, data) }
    catch (e) { err('usuario.update', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  VEHÍCULO
// ─────────────────────────────────────────────────────────────────────────────

export const vehiculoDB = {
  async getAll() {
    try { return await db.vehiculo.toArray() }
    catch (e) { err('vehiculo.getAll', e) }
  },

  async getActivos() {
    try { return await db.vehiculo.where('estado').equals('ACTIVO').toArray() }
    catch (e) { err('vehiculo.getActivos', e) }
  },

  async getPorEmpresa(empresaId) {
    try {
      return await db.vehiculo
        .where('[empresaId+estado]').equals([empresaId, 'ACTIVO']).toArray()
    } catch (e) { err('vehiculo.getPorEmpresa', e) }
  },

  async getById(id) {
    try { return await db.vehiculo.get(id) }
    catch (e) { err('vehiculo.getById', e) }
  },

  async create(data) {
    try {
      return await db.vehiculo.add({
        ...data,
        placa:         String(data.placa).toUpperCase().trim(),
        estado:        'ACTIVO',
        fechaCreacion: nowISO(),
      })
    } catch (e) { err('vehiculo.create', e) }
  },

  async update(id, data) {
    try {
      await db.vehiculo.update(id, { ...data, fechaActualizacion: nowISO() })
    } catch (e) { err('vehiculo.update', e) }
  },

  async desactivar(id) {
    try { await db.vehiculo.update(id, { estado: 'INACTIVO', fechaActualizacion: nowISO() }) }
    catch (e) { err('vehiculo.desactivar', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHECKLIST PREOPERACIONAL
// ─────────────────────────────────────────────────────────────────────────────

export const checklistDB = {
  async getAll() {
    try { return await db.checklistPreoperacional.reverse().toArray() }
    catch (e) { err('checklist.getAll', e) }
  },

  async getById(id) {
    try { return await db.checklistPreoperacional.get(id) }
    catch (e) { err('checklist.getById', e) }
  },

  async getPorEmpresa(empresaId) {
    try {
      return await db.checklistPreoperacional
        .where('empresaId').equals(empresaId).reverse().toArray()
    } catch (e) { err('checklist.getPorEmpresa', e) }
  },

  async getPorVehiculo(vehiculoId) {
    try {
      return await db.checklistPreoperacional
        .where('vehiculoId').equals(vehiculoId).reverse().toArray()
    } catch (e) { err('checklist.getPorVehiculo', e) }
  },

  async getPorConductor(conductorCedula) {
    try {
      return await db.checklistPreoperacional
        .where('conductorCedula').equals(conductorCedula).reverse().toArray()
    } catch (e) { err('checklist.getPorConductor', e) }
  },

  async filtrar({ empresaId, vehiculoId, conductorCedula, desde, hasta } = {}) {
    try {
      let todos = await db.checklistPreoperacional.reverse().toArray()
      if (empresaId)      todos = todos.filter(c => c.empresaId === empresaId)
      if (vehiculoId)     todos = todos.filter(c => c.vehiculoId === vehiculoId)
      if (conductorCedula) todos = todos.filter(c => c.conductorCedula === conductorCedula)
      if (desde) todos = todos.filter(c => c.fecha >= desde)
      if (hasta) todos = todos.filter(c => c.fecha <= hasta)
      return todos
    } catch (e) { err('checklist.filtrar', e) }
  },

  async create(data) {
    try {
      return await db.checklistPreoperacional.add({
        ...data,
        fechaCreacion: nowISO(),
      })
    } catch (e) { err('checklist.create', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAN ANUAL DE TRABAJO SST
// ─────────────────────────────────────────────────────────────────────────────

export const planTrabajoDB = {
  async getAll() {
    try { return await db.planTrabajo.toArray() }
    catch (e) { err('planTrabajo.getAll', e) }
  },

  async getByAño(año) {
    try { return await db.planTrabajo.where('año').equals(año).toArray() }
    catch (e) { err('planTrabajo.getByAño', e) }
  },

  async create(data) {
    try {
      return await db.planTrabajo.add({
        ...data,
        estado: data.estado || 'PENDIENTE',
        año: data.año || new Date().getFullYear(),
        fechaCreacion: nowISO(),
      })
    } catch (e) { err('planTrabajo.create', e) }
  },

  async update(id, data) {
    try { await db.planTrabajo.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('planTrabajo.update', e) }
  },

  async remove(id) {
    try { await db.planTrabajo.delete(id) }
    catch (e) { err('planTrabajo.remove', e) }
  },

  async bulkCreate(actividades) {
    try { return await db.planTrabajo.bulkAdd(actividades, { allKeys: true }) }
    catch (e) { err('planTrabajo.bulkCreate', e) }
  },

  async count() {
    try { return await db.planTrabajo.count() }
    catch (e) { err('planTrabajo.count', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONDICIONES INSEGURAS
// ─────────────────────────────────────────────────────────────────────────────

export const condicionesDB = {
  async getAll() {
    try { return await db.condicionInsegura.toArray() }
    catch (e) { err('condiciones.getAll', e) }
  },
  async create(data) {
    try { return await db.condicionInsegura.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('condiciones.create', e) }
  },
  async update(id, data) {
    try { await db.condicionInsegura.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('condiciones.update', e) }
  },
  async remove(id) {
    try { await db.condicionInsegura.delete(id) }
    catch (e) { err('condiciones.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXÁMENES MÉDICOS OCUPACIONALES
// ─────────────────────────────────────────────────────────────────────────────

export const examenMedicoDB = {
  async getAll() {
    try { return await db.examenMedico.toArray() }
    catch (e) { err('examen.getAll', e) }
  },
  async create(data) {
    try { return await db.examenMedico.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('examen.create', e) }
  },
  async update(id, data) {
    try { await db.examenMedico.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('examen.update', e) }
  },
  async remove(id) {
    try { await db.examenMedico.delete(id) }
    catch (e) { err('examen.remove', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE ALERTAS DE EXÁMENES
// ─────────────────────────────────────────────────────────────────────────────

export const configuracionAlertaDB = {
  async getAll() {
    try { return await db.configuracionAlerta.toArray() }
    catch (e) { err('configAlerta.getAll', e) }
  },
  async upsert(tipo, data) {
    try {
      const existing = await db.configuracionAlerta.where('tipo').equals(tipo).first()
      if (existing) {
        await db.configuracionAlerta.update(existing.id, { ...data, fechaActualizacion: nowISO() })
        return existing.id
      }
      return await db.configuracionAlerta.add({ tipo, ...data, fechaCreacion: nowISO() })
    } catch (e) { err('configAlerta.upsert', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  HALLAZGOS AT/IT  (MT-SST-013 — Acciones Preventivas, Correctivas y Mejora)
// ─────────────────────────────────────────────────────────────────────────────

export const hallazgoDB = {
  async getAll() {
    try { return await db.hallazgo.toArray() }
    catch (e) { err('hallazgo.getAll', e) }
  },
  async create(data) {
    try { return await db.hallazgo.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('hallazgo.create', e) }
  },
  async update(id, data) {
    try { await db.hallazgo.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('hallazgo.update', e) }
  },
  async remove(id) {
    try { await db.hallazgo.delete(id) }
    catch (e) { err('hallazgo.remove', e) }
  },
  async bulkCreate(items) {
    try { return await db.hallazgo.bulkAdd(items, { allKeys: true }) }
    catch (e) { err('hallazgo.bulkCreate', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  INDICADORES DE CUMPLIMIENTO
// ─────────────────────────────────────────────────────────────────────────────

export const indicadorDB = {
  async getAll() {
    try { return await db.indicador.toArray() }
    catch (e) { err('indicador.getAll', e) }
  },
  async create(data) {
    try { return await db.indicador.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('indicador.create', e) }
  },
  async update(id, data) {
    try { await db.indicador.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('indicador.update', e) }
  },
  async remove(id) {
    try { await db.indicador.delete(id) }
    catch (e) { err('indicador.remove', e) }
  },
}

export const datoIndicadorDB = {
  async getByIndicadorAño(indicadorId, año) {
    try {
      return await db.datoIndicador
        .where('[indicadorId+año]').equals([indicadorId, año]).toArray()
    } catch (e) { err('dato.getByIndicadorAño', e) }
  },
  async upsert(indicadorId, mes, año, data) {
    try {
      const existing = await db.datoIndicador
        .where('[indicadorId+año]').equals([indicadorId, año])
        .filter(d => d.mes === mes)
        .first()
      if (existing) {
        await db.datoIndicador.update(existing.id, { ...data, fechaActualizacion: nowISO() })
        return existing.id
      }
      return await db.datoIndicador.add({ indicadorId, mes, año, ...data, fechaCreacion: nowISO() })
    } catch (e) { err('dato.upsert', e) }
  },
  async removeByIndicador(indicadorId) {
    try { await db.datoIndicador.where('indicadorId').equals(indicadorId).delete() }
    catch (e) { err('dato.removeByIndicador', e) }
  },
}

export const planAccionIndicadorDB = {
  async getByIndicador(indicadorId) {
    try { return await db.planAccionIndicador.where('indicadorId').equals(indicadorId).toArray() }
    catch (e) { err('planInd.getByIndicador', e) }
  },
  async create(data) {
    try { return await db.planAccionIndicador.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('planInd.create', e) }
  },
  async update(id, data) {
    try { await db.planAccionIndicador.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('planInd.update', e) }
  },
  async remove(id) {
    try { await db.planAccionIndicador.delete(id) }
    catch (e) { err('planInd.remove', e) }
  },
  async removeByIndicador(indicadorId) {
    try { await db.planAccionIndicador.where('indicadorId').equals(indicadorId).delete() }
    catch (e) { err('planInd.removeByIndicador', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EVALUACIÓN SG-SST  (Resolución 0312 / 2019)
// ─────────────────────────────────────────────────────────────────────────────

export const evaluacionSGSSTDB = {
  async getAll() {
    try { return await db.evaluacionSGSST.toArray() }
    catch (e) { err('evalSGSST.getAll', e) }
  },
  async getByEmpresaAño(empresaId, año) {
    try {
      return await db.evaluacionSGSST
        .where('[empresaId+año]').equals([empresaId, año]).first()
    } catch (e) { err('evalSGSST.getByEmpresaAño', e) }
  },
  async create(data) {
    try { return await db.evaluacionSGSST.add({ ...data, fechaCreacion: nowISO() }) }
    catch (e) { err('evalSGSST.create', e) }
  },
  async update(id, data) {
    try { await db.evaluacionSGSST.update(id, { ...data, fechaActualizacion: nowISO() }) }
    catch (e) { err('evalSGSST.update', e) }
  },
  async remove(id) {
    try { await db.evaluacionSGSST.delete(id) }
    catch (e) { err('evalSGSST.remove', e) }
  },
}

export const itemEvaluacionDB = {
  async getByEvaluacion(evaluacionId) {
    try { return await db.itemEvaluacion.where('evaluacionId').equals(evaluacionId).toArray() }
    catch (e) { err('itemEval.getByEvaluacion', e) }
  },
  async upsert(evaluacionId, codigo, data) {
    try {
      const existing = await db.itemEvaluacion
        .where('[evaluacionId+codigo]').equals([evaluacionId, codigo]).first()
      if (existing) {
        await db.itemEvaluacion.update(existing.id, { ...data, fechaActualizacion: nowISO() })
        return existing.id
      }
      return await db.itemEvaluacion.add({ evaluacionId, codigo, ...data, fechaCreacion: nowISO() })
    } catch (e) { err('itemEval.upsert', e) }
  },
  async removeByEvaluacion(evaluacionId) {
    try { await db.itemEvaluacion.where('evaluacionId').equals(evaluacionId).delete() }
    catch (e) { err('itemEval.removeByEvaluacion', e) }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPORTAR instancia db para uso directo cuando se necesite
// ─────────────────────────────────────────────────────────────────────────────
export { db }
