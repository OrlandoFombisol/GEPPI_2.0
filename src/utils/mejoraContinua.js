import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TIPO_NOTA_MEJORA_LABEL } from '@/constants'

// ─── Zona horaria ─────────────────────────────────────────────────────────────
// Colombia no tiene horario de verano, pero igual usamos Intl con timeZone
// explícito en vez de un offset fijo, por si el cambio corre en un servidor
// con otra hora local.
const ZONA = 'America/Bogota'

/**
 * Convierte cualquier fecha/hora (Date o string ISO con offset) al día
 * calendario correspondiente en America/Bogota, como "YYYY-MM-DD".
 */
export function fechaEnBogota(fechaIso) {
  const d = fechaIso instanceof Date ? fechaIso : new Date(fechaIso)
  if (isNaN(d.getTime())) return null
  // en-CA produce directamente el formato YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

/** "YYYY-MM-DD" → "martes, 13 de octubre de 2026" */
export function formatearFechaLargaEs(fechaYMD) {
  if (!fechaYMD) return ''
  const [y, m, d] = fechaYMD.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  return format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

// ─── Limpieza de títulos ──────────────────────────────────────────────────────

const PREFIJO_TECNICO = /^(feat|fix|chore|docs|refactor|test|style|perf|build|ci|revert)(\([^)]*\))?!?:\s*/i

// Frases que nombran herramientas de IA, para quitarlas sin dejar rastro.
const FRASE_CON_IA =
  /\s*[([-]?\s*(usando|con ayuda de|generad[oa](?:\s+y\s+revisad[oa])?\s+(?:con|por)|hech[oa] con|ayudad[oa] por|vía|via)\s+[^,.;()]*\b(chatgpt|copilot|claude|anthropic|openai|gpt-?\d*|\bia\b|\bai\b)\b[^,.;)\]]*[)\]]?/gi

const MENCION_IA_SUELTA = /\s*[([-]?\s*\b(chatgpt|copilot|claude|anthropic|openai|gpt-?\d*|ia|ai)\b[)\]]?/gi

/**
 * Limpia un título de commit para mostrarlo a alguien no técnico:
 * quita prefijos tipo "feat:", "fix(x):", y cualquier mención a
 * herramientas de IA, sin importar cómo esté redactada la frase.
 */
export function limpiarTitulo(tituloCrudo) {
  if (!tituloCrudo) return ''
  let t = tituloCrudo.trim()
  t = t.replace(PREFIJO_TECNICO, '')
  t = t.replace(FRASE_CON_IA, '')
  t = t.replace(MENCION_IA_SUELTA, '')
  // Limpieza de residuos: espacios dobles, paréntesis vacíos, guiones colgando
  t = t.replace(/\(\s*\)/g, '')
  t = t.replace(/\s{2,}/g, ' ')
  t = t.replace(/\s+([.,;:])/g, '$1')
  t = t.replace(/[-–—]\s*$/, '')
  t = t.trim()
  if (!t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// ─── Clasificación por área ───────────────────────────────────────────────────
// Gana la primera expresión que coincida; si ninguna coincide, "General".
// El orden importa: lo más específico va primero.
const AREAS = [
  { area: 'Inspecciones',                       re: /inspecci|extintor|botiqu[ií]n|checklist|preoperacional/i },
  { area: 'SG-SST y cumplimiento',               re: /sg-?sst|\b0312\b|cumplimiento|autoevaluaci[oó]n/i },
  { area: 'Plan de trabajo y gestión del cambio', re: /plan de trabajo|plan anual|gesti[oó]n del cambio/i },
  { area: 'Alertas y notificaciones',            re: /alerta/i },
  { area: 'Seguridad y acceso',                  re: /seguridad|\brol(es)?\b|login|\bauth\b|\brls\b|acceso|permiso/i },
  { area: 'Entregas y matriz de EPP',            re: /entrega|matriz|\bepp\b/i },
  { area: 'Datos e importación',                 re: /importar|excel|migraci[oó]n|base de datos|columna|tabla|esquema/i },
  { area: 'Reportes e indicadores',              re: /reporte|indicador|consolidado/i },
  { area: 'Interfaz y experiencia',               re: /\bui\b|estilo|dise[ñn]o|responsive|interfaz/i },
  { area: 'Infraestructura y despliegue',        re: /despliegue|\bdeploy\b|servidor|nginx|\baws\b|\bvite\b|\bbuild\b|docker/i },
  { area: 'Calidad y correcciones',              re: /\bfix\b|\bbug\b|error|corrig|arregl/i },
]

export function clasificarArea(tituloCrudo) {
  const t = tituloCrudo || ''
  const encontrada = AREAS.find(({ re }) => re.test(t))
  return encontrada?.area || 'General'
}

// ─── Agrupación por día ───────────────────────────────────────────────────────

/**
 * Agrupa commits (del historial generado) y notas (de la base de datos) por
 * día calendario en America/Bogota, de más reciente a más antiguo.
 *
 * @param {Array<{hash,fecha,titulo,archivos,agregadas,quitadas}>} commits
 * @param {Array<{id,fecha,tipo,titulo,detalle}>} notas
 */
export function agruparPorDia(commits = [], notas = []) {
  const dias = new Map()

  const obtenerDia = (fecha) => {
    if (!dias.has(fecha)) {
      dias.set(fecha, { fecha, fechaLarga: formatearFechaLargaEs(fecha), mejoras: [], notas: [], totalLineas: 0 })
    }
    return dias.get(fecha)
  }

  for (const c of commits) {
    if (!c?.fecha) continue
    const dia = obtenerDia(c.fecha)
    const tituloLimpio = limpiarTitulo(c.titulo)
    if (!tituloLimpio) continue // título que quedó vacío tras limpiar no se muestra
    dia.mejoras.push({
      hash:     c.hash,
      titulo:   tituloLimpio,
      area:     clasificarArea(c.titulo),
      archivos: c.archivos || 0,
      lineas:   (c.agregadas || 0) + (c.quitadas || 0),
    })
    dia.totalLineas += (c.agregadas || 0) + (c.quitadas || 0)
  }

  for (const n of notas) {
    if (!n?.fecha) continue
    const dia = obtenerDia(n.fecha)
    dia.notas.push({
      id:        n.id,
      tipo:      n.tipo,
      tipoLabel: TIPO_NOTA_MEJORA_LABEL[n.tipo] || n.tipo,
      titulo:    n.titulo,
      detalle:   n.detalle || '',
    })
  }

  return [...dias.values()].sort((a, b) => b.fecha.localeCompare(a.fecha))
}
