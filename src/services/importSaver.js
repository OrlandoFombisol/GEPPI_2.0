import { db } from '@/db'
import { MODULO, ACCION } from '@/constants'

/**
 * Guarda en Dexie.js los datos parseados del Excel MT-SST-005.
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

  const ahora = new Date().toISOString()

  // ── 1. EPP ───────────────────────────────────────────────────────────────────
  onProgress(0, 'Guardando elementos de protección personal…')
  const eppIdPorItem = {}   // item → db id

  for (const epp of epps) {
    try {
      const existente = await db.epp.where('item').equals(epp.item).first()
      if (existente) {
        await db.epp.update(existente.id, {
          nombre: epp.nombre, categoria: epp.categoria, norma: epp.norma,
          marcaSugerida: epp.marcaSugerida, vidaUtilDias: epp.vidaUtilDias,
          descripcion: epp.descripcion, version: epp.version, updatedAt: ahora,
        })
        eppIdPorItem[epp.item] = existente.id
        stats.eppActualizados++
      } else {
        const id = await db.epp.add({ ...epp, createdAt: ahora, updatedAt: ahora })
        eppIdPorItem[epp.item] = id
        stats.eppImportados++
      }
    } catch (err) {
      errores.push(`EPP "${epp.nombre}": ${err.message}`)
    }
    tick(`EPP: ${epp.nombre}`)
  }

  // ── 2. Cargos ────────────────────────────────────────────────────────────────
  onProgress(Math.round((epps.length / total) * 100), 'Guardando cargos…')
  const cargoIdPorNombre = {}   // nombre → db id

  for (const nombre of cargos) {
    try {
      const existente = await db.cargo.where('nombre').equals(nombre).first()
      if (existente) {
        cargoIdPorNombre[nombre] = existente.id
        stats.cargosActualizados++
      } else {
        const id = await db.cargo.add({ nombre, estado: 'ACTIVO', createdAt: ahora })
        cargoIdPorNombre[nombre] = id
        stats.cargosImportados++
      }
    } catch (err) {
      errores.push(`Cargo "${nombre}": ${err.message}`)
    }
    tick(`Cargo: ${nombre}`)
  }

  // ── 3. Asignaciones Cargo-EPP ────────────────────────────────────────────────
  onProgress(
    Math.round(((epps.length + cargos.length) / total) * 100),
    'Guardando matriz de asignaciones…'
  )

  for (const asig of asignaciones) {
    try {
      const cargoId = cargoIdPorNombre[asig.cargoNombre]
      const eppId   = eppIdPorItem[asig.eppItem]

      if (!cargoId || !eppId) {
        stats.asignacionesDuplicadas++
        tick('skip')
        continue
      }

      const existente = await db.asignacionCargoEpp
        .where('[cargoId+eppId]').equals([cargoId, eppId]).first()

      if (!existente) {
        await db.asignacionCargoEpp.add({ cargoId, eppId, vigente: 1, createdAt: ahora })
        stats.asignacionesImportadas++
      } else {
        stats.asignacionesDuplicadas++
      }
    } catch (err) {
      errores.push(`Asignación cargo "${asig.cargoNombre}" EPP ${asig.eppItem}: ${err.message}`)
    }
    tick('Asignación')
  }

  // ── 4. Gestión del cambio ────────────────────────────────────────────────────
  onProgress(95, 'Guardando historial de versiones…')

  for (const cambio of cambios) {
    try {
      const existe = await db.gestionCambio
        .where('versionNueva').equals(cambio.version).first()
      if (!existe) {
        await db.gestionCambio.add({
          codigoDocumento:  cambio.codigoDocumento,
          modulo:           cambio.modulo,
          versionNueva:     cambio.version,
          fecha:            cambio.fecha,
          descripcion:      cambio.descripcion,
          responsable:      cambio.responsable,
          cargoResponsable: cambio.cargoResponsable,
          createdAt:        ahora,
        })
        stats.cambiosImportados++
      }
    } catch (err) {
      errores.push(`Cambio versión "${cambio.version}": ${err.message}`)
    }
    tick(`Cambio v${cambio.version}`)
  }

  // ── 5. Auditoría ─────────────────────────────────────────────────────────────
  try {
    await db.auditoria.add({
      modulo:      MODULO.CONFIGURACION,
      accion:      ACCION.IMPORTAR,
      descripcion: `MT-SST-005: ${stats.eppImportados + stats.eppActualizados} EPP, ` +
                   `${stats.cargosImportados + stats.cargosActualizados} cargos, ` +
                   `${stats.asignacionesImportadas} asignaciones nuevas`,
      usuarioId:   1,
      referenciaId: null,
      fecha:       ahora,
    })
  } catch (_) {
    // auditoría no bloquea la importación
  }

  onProgress(100, 'Importación completada')
  return { ...stats, errores }
}
