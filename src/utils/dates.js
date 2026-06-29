import {
  format,
  addDays,
  differenceInDays,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ESTADO_EPP, DIAS_ALERTA } from '@/constants'

// ─── FORMATEO ────────────────────────────────────────────────────────────────

/** "28/05/2026" */
export function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = toDate(fecha)
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy')
}

/** "28/05/2026 14:35" */
export function formatearFechaHora(fecha) {
  if (!fecha) return '—'
  const d = toDate(fecha)
  if (!d) return '—'
  return format(d, 'dd/MM/yyyy HH:mm')
}

/** "28 de mayo de 2026" — para PDFs y documentos formales */
export function formatearFechaLarga(fecha) {
  if (!fecha) return '—'
  const d = toDate(fecha)
  if (!d) return '—'
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es })
}

/** Retorna "YYYY-MM-DD" para guardar en IndexedDB (ISO sin hora) */
export function toISODate(fecha) {
  if (!fecha) return null
  const d = toDate(fecha)
  if (!d) return null
  return format(d, 'yyyy-MM-dd')
}

// ─── CÁLCULOS DE VENCIMIENTO ─────────────────────────────────────────────────

/**
 * Calcula la fecha de vencimiento de un EPP entregado.
 * @param {Date|string} fechaEntrega  - Fecha en que se entregó el EPP
 * @param {number}      vidaUtilDias  - Días de vida útil según ficha técnica
 * @returns {Date|null} Fecha de vencimiento, o null si vidaUtilDias es 0/nulo
 */
export function calcularFechaVencimiento(fechaEntrega, vidaUtilDias) {
  if (!fechaEntrega || !vidaUtilDias || vidaUtilDias <= 0) return null
  const d = toDate(fechaEntrega)
  if (!d) return null
  return addDays(startOfDay(d), vidaUtilDias)
}

/**
 * Retorna el estado semáforo de un EPP según su fecha de vencimiento.
 * @param {Date|string|null} fechaVencimiento
 * @returns {string} Constante ESTADO_EPP
 */
export function calcularEstadoEPP(fechaVencimiento) {
  if (!fechaVencimiento) return ESTADO_EPP.SIN_ENTREGA

  const hoy        = startOfDay(new Date())
  const vencimiento = startOfDay(toDate(fechaVencimiento))

  if (!vencimiento) return ESTADO_EPP.SIN_ENTREGA

  if (isBefore(vencimiento, hoy)) {
    return ESTADO_EPP.VENCIDO
  }

  const diasRestantes = differenceInDays(vencimiento, hoy)

  if (diasRestantes <= DIAS_ALERTA.CRITICO) {
    // 0-7 días: sigue siendo PROXIMO_VENCER pero crítico (el componente lo colorea más fuerte)
    return ESTADO_EPP.PROXIMO_VENCER
  }

  if (diasRestantes <= DIAS_ALERTA.ADVERTENCIA) {
    return ESTADO_EPP.PROXIMO_VENCER
  }

  return ESTADO_EPP.VIGENTE
}

/**
 * Días que faltan para el vencimiento.
 * Positivo = faltan N días | Negativo = venció hace N días | 0 = vence hoy
 */
export function diasParaVencimiento(fechaVencimiento) {
  if (!fechaVencimiento) return null
  const hoy         = startOfDay(new Date())
  const vencimiento = startOfDay(toDate(fechaVencimiento))
  if (!vencimiento) return null
  return differenceInDays(vencimiento, hoy)
}

/**
 * Texto legible del tiempo restante.
 * Ej: "Vence en 15 días", "Venció hace 3 días", "Vence hoy"
 */
export function textoVencimiento(fechaVencimiento) {
  const dias = diasParaVencimiento(fechaVencimiento)
  if (dias === null) return 'Sin fecha de vencimiento'
  if (dias === 0)    return 'Vence hoy'
  if (dias > 0)      return `Vence en ${dias} día${dias === 1 ? '' : 's'}`
  return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
}

// ─── VERIFICACIONES ───────────────────────────────────────────────────────────

/** True si la fecha está dentro de los próximos N días */
export function venceEnMenosDe(fechaVencimiento, dias) {
  const d = diasParaVencimiento(fechaVencimiento)
  if (d === null) return false
  return d >= 0 && d <= dias
}

/** True si la fecha ya pasó */
export function estaVencido(fechaVencimiento) {
  if (!fechaVencimiento) return false
  const hoy         = startOfDay(new Date())
  const vencimiento = startOfDay(toDate(fechaVencimiento))
  return isBefore(vencimiento, hoy)
}

// ─── UTILIDAD INTERNA ─────────────────────────────────────────────────────────

/**
 * Normaliza cualquier representación de fecha a objeto Date.
 * Acepta: Date, string ISO, string "dd/MM/yyyy", timestamp número.
 */
function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return isValid(value) ? value : null

  if (typeof value === 'number') {
    const d = new Date(value)
    return isValid(d) ? d : null
  }

  if (typeof value === 'string') {
    // ISO: "2026-05-28" o "2026-05-28T14:00:00.000Z"
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = parseISO(value)
      return isValid(d) ? d : null
    }
    // Formato local "28/05/2026"
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/').map(Number)
      const d = new Date(year, month - 1, day)
      return isValid(d) ? d : null
    }
  }

  return null
}
