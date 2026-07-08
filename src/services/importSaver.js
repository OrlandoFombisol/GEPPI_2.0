import { eppDB, cargoDB, asignacionDB, gestionCambioDB, auditoriaDB } from '@/db'
import { MODULO, ACCION } from '@/constants'

/**
 * Guarda en Supabase los datos parseados del Excel MT-SST-005.
 * Estrategia upsert: actualiza si ya existe, inserta si es nuevo.
 *
 * @param {{ epps, cargos, asignaciones, cambios }} datos — resultado de parseCompleto()
 * @param {(pct: number, msg: string) => void} onProgress — callback de progreso
 * @returns {Promise<stats>} estadísticas de la importación
 */
export async function guardarImportacion(datos, onProgress = () => {}) {
  const { epps = [], cargos = [], asignaciones = [], cambios = [] } = datos
  const errores = []
  const stats = {
    eppImportados:          0,
    eppActualizados:        0,
    cargosImportados:       0,
    cargosActualizados:     0,
    asignacionesImportadas: 0,
    asignacionesDuplicadas: 0,
    cambiosImportados:      0,
  }

  const total = epps.length + cargos.length + asignaciones.length + cambios.length || 1
  let procesados = 0
  const tick = (msg) => { procesados++; onProgress(Math.round((procesados / total) * 100), msg) }

  // ── 1. EPP ───────────────────────────────────────────────────────────────────
  onProgress(0, 'Cargando EPP existentes…')
  const eppExistentes = await eppDB.getAll()
  const eppPorItem = Object.fromEntries((eppExistentes || []).map(e => [e.item, e]))
  const eppIdPorItem = {}

  for (const epp of epps) {
    try {
      const existente = eppPorItem[epp.item]
      if (existente) {
        await eppDB.update(existente.id, {
          nombre: epp.nombre, categoria: epp.categoria, norma: epp.norma,
          marcaSugerida: epp.marcaSugerida, vidaUtilDias: epp.vidaUtilDias,
          descripcion: epp.descripcion, version: epp.version,
        })
        eppIdPorItem[epp.item] = existente.id
        stats.eppActualizados++
      } else {
        const id = await eppDB.create(epp)
        eppIdPorItem[epp.item] = id
        stats.eppImportados++
      }
    } catch (e) {
      errores.push(`EPP "${epp.nombre}": ${e.message}`)
    }
    tick(`EPP: ${epp.nombre}`)
  }

  // ── 2. Cargos ────────────────────────────────────────────────────────────────
  onProgress(Math.round((epps.length / total) * 100), 'Cargando cargos existentes…')
  const cargosExistentes = await cargoDB.getAll()
  const cargoPorNombre = Object.fromEntries((cargosExistentes || []).map(c => [c.nombre, c]))
  const cargoIdPorNombre = {}

  for (const nombre of cargos) {
    try {
      const existente = cargoPorNombre[nombre]
      if (existente) {
        cargoIdPorNombre[nombre] = existente.id
        stats.cargosActualizados++
      } else {
        const id = await cargoDB.create({ nombre })
        cargoIdPorNombre[nombre] = id
        stats.cargosImportados++
      }
    } catch (e) {
      errores.push(`Cargo "${nombre}": ${e.message}`)
    }
    tick(`Cargo: ${nombre}`)
  }

  // ── 3. Asignaciones Cargo-EPP ────────────────────────────────────────────────
  onProgress(
    Math.round(((epps.length + cargos.length) / total) * 100),
    'Cargando asignaciones existentes…'
  )
  const asigExistentes = await asignacionDB.getAll()
  const asigSet = new Set((asigExistentes || []).map(a => `${a.cargoId}:${a.eppId}`))

  for (const asig of asignaciones) {
    try {
      const cargoId = cargoIdPorNombre[asig.cargoNombre]
      const eppId   = eppIdPorItem[asig.eppItem]

      if (!cargoId || !eppId) {
        stats.asignacionesDuplicadas++
        tick('skip')
        continue
      }

      const key = `${cargoId}:${eppId}`
      if (asigSet.has(key)) {
        stats.asignacionesDuplicadas++
      } else {
        await asignacionDB.bulkCreate([{ cargoId, eppId, vigente: true }])
        asigSet.add(key)
        stats.asignacionesImportadas++
      }
    } catch (e) {
      errores.push(`Asignación cargo "${asig.cargoNombre}" EPP ${asig.eppItem}: ${e.message}`)
    }
    tick('Asignación')
  }

  // ── 4. Gestión del cambio ────────────────────────────────────────────────────
  onProgress(95, 'Guardando historial de versiones…')
  const cambiosExistentes = await gestionCambioDB.getAll()
  const versionesExistentes = new Set((cambiosExistentes || []).map(c => c.versionNueva))

  for (const cambio of cambios) {
    try {
      if (!versionesExistentes.has(cambio.version)) {
        await gestionCambioDB.create({
          codigoDocumento:  cambio.codigoDocumento,
          modulo:           cambio.modulo,
          versionNueva:     cambio.version,
          fecha:            cambio.fecha,
          descripcion:      cambio.descripcion,
          responsable:      cambio.responsable,
          cargoResponsable: cambio.cargoResponsable,
        })
        stats.cambiosImportados++
      }
    } catch (e) {
      errores.push(`Cambio versión "${cambio.version}": ${e.message}`)
    }
    tick(`Cambio v${cambio.version}`)
  }

  // ── 5. Auditoría ─────────────────────────────────────────────────────────────
  try {
    await auditoriaDB.registrar(
      MODULO.CONFIGURACION,
      ACCION.IMPORTAR,
      `MT-SST-005: ${stats.eppImportados + stats.eppActualizados} EPP, ` +
      `${stats.cargosImportados + stats.cargosActualizados} cargos, ` +
      `${stats.asignacionesImportadas} asignaciones nuevas`,
    )
  } catch (_) {
    // auditoría no bloquea la importación
  }

  onProgress(100, 'Importación completada')
  return { ...stats, errores }
}
