// snake_case → camelCase
export const toCamel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())

// camelCase → snake_case
export const toSnake = s => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)

// Objeto DB (snake_case) → JS (camelCase)
export function fromDB(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

// Array de objetos DB → JS
export const manyFromDB = arr => (arr || []).map(fromDB)

// Objeto JS (camelCase) → DB (snake_case), omite undefined
export function toDB(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[toSnake(k)] = v
  }
  return result
}

// Inventario: renombra `cantidad` → `stockActual` para compatibilidad con v1
export function fromDBInventario(obj) {
  if (!obj) return null
  const { cantidad, stock_minimo, epp_id, sede_id, ...rest } = obj
  return {
    ...fromDB(rest),
    eppId:       epp_id,
    sedeId:      sede_id,
    stockActual: cantidad ?? 0,
    stockMinimo: stock_minimo ?? 5,
  }
}
