import { examenMedicoDB, configuracionAlertaDB, alertaDB, trabajadorDB } from '@/db'
import { NIVEL_ALERTA } from '@/constants'

const TIPO_EXAMEN_VENCER  = 'EXAMEN_PROXIMO_A_VENCER'
const TIPO_EXAMEN_VENCIDO = 'EXAMEN_VENCIDO'

/**
 * Escanea la tabla examenMedico y genera alertas en alertaDB para
 * exámenes vencidos o próximos a vencer según la configuración por tipo.
 * @returns {Promise<number>} cantidad de alertas nuevas generadas
 */
export async function generarAlertasExamenes() {
  let nuevas = 0

  const [examenes, configs, trabajadores] = await Promise.all([
    examenMedicoDB.getAll(),
    configuracionAlertaDB.getAll(),
    trabajadorDB.getAll(),
  ])

  const configMap = Object.fromEntries((configs || []).map(c => [c.tipo, c]))
  const trabajadorMap = Object.fromEntries((trabajadores || []).map(t => [t.id, t]))

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  for (const ex of (examenes || [])) {
    if (!ex.fechaVencimiento) continue

    const venc = new Date(ex.fechaVencimiento + 'T00:00:00')
    const cfg  = configMap[ex.tipo]

    // Solo generar si la configuración está activa (o si no hay config, usar default 30 días)
    const activa = cfg ? (cfg.activa !== false) : true
    if (!activa) continue

    const dias  = Math.round((venc - hoy) / 86400000)
    const diasAnticipacion = cfg?.diasAnticipacion ?? 30
    const observacion      = cfg?.observacion || ''

    const t = trabajadorMap[ex.trabajadorId]
    const nombre = t ? `${t.nombres} ${t.apellidos}` : `Trabajador #${ex.trabajadorId}`
    const tipoLabel = { INGRESO: 'ingreso', PERIODICO: 'periódico', RETIRO: 'retiro', RESTRICCION: 'restricción médica' }[ex.tipo] || ex.tipo

    if (dias < 0) {
      // Vencido
      const yaExiste = await alertaDB.existeAlertaActiva(TIPO_EXAMEN_VENCIDO, ex.id)
      if (!yaExiste) {
        const msg = `Examen de ${tipoLabel} vencido: ${nombre}. Venció el ${ex.fechaVencimiento} (hace ${Math.abs(dias)} día(s)).`
          + (observacion ? ` ${observacion}` : '')
        await alertaDB.create({
          tipo:        TIPO_EXAMEN_VENCIDO,
          nivel:       NIVEL_ALERTA.CRITICO,
          trabajadorId: ex.trabajadorId || null,
          referenciaId: ex.id,
          mensaje:      msg,
        })
        nuevas++
      }
    } else if (dias <= diasAnticipacion) {
      // Próximo a vencer
      const yaExiste = await alertaDB.existeAlertaActiva(TIPO_EXAMEN_VENCER, ex.id)
      if (!yaExiste) {
        const msg = `Examen de ${tipoLabel} próximo a vencer: ${nombre}. Vence el ${ex.fechaVencimiento} (en ${dias} día(s)).`
          + (observacion ? ` ${observacion}` : '')
        await alertaDB.create({
          tipo:        TIPO_EXAMEN_VENCER,
          nivel:       NIVEL_ALERTA.WARNING,
          trabajadorId: ex.trabajadorId || null,
          referenciaId: ex.id,
          mensaje:      msg,
        })
        nuevas++
      }
    }
  }

  return nuevas
}
