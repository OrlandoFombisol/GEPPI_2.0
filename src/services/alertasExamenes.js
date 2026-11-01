import { examenMedicoDB, configuracionAlertaDB, trabajadorDB } from '@/db'
import { NIVEL_ALERTA } from '@/constants'
import { diasParaVencimiento } from '@/utils/dates'
import { crearRegistroAlertas } from '@/services/registroAlertas'

const TIPO_EXAMEN_VENCER  = 'EXAMEN_PROXIMO_A_VENCER'
const TIPO_EXAMEN_VENCIDO = 'EXAMEN_VENCIDO'

/**
 * Escanea la tabla examenMedico y genera alertas en alertaDB para
 * exámenes vencidos o próximos a vencer según la configuración por tipo.
 * Solo trabajadores activos; una alerta leída no reaparece.
 * @returns {Promise<number>} cantidad de alertas nuevas generadas
 */
export async function generarAlertasExamenes() {
  const [examenes, configs, trabajadores, registro] = await Promise.all([
    examenMedicoDB.getAll(),
    configuracionAlertaDB.getAll(),
    trabajadorDB.getAll(),
    crearRegistroAlertas(),
  ])

  const configMap = Object.fromEntries((configs || []).map(c => [c.tipo, c]))
  const trabajadorMap = Object.fromEntries((trabajadores || []).map(t => [t.id, t]))

  for (const ex of (examenes || [])) {
    if (!ex.fechaVencimiento) continue

    const t = trabajadorMap[ex.trabajadorId]
    if (t && t.estado !== 'ACTIVO') continue

    const cfg  = configMap[ex.tipo]

    // Solo generar si la configuración está activa (o si no hay config, usar default 30 días)
    const activa = cfg ? (cfg.activa !== false) : true
    if (!activa) continue

    const dias  = diasParaVencimiento(ex.fechaVencimiento)
    if (dias === null) continue
    const diasAnticipacion = cfg?.diasAnticipacion ?? 30
    const observacion      = cfg?.observacion || ''

    const nombre = t ? `${t.nombres} ${t.apellidos}` : `Trabajador #${ex.trabajadorId}`
    const tipoLabel = { INGRESO: 'ingreso', PERIODICO: 'periódico', RETIRO: 'retiro', RESTRICCION: 'restricción médica' }[ex.tipo] || ex.tipo

    if (dias < 0) {
      await registro.registrar({
        tipo:         TIPO_EXAMEN_VENCIDO,
        nivel:        NIVEL_ALERTA.CRITICO,
        trabajadorId: ex.trabajadorId || null,
        referenciaId: ex.id,
        mensaje:      `Examen de ${tipoLabel} vencido: ${nombre}. Venció el ${ex.fechaVencimiento} (hace ${Math.abs(dias)} día(s)).`
          + (observacion ? ` ${observacion}` : ''),
      })
    } else if (dias <= diasAnticipacion) {
      await registro.registrar({
        tipo:         TIPO_EXAMEN_VENCER,
        nivel:        NIVEL_ALERTA.WARNING,
        trabajadorId: ex.trabajadorId || null,
        referenciaId: ex.id,
        mensaje:      `Examen de ${tipoLabel} próximo a vencer: ${nombre}. Vence el ${ex.fechaVencimiento} (en ${dias} día(s)).`
          + (observacion ? ` ${observacion}` : ''),
      })
    }
  }

  // Examen renovado o trabajador retirado → la alerta deja de aplicar
  await registro.cerrarLasQueNoAplican([TIPO_EXAMEN_VENCER, TIPO_EXAMEN_VENCIDO])

  return registro.nuevas
}
