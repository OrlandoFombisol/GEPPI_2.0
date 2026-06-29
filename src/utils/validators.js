/**
 * Valida un NIT colombiano.
 * Formato: números sin puntos, con o sin dígito verificador (ej: 900123456 o 900123456-7)
 */
export function validarNIT(nit) {
  if (!nit) return false

  // Limpiar puntos, guiones y espacios
  const limpio = String(nit).replace(/[\s.\-]/g, '')

  // Solo dígitos, entre 8 y 10 caracteres
  if (!/^\d{8,10}$/.test(limpio)) return false

  return true
}

/**
 * Calcula el dígito verificador de un NIT colombiano.
 * Útil para mostrar el NIT formateado.
 */
export function calcularDigitoNIT(nit) {
  const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
  const limpio = String(nit).replace(/[\s.\-]/g, '').split('').reverse()

  let suma = 0
  for (let i = 0; i < limpio.length; i++) {
    suma += parseInt(limpio[i]) * vpri[i]
  }

  const residuo = suma % 11
  if (residuo === 0 || residuo === 1) return residuo
  return 11 - residuo
}

/** Formatea el NIT con puntos y dígito verificador: 900.123.456-7 */
export function formatearNIT(nit) {
  const limpio = String(nit).replace(/[\s.\-]/g, '')
  if (limpio.length < 8) return nit

  const dv = calcularDigitoNIT(limpio)
  const numero = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${numero}-${dv}`
}

/** Valida cédula colombiana: solo números, entre 6 y 10 dígitos */
export function validarCedula(cedula) {
  if (!cedula) return false
  const limpio = String(cedula).replace(/\s/g, '')
  return /^\d{6,10}$/.test(limpio)
}

/** Valida correo electrónico */
export function validarEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Valida teléfono colombiano: 10 dígitos, puede empezar en 3 (móvil) o 6-8 (fijo) */
export function validarTelefono(telefono) {
  if (!telefono) return false
  const limpio = String(telefono).replace(/[\s\-().+]/g, '')
  return /^[3,6-8]\d{9}$/.test(limpio)
}

/** Normaliza texto: trim + mayúsculas para comparaciones */
export function normalizar(texto) {
  if (!texto) return ''
  return texto.trim().toUpperCase()
}

/** Quita acentos y convierte a minúsculas para búsquedas */
export function normalizarBusqueda(texto) {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}
