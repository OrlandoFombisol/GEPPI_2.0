#!/usr/bin/env node
// Genera src/data/mejora-continua.json a partir del historial de git.
//
// Por qué existe: el servidor donde corre GEPPI en producción no tiene el
// historial de git (es solo el build estático), así que este archivo se
// regenera en la máquina de desarrollo antes de cada publicación y se sube
// como un archivo más del repo. La página de Mejora Continua solo lee este
// JSON, nunca corre git en el navegador.
//
// Nunca guarda el contenido de los cambios: solo título, fecha y cifras.
//
// Uso: npm run mejora

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = join(RAIZ, 'src/data/mejora-continua.json')
const RUTA_JSON_RELATIVA = 'src/data/mejora-continua.json'
const ZONA = 'America/Bogota'

// ─── Exclusiones (dependencias, binarios, código generado) ───────────────────

const ES_LOCKFILE = /^(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/
const ES_IMAGEN   = /\.(png|jpe?g|gif|svg|webp|ico|bmp)$/i
const ES_PDF      = /\.pdf$/i
const ES_FUENTE   = /\.(woff2?|ttf|otf|eot)$/i

function esArchivoExcluido(ruta) {
  const nombre = ruta.split('/').pop()
  if (ES_LOCKFILE.test(nombre)) return true
  if (ES_IMAGEN.test(ruta) || ES_PDF.test(ruta) || ES_FUENTE.test(ruta)) return true
  if (ruta === RUTA_JSON_RELATIVA) return true // no contarse a sí mismo
  if (ruta.startsWith('node_modules/') || ruta.startsWith('dist/')) return true
  return false
}

const ES_ARCHIVO_DE_CODIGO = /\.(js|jsx|ts|tsx|mjs|cjs|css|sql)$/i

// ─── Zona horaria ─────────────────────────────────────────────────────────────

function fechaEnBogota(fechaIso) {
  const d = new Date(fechaIso)
  if (isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

// ─── 1) Historial por commit (git log --numstat) ─────────────────────────────

function leerHistorialGit() {
  const salida = execSync(
    `git log --numstat --date=iso-strict --pretty=format:"@@COMMIT@@%n%h|%ad|%s"`,
    { cwd: RAIZ, maxBuffer: 1024 * 1024 * 64, encoding: 'utf-8' }
  )

  const bloques = salida.split('@@COMMIT@@').map(b => b.trim()).filter(Boolean)
  const commits = []

  for (const bloque of bloques) {
    const lineas = bloque.split('\n')
    const cabecera = lineas[0]
    const m = cabecera.match(/^([^|]+)\|([^|]+)\|(.*)$/)
    if (!m) continue
    const [, hash, fechaIso, titulo] = m

    let archivos = 0, agregadas = 0, quitadas = 0
    for (const linea of lineas.slice(1)) {
      if (!linea.trim()) continue
      const partes = linea.split('\t')
      if (partes.length < 3) continue
      const [add, del, ruta] = partes
      if (esArchivoExcluido(ruta)) continue
      archivos++
      agregadas += Number(add) || 0
      quitadas  += Number(del) || 0
    }

    const fecha = fechaEnBogota(fechaIso)
    if (!fecha) continue
    commits.push({ hash, fecha, titulo, archivos, agregadas, quitadas })
  }

  return commits
}

// ─── 2) Totales del proyecto (estado actual del repo) ────────────────────────

function leerArchivosTrackeados() {
  const salida = execSync('git ls-files', { cwd: RAIZ, encoding: 'utf-8' })
  return salida.split('\n').map(l => l.trim()).filter(Boolean)
}

function contarLineas(rutaAbs) {
  try {
    const contenido = readFileSync(rutaAbs, 'utf-8')
    return contenido.split('\n').length
  } catch {
    return 0
  }
}

function calcularTotales(commits) {
  const archivos = leerArchivosTrackeados().filter(r => !esArchivoExcluido(r))
  const archivosCodigo = archivos.filter(r => ES_ARCHIVO_DE_CODIGO.test(r))

  let lineasCodigoPropio = 0
  for (const r of archivosCodigo) {
    lineasCodigoPropio += contarLineas(join(RAIZ, r))
  }

  let pruebasAutomaticas = 0
  for (const r of archivosCodigo) {
    if (!/\.(test|spec)\.[jt]sx?$/.test(r)) continue
    const contenido = readFileSync(join(RAIZ, r), 'utf-8')
    const matches = contenido.match(/\b(it|test)\(/g)
    pruebasAutomaticas += matches ? matches.length : 0
  }

  const pantallas = archivos.filter(r => /^src\/pages\/[^/]+\/index\.jsx$/.test(r)).length

  let modulosNegocio = 0
  try {
    const dbIndex = readFileSync(join(RAIZ, 'src/db/index.js'), 'utf-8')
    const matches = dbIndex.match(/export const \w+DB = {/g)
    modulosNegocio = matches ? matches.length : 0
  } catch { /* si no existe, queda en 0 */ }

  const migracionesBD = archivos.filter(r => /^supabase\/migrations\/.+\.sql$/.test(r)).length

  const diasTrabajo = new Set(commits.map(c => c.fecha)).size

  return {
    numCambios:          commits.length,
    diasTrabajo,
    lineasCodigoPropio,
    archivosCodigo:      archivosCodigo.length,
    pruebasAutomaticas,
    pantallas,
    modulosNegocio,
    migracionesBD,
  }
}

// ─── Ejecutar ──────────────────────────────────────────────────────────────────

const commits  = leerHistorialGit()
const totales  = calcularTotales(commits)

const salidaJson = {
  generadoEn: new Date().toISOString(),
  commits,
  totales,
}

mkdirSync(dirname(SALIDA), { recursive: true })
writeFileSync(SALIDA, JSON.stringify(salidaJson, null, 2) + '\n', 'utf-8')

console.log(`Mejora Continua: ${commits.length} commits, ${totales.diasTrabajo} días de trabajo.`)
console.log(`Escrito en ${RUTA_JSON_RELATIVA}`)
