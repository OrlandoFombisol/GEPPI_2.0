/**
 * Formatea valor como pesos colombianos.
 * Ej: 12500.5 → "$12.500,50"
 */
export function formatearPesos(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style:                 'currency',
    currency:              'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}

/**
 * Formatea número con separador de miles.
 * Ej: 1234567 → "1.234.567"
 */
export function formatearNumero(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '—'
  return new Intl.NumberFormat('es-CO').format(valor)
}

/**
 * Capitaliza la primera letra de cada palabra.
 * Ej: "auxiliar de cocina" → "Auxiliar De Cocina"
 */
export function capitalizar(texto) {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

/**
 * Retorna las iniciales de un nombre completo (máx. 2 letras).
 * Ej: "Juan Carlos Pérez" → "JP"
 */
export function obtenerIniciales(nombre) {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
}

/**
 * Genera el número de acta formateado.
 * Ej: (3, 2026) → "EPP-2026-00003"
 */
export function formatearNumeroActa(id, anio) {
  const a = anio || new Date().getFullYear()
  return `EPP-${a}-${String(id).padStart(5, '0')}`
}

/**
 * Trunca un texto largo con puntos suspensivos.
 */
export function truncar(texto, maxLongitud = 50) {
  if (!texto) return ''
  if (texto.length <= maxLongitud) return texto
  return texto.slice(0, maxLongitud - 3) + '...'
}

/**
 * Nombre del archivo PDF de entrega.
 * Ej: "EPP_12345678_2026-05-28.pdf"
 */
export function nombreArchivoPDF(cedula, fecha) {
  const f = fecha ? new Date(fecha) : new Date()
  const fechaStr = f.toISOString().split('T')[0]
  return `EPP_${cedula}_${fechaStr}.pdf`
}
