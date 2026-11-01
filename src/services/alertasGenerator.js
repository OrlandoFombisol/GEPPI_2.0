import { entregaDB, inventarioDB, eppDB, detalleEntregaDB, condicionesDB, trabajadorDB } from '@/db'
import { TIPO_ALERTA, NIVEL_ALERTA }     from '@/constants'
import { calcularEstadoEPP, diasParaVencimiento } from '@/utils/dates'
import { detallesVigentes }              from '@/utils/eppVigente'
import { crearRegistroAlertas }          from '@/services/registroAlertas'

/**
 * Escanea la base de datos y crea alertas para:
 *  - EPP vencidos o próximos a vencer: solo el EPP vigente de cada trabajador
 *    activo (el de su última acta firmada; los reemplazados no cuentan)
 *  - Ítems de inventario agotados o bajo mínimo
 *  - Actos/condiciones inseguras de prioridad alta sin intervenir, o con
 *    fecha de seguimiento vencida
 *
 * Una alerta leída no reaparece; si sube de nivel (por vencer → vencido) vuelve
 * a «no leída». Las de EPP y stock que ya no aplican se cierran solas.
 * @returns {Promise<number>} cantidad de alertas nuevas o que subieron de nivel
 */
export async function generarAlertas() {
  const [entregas, detalles, todosEPP, trabajadores, inventario, condiciones, registro] = await Promise.all([
    entregaDB.getAll(),
    detalleEntregaDB.getAll(),
    eppDB.getAll(),
    trabajadorDB.getAll(),
    inventarioDB.getAll(),
    condicionesDB.getAll(),
    crearRegistroAlertas(),
  ])
  const eppMap = Object.fromEntries((todosEPP || []).map(e => [e.id, e]))

  // ── 1. EPP por vencimiento ────────────────────────────────────────────────
  for (const { detalle: d, entrega } of detallesVigentes(entregas, detalles, trabajadores)) {
    if (!d.fechaVencimiento) continue

    const estado = calcularEstadoEPP(d.fechaVencimiento)
    if (estado !== 'VENCIDO' && estado !== 'PROXIMO_VENCER') continue

    const epp  = eppMap[d.eppId] || {}
    const dias = diasParaVencimiento(d.fechaVencimiento)
    const prefijo = epp.esDotacion ? `[Dotación Art.230] ` : ''
    const msg  = dias < 0
      ? `${prefijo}EPP "${epp.nombre}" venció hace ${Math.abs(dias)} día(s).`
      : dias === 0
        ? `${prefijo}EPP "${epp.nombre}" vence hoy.`
        : `${prefijo}EPP "${epp.nombre}" vence en ${dias} día(s).`

    await registro.registrar({
      tipo:         epp.esDotacion ? TIPO_ALERTA.VENCIMIENTO_DOTACION : TIPO_ALERTA.VENCIMIENTO_EPP,
      nivel:        estado === 'VENCIDO' ? NIVEL_ALERTA.CRITICO : NIVEL_ALERTA.WARNING,
      sedeId:       entrega.sedeId       || null,
      trabajadorId: entrega.trabajadorId || null,
      referenciaId: d.id,
      mensaje:      msg,
    })
  }

  // ── 2. Inventario agotado / bajo stock ────────────────────────────────────
  for (const inv of (inventario || [])) {
    const nombre = eppMap[inv.eppId]?.nombre || `EPP #${inv.eppId}`

    if (inv.stockActual === 0) {
      await registro.registrar({
        tipo:         TIPO_ALERTA.STOCK_AGOTADO,
        nivel:        NIVEL_ALERTA.CRITICO,
        sedeId:       inv.sedeId,
        referenciaId: inv.id,
        mensaje:      `Stock agotado: "${nombre}"`,
      })
    } else if (inv.stockActual <= (inv.stockMinimo ?? 5)) {
      await registro.registrar({
        tipo:         TIPO_ALERTA.STOCK_BAJO,
        nivel:        NIVEL_ALERTA.WARNING,
        sedeId:       inv.sedeId,
        referenciaId: inv.id,
        mensaje:      `Stock bajo: "${nombre}" (${inv.stockActual} u. / mín ${inv.stockMinimo ?? 5})`,
      })
    }
  }

  // ── 3. Actos / condiciones inseguras ──────────────────────────────────────
  for (const c of (condiciones || [])) {
    if (c.estado === 'INTERVENIDA') continue

    const diasSeguimiento = diasParaVencimiento(c.fechaSeguimiento)

    if (diasSeguimiento !== null && diasSeguimiento < 0) {
      await registro.registrar({
        tipo:         TIPO_ALERTA.ACTO_SEGUIMIENTO_VENCIDO,
        nivel:        c.prioridad === 'ALTA' ? NIVEL_ALERTA.CRITICO : NIVEL_ALERTA.WARNING,
        referenciaId: c.id,
        mensaje:      `Seguimiento vencido hace ${Math.abs(diasSeguimiento)} día(s): "${c.descripcion}"`,
      })
    } else if (c.prioridad === 'ALTA' && c.estado === 'IDENTIFICADA') {
      await registro.registrar({
        tipo:         TIPO_ALERTA.ACTO_PRIORIDAD_ALTA,
        nivel:        NIVEL_ALERTA.CRITICO,
        referenciaId: c.id,
        mensaje:      `Condición insegura de prioridad ALTA sin intervenir: "${c.descripcion}"`,
      })
    }
  }

  // Stock repuesto, EPP reemplazado o trabajador retirado → la alerta deja de aplicar
  await registro.cerrarLasQueNoAplican([
    TIPO_ALERTA.VENCIMIENTO_EPP, TIPO_ALERTA.VENCIMIENTO_DOTACION,
    TIPO_ALERTA.STOCK_AGOTADO, TIPO_ALERTA.STOCK_BAJO,
  ])

  return registro.nuevas
}
