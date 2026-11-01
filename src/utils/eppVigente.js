/**
 * El EPP que hoy cuenta para un trabajador es el de su última entrega FIRMADA:
 * las entregas anuladas o pendientes no cuentan, y un EPP que ya se reemplazó
 * con una entrega nueva no debe salir como vencido.
 */

/** Map `trabajadorId-eppId` → detalle vigente (el de fecha de vencimiento más lejana) */
export function mapaDetallesVigentes(entregas, detalles) {
  const entregaMap = Object.fromEntries(
    (entregas || []).filter(e => e.estado === 'FIRMADA').map(e => [e.id, e])
  )
  const vigentes = new Map()
  for (const d of (detalles || [])) {
    const entrega = entregaMap[d.entregaId]
    if (!entrega) continue
    const key  = `${entrega.trabajadorId}-${d.eppId}`
    const prev = vigentes.get(key)
    if (!prev || (d.fechaVencimiento || '') > (prev.detalle.fechaVencimiento || '')
        || ((d.fechaVencimiento || '') === (prev.detalle.fechaVencimiento || '') && d.id > prev.detalle.id)) {
      vigentes.set(key, { detalle: d, entrega })
    }
  }
  return vigentes
}

/**
 * Lista de { detalle, entrega } vigentes de trabajadores ACTIVOS.
 * @param {Array} trabajadores si se pasa, descarta a los inactivos
 */
export function detallesVigentes(entregas, detalles, trabajadores) {
  const activos = trabajadores
    ? new Set(trabajadores.filter(t => t.estado === 'ACTIVO').map(t => t.id))
    : null
  return [...mapaDetallesVigentes(entregas, detalles).values()]
    .filter(({ entrega }) => !activos || activos.has(entrega.trabajadorId))
}
