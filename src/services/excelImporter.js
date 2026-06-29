import * as XLSX from 'xlsx'

// ─── Helpers internos ─────────────────────────────────────────────────────────

function normalizar(v) {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

/**
 * Convierte texto de vida útil a días.
 * "1 año" → 365 | "6 meses" → 180 | "30 días" → 30 | número puro → número
 */
function parsearVidaUtil(texto) {
  if (texto == null || texto === '') return 365
  const t = String(texto).toLowerCase().trim()
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t))
  const años  = t.match(/(\d+(?:\.\d+)?)\s*a[ñn]o/)
  if (años)   return Math.round(parseFloat(años[1]) * 365)
  const meses = t.match(/(\d+(?:\.\d+)?)\s*mes/)
  if (meses)  return Math.round(parseFloat(meses[1]) * 30)
  const sem   = t.match(/(\d+(?:\.\d+)?)\s*sem/)
  if (sem)    return Math.round(parseFloat(sem[1]) * 7)
  const dias  = t.match(/(\d+(?:\.\d+)?)\s*d[íi]a/)
  if (dias)   return Math.round(parseFloat(dias[1]))
  if (t.includes('permanente') || t.includes('indefinid')) return 3650
  return 365
}

/**
 * Busca la primera fila (0-indexed) que contenga alguna de las keywords.
 * Escanea hasta las primeras 20 filas.
 */
function encontrarFilaHeader(rows, keywords) {
  const kw = keywords.map((k) => k.toLowerCase())
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i].map((c) => normalizar(c).toLowerCase())
    if (kw.some((k) => row.some((cell) => cell.includes(k)))) return i
  }
  return -1
}

// ─── Parser hoja MATRIZ EPP ───────────────────────────────────────────────────

function parseMatrizEPP(ws) {
  const data       = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const errores    = []
  const advertencias = []

  const headerIdx = encontrarFilaHeader(data, ['item', 'elemento', 'epp', 'protección', 'nombre'])
  if (headerIdx === -1) {
    errores.push('No se encontró la fila de encabezados en la hoja Matriz EPP.')
    return { epps: [], errores, advertencias }
  }

  const headers = data[headerIdx].map((h) => normalizar(h).toLowerCase())

  const col = {
    item:        headers.findIndex((h) => /^(item|n[°º o]|#)/.test(h)),
    nombre:      headers.findIndex((h) => h.includes('elemento') || h.includes('epp') || h.includes('nombre') || h.includes('protecci')),
    categoria:   headers.findIndex((h) => h.includes('categ') || h.includes('tipo') || h.includes('parte')),
    norma:       headers.findIndex((h) => h.includes('norma') || h.includes('ntc') || h.includes('está')),
    marcaSuger:  headers.findIndex((h) => h.includes('marca') || h.includes('fabr')),
    vidaUtil:    headers.findIndex((h) => h.includes('vida') || h.includes('duraci') || h.includes('util')),
    descripcion: headers.findIndex((h) => h.includes('descrip') || h.includes('especif') || h.includes('caract')),
  }
  if (col.nombre === -1) col.nombre = 1
  if (col.item   === -1) col.item   = 0

  const epps = []
  for (let i = headerIdx + 1; i < data.length; i++) {
    const row  = data[i]
    const nombreRaw = row[col.nombre]
    if (!nombreRaw || normalizar(nombreRaw) === '') continue

    const itemNum = parseInt(row[col.item])
    if (isNaN(itemNum) && normalizar(row[col.item]) === '') {
      advertencias.push(`Fila ${i + 1}: sin número de ítem — omitida.`)
      continue
    }

    epps.push({
      item:          isNaN(itemNum) ? epps.length + 1 : itemNum,
      nombre:        normalizar(nombreRaw),
      categoria:     col.categoria  >= 0 ? normalizar(row[col.categoria])  : '',
      norma:         col.norma      >= 0 ? normalizar(row[col.norma])       : '',
      marcaSugerida: col.marcaSuger >= 0 ? normalizar(row[col.marcaSuger])  : '',
      vidaUtilDias:  col.vidaUtil   >= 0 ? parsearVidaUtil(row[col.vidaUtil]) : 365,
      descripcion:   col.descripcion >= 0 ? normalizar(row[col.descripcion]) : '',
      estado:        'ACTIVO',
      version:       '007',
    })
  }

  if (epps.length === 0) errores.push('No se encontraron EPP en la hoja Matriz EPP.')
  return { epps, errores, advertencias }
}

// ─── Parser hoja MATRIZ POR CARGOS ────────────────────────────────────────────

function parseMatrizCargos(ws, eppsParsed) {
  const data       = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const errores    = []
  const advertencias = []

  // Buscar la fila con ítems de EPP (varios enteros 1-50 en columnas)
  let headerEppIdx = -1
  let colInicioEpp = 1

  for (let i = 0; i < Math.min(data.length, 20); i++) {
    let count = 0
    for (let j = 1; j < data[i].length; j++) {
      const v = parseInt(data[i][j])
      if (!isNaN(v) && v >= 1 && v <= 50) count++
    }
    if (count >= 5) {
      headerEppIdx = i
      for (let j = 0; j < data[i].length; j++) {
        if (parseInt(data[i][j]) === 1) { colInicioEpp = j; break }
      }
      break
    }
  }

  // Fallback: buscar por nombres de EPP si no hay números
  if (headerEppIdx === -1 && eppsParsed.length > 0) {
    const nombres = eppsParsed.map((e) => e.nombre.toLowerCase().substring(0, 6))
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const row = data[i].map((c) => normalizar(c).toLowerCase())
      if (row.filter((c) => nombres.some((n) => c.includes(n))).length >= 3) {
        headerEppIdx = i
        break
      }
    }
  }

  if (headerEppIdx === -1) {
    errores.push('No se encontró la fila de encabezados EPP en la hoja Matriz por Cargos.')
    return { cargos: [], asignaciones: [], errores, advertencias }
  }

  // Mapa columna → ítem de EPP
  const eppPorColumna = {}
  const headerRow = data[headerEppIdx]
  for (let j = colInicioEpp; j < headerRow.length; j++) {
    const v = parseInt(headerRow[j])
    if (!isNaN(v) && v >= 1) eppPorColumna[j] = v
  }

  const MARCADORES = new Set(['X', 'SI', 'S', '1', '✓', '✔', 'YES', 'Y'])

  const cargos      = []
  const asignaciones = []

  for (let i = headerEppIdx + 1; i < data.length; i++) {
    const row         = data[i]
    const cargoNombre = normalizar(row[0])

    if (!cargoNombre) continue
    // Omitir filas de encabezado de sección (toda la fila restante vacía)
    if (row.slice(1).every((c) => !c || normalizar(c) === '')) continue
    // Omitir filas tipo "Total", "Firma", "Observaciones"
    if (/^(total|suma|observ|firma|notas?)/i.test(cargoNombre)) continue

    if (!cargos.includes(cargoNombre)) cargos.push(cargoNombre)

    for (const [colStr, eppItem] of Object.entries(eppPorColumna)) {
      const val = normalizar(row[parseInt(colStr)]).toUpperCase()
      if (MARCADORES.has(val)) asignaciones.push({ cargoNombre, eppItem })
    }
  }

  if (cargos.length === 0) errores.push('No se encontraron cargos en la hoja Matriz por Cargos.')
  return { cargos, asignaciones, errores, advertencias }
}

// ─── Parser hoja GESTIÓN DEL CAMBIO ──────────────────────────────────────────

function parseGestionCambio(ws) {
  const data       = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const errores    = []
  const advertencias = []

  const headerIdx = encontrarFilaHeader(data, ['version', 'versión', 'revisión', 'cambio', 'fecha'])
  if (headerIdx === -1) {
    advertencias.push('Hoja Gestión del Cambio: no se encontraron encabezados.')
    return { cambios: [], errores, advertencias }
  }

  const headers = data[headerIdx].map((h) => normalizar(h).toLowerCase())
  const col = {
    version:     headers.findIndex((h) => h.includes('versión') || h.includes('version') || h.includes('rev')),
    fecha:       headers.findIndex((h) => h.includes('fecha')),
    descripcion: headers.findIndex((h) => h.includes('descrip') || h.includes('cambio') || h.includes('motivo') || h.includes('modif')),
    responsable: headers.findIndex((h) => h.includes('responsable') || h.includes('elabor') || h.includes('nombre')),
    cargo:       headers.findIndex((h) => h.includes('cargo') || h.includes('perfil')),
  }

  const cambios = []
  for (let i = headerIdx + 1; i < data.length; i++) {
    const row = data[i]
    if (row.every((c) => !c || normalizar(c) === '')) continue

    let fechaStr = col.fecha >= 0 ? row[col.fecha] : ''
    if (typeof fechaStr === 'number') {
      // Serial date de Excel
      const d = XLSX.SSF.parse_date_code(fechaStr)
      fechaStr = d
        ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
        : ''
    } else {
      fechaStr = normalizar(fechaStr)
    }

    cambios.push({
      version:          col.version     >= 0 ? normalizar(row[col.version])     : `00${i}`,
      fecha:            fechaStr || new Date().toISOString().slice(0, 10),
      descripcion:      col.descripcion >= 0 ? normalizar(row[col.descripcion]) : '',
      responsable:      col.responsable >= 0 ? normalizar(row[col.responsable]) : '',
      cargoResponsable: col.cargo       >= 0 ? normalizar(row[col.cargo])       : '',
      codigoDocumento:  'MT-SST-005',
      modulo:           'MATRIZ_EPP',
    })
  }

  return { cambios, errores, advertencias }
}

// ─── Entrada pública ──────────────────────────────────────────────────────────

/**
 * Lee el archivo Excel MT-SST-005 y retorna los datos parseados listos para
 * previsualizar y confirmar la importación.
 *
 * @param {File} archivo
 * @returns {Promise<{ epps, cargos, asignaciones, cambios, errores, advertencias, sheetNames }>}
 */
export async function parseCompleto(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))

    reader.onload = (e) => {
      try {
        const wb         = XLSX.read(e.target.result, { type: 'array', cellDates: false })
        const sheetNames = wb.SheetNames

        const findSheet = (keywords) => {
          for (const kw of keywords) {
            const found = sheetNames.find((n) =>
              n.toLowerCase().replace(/\s+/g, '').includes(kw.toLowerCase().replace(/\s+/g, ''))
            )
            if (found) return wb.Sheets[found]
          }
          return null
        }

        const wsEPP     = findSheet(['matrizdeep', 'matrizep', 'elementos', 'fichatec', 'epp'])
                       || wb.Sheets[sheetNames[0]]

        const wsCargos  = findSheet(['matrizcargo', 'porcargo', 'cargos', 'puesto'])
                       || (sheetNames.length > 1 ? wb.Sheets[sheetNames[1]] : null)

        const wsCambios = findSheet(['gestioncambio', 'cambio', 'version', 'revision', 'historial'])
                       || (sheetNames.length > 2 ? wb.Sheets[sheetNames[2]] : null)

        const errores     = []
        const advertencias = []

        const { epps,       errores: e1, advertencias: a1 } = parseMatrizEPP(wsEPP)
        errores.push(...e1); advertencias.push(...a1)

        let cargos = [], asignaciones = []
        if (wsCargos) {
          const r = parseMatrizCargos(wsCargos, epps)
          cargos = r.cargos; asignaciones = r.asignaciones
          errores.push(...r.errores); advertencias.push(...r.advertencias)
        } else {
          advertencias.push('No se encontró hoja de Matriz por Cargos.')
        }

        let cambios = []
        if (wsCambios) {
          const r = parseGestionCambio(wsCambios)
          cambios = r.cambios
          errores.push(...r.errores); advertencias.push(...r.advertencias)
        }

        resolve({ epps, cargos, asignaciones, cambios, errores, advertencias, sheetNames })
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(archivo)
  })
}
