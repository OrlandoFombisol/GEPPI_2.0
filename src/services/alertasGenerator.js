import dbSchema             from '@/db/schema'
import { inventarioDB, eppDB, alertaDB } from '@/db'
import { TIPO_ALERTA, NIVEL_ALERTA }     from '@/constants'
import { calcularEstadoEPP, diasParaVencimiento } from '@/utils/dates'

/**
 * Escanea la base de datos y crea alertas para:
 *  - EPP vencidos o próximos a vencer por trabajador
 *  - Ítems de inventario agotados o bajo mínimo
 *
 * Utiliza `alertaDB.existeAlertaActiva` para no crear duplicados.
 * @returns {Promise<number>} cantidad de alertas nuevas generadas
 */
export async function generarAlertas() {
  let nuevas = 0

  // ── 1. EPP por vencimiento ────────────────────────────────────────────────
  const entregas = await dbSchema.entrega
    .filter(e => e.estado === 'FIRMADA').toArray()
  const entregaMap = Object.fromEntries(entregas.map(e => [e.id, e]))

  const detalles = await dbSchema.detalleEntrega.toArray()
  const todosEPP = await eppDB.getAll()
  const eppMap   = Object.fromEntries((todosEPP || []).map(e => [e.id, e]))

  for (const d of detalles) {
    const entrega = entregaMap[d.entregaId]
    if (!entrega || !d.fechaVencimiento) continue

    const estado = calcularEstadoEPP(d.fechaVencimiento)
    if (estado !== 'VENCIDO' && estado !== 'PROXIMO_VENCER') continue

    const epp  = eppMap[d.eppId] || {}
    const nivel = estado === 'VENCIDO' ? NIVEL_ALERTA.CRITICO : NIVEL_ALERTA.WARNING
    const tipo  = epp.esDotacion ? TIPO_ALERTA.VENCIMIENTO_DOTACION : TIPO_ALERTA.VENCIMIENTO_EPP

    const yaExiste = await alertaDB.existeAlertaActiva(tipo, d.id)
    if (yaExiste) continue

    const dias = diasParaVencimiento(d.fechaVencimiento)
    const prefijo = epp.esDotacion ? `[Dotación Art.230] ` : ''
    const msg  = dias !== null && dias < 0
      ? `${prefijo}EPP "${epp.nombre}" venció hace ${Math.abs(dias)} día(s).`
      : `${prefijo}EPP "${epp.nombre}" vence en ${dias} día(s).`

    await alertaDB.create({
      tipo,
      nivel,
      sedeId:      entrega.sedeId       || null,
      trabajadorId: entrega.trabajadorId || null,
      referenciaId: d.id,
      mensaje:      msg,
    })
    nuevas++
  }

  // ── 2. Inventario agotado / bajo stock ────────────────────────────────────
  const inventario = await inventarioDB.getAll()

  for (const inv of (inventario || [])) {
    const epp  = eppMap[inv.eppId]
    const nombre = epp?.nombre || `EPP #${inv.eppId}`

    if (inv.stockActual === 0) {
      const yaExiste = await alertaDB.existeAlertaActiva(TIPO_ALERTA.STOCK_AGOTADO, inv.id)
      if (!yaExiste) {
        await alertaDB.create({
          tipo:        TIPO_ALERTA.STOCK_AGOTADO,
          nivel:       NIVEL_ALERTA.CRITICO,
          sedeId:      inv.sedeId,
          referenciaId: inv.id,
          mensaje:     `Stock agotado: "${nombre}"`,
        })
        nuevas++
      }
    } else if (inv.stockActual <= (inv.stockMinimo ?? 5)) {
      const yaExiste = await alertaDB.existeAlertaActiva(TIPO_ALERTA.STOCK_BAJO, inv.id)
      if (!yaExiste) {
        await alertaDB.create({
          tipo:        TIPO_ALERTA.STOCK_BAJO,
          nivel:       NIVEL_ALERTA.WARNING,
          sedeId:      inv.sedeId,
          referenciaId: inv.id,
          mensaje:     `Stock bajo: "${nombre}" (${inv.stockActual} u. / mín ${inv.stockMinimo ?? 5})`,
        })
        nuevas++
      }
    }
  }

  return nuevas
}
