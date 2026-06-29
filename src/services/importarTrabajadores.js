import * as XLSX from 'xlsx'

function normalizar(v) {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

function formatearFechaExcel(v) {
  if (!v) return ''
  if (typeof v === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(v)
      if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
    } catch { /* ignore */ }
  }
  const s = normalizar(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // Formato DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  }
  return ''
}

/**
 * Parsea un archivo Excel y extrae trabajadores.
 * Columnas tolerantes al orden:
 *   Cédula · Nombres · Apellidos · Cargo · Empresa (NIT o nombre) · Sede (opcional) · Fecha Ingreso
 *
 * @param {File} archivo
 * @param {{ cargos, sedes, empresas }} contexto
 * @returns {Promise<{ trabajadores, errores, advertencias }>}
 */
export async function parsearTrabajadores(archivo, { cargos = [], sedes = [], empresas = [] } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))

    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        const errores      = []
        const advertencias = []

        // Encontrar encabezado
        let headerIdx = -1
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const row = data[i].map(c => normalizar(c).toLowerCase())
          if (row.some(c => c.includes('cédula') || c.includes('cedula') || c.includes('identificación'))) {
            headerIdx = i
            break
          }
        }
        if (headerIdx === -1) {
          errores.push('No se encontró encabezado. La primera fila debe contener: Cédula, Nombres, Apellidos, Cargo…')
          return resolve({ trabajadores: [], errores, advertencias })
        }

        const headers = data[headerIdx].map(h => normalizar(h).toLowerCase())

        const col = {
          cedula:       headers.findIndex(h => h.includes('cédula') || h.includes('cedula') || h.includes('identif') || h.includes('cc')),
          nombres:      headers.findIndex(h => h.includes('nombre') && !h.includes('apellido')),
          apellidos:    headers.findIndex(h => h.includes('apellido')),
          cargo:        headers.findIndex(h => h.includes('cargo') || h.includes('puesto') || h.includes('rol')),
          empresa:      headers.findIndex(h => h.includes('empresa') || h.includes('nit') || h.includes('ut') || h.includes('unidad')),
          sede:         headers.findIndex(h => h.includes('sede') || h.includes('centro') || h.includes('local')),
          fechaIngreso: headers.findIndex(h => h.includes('fecha') || h.includes('ingreso') || h.includes('vinculaci')),
          genero:       headers.findIndex(h => h.includes('género') || h.includes('genero') || h.includes('sexo')),
        }

        if (col.cedula   === -1) errores.push('Columna Cédula no encontrada.')
        if (col.nombres  === -1) errores.push('Columna Nombres no encontrada.')
        if (col.apellidos === -1) advertencias.push('Columna Apellidos no encontrada — quedará vacía.')
        if (errores.length > 0) return resolve({ trabajadores: [], errores, advertencias })

        // Índices para lookups rápidos
        const cargoMap   = Object.fromEntries(cargos.map(c => [c.nombre.toLowerCase(), c.id]))
        const sedeMap    = Object.fromEntries(sedes.map(s => [s.nombre.toLowerCase(), s.id]))
        const empresaMapNit  = Object.fromEntries(empresas.map(e => [e.nit, e.id]))
        const empresaMapNombre = Object.fromEntries(empresas.map(e => [e.razonSocial.toLowerCase(), e.id]))
        const empresaIdANombre = Object.fromEntries(empresas.map(e => [e.id, e.razonSocial]))
        const sedeIdANombre    = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))

        const trabajadores = []

        for (let i = headerIdx + 1; i < data.length; i++) {
          const row      = data[i]
          const cedula   = String(normalizar(row[col.cedula])).replace(/\D/g, '')
          const nombres  = normalizar(row[col.nombres])
          const apellidos = col.apellidos >= 0 ? normalizar(row[col.apellidos]) : ''

          if (!cedula && !nombres) continue
          if (!cedula) { advertencias.push(`Fila ${i + 1}: sin cédula — omitida.`); continue }
          if (!nombres) { advertencias.push(`Fila ${i + 1}: sin nombres — omitida.`); continue }

          // Resolver cargoId
          let cargoId   = null
          let cargoNombre = ''
          if (col.cargo >= 0) {
            const cargoTexto = normalizar(row[col.cargo]).toLowerCase()
            cargoId = cargoMap[cargoTexto] || null
            if (!cargoId) {
              const match = Object.keys(cargoMap).find(k => k.includes(cargoTexto) || cargoTexto.includes(k))
              cargoId = match ? cargoMap[match] : null
            }
            cargoNombre = normalizar(row[col.cargo])
            if (!cargoId) advertencias.push(`Fila ${i + 1}: cargo "${cargoNombre}" no encontrado en el sistema.`)
          }

          // Resolver empresaId
          let empresaId   = null
          let empresaNombre = ''
          if (col.empresa >= 0) {
            const empTexto = normalizar(row[col.empresa])
            // Intentar por NIT primero
            empresaId = empresaMapNit[empTexto.replace(/\D/g, '')] || null
            if (!empresaId) {
              empresaId = empresaMapNombre[empTexto.toLowerCase()] || null
            }
            if (!empresaId) {
              const match = Object.keys(empresaMapNombre).find(k => k.includes(empTexto.toLowerCase().slice(0,5)))
              empresaId = match ? empresaMapNombre[match] : null
            }
            empresaNombre = empTexto
            if (!empresaId) advertencias.push(`Fila ${i + 1}: empresa "${empTexto}" no encontrada.`)
          }

          // Resolver sedeId (opcional)
          let sedeId   = null
          let sedeNombre = ''
          if (col.sede >= 0 && row[col.sede]) {
            const sedeTexto = normalizar(row[col.sede]).toLowerCase()
            sedeId = sedeMap[sedeTexto] || null
            if (!sedeId) {
              const match = Object.keys(sedeMap).find(k => k.includes(sedeTexto) || sedeTexto.includes(k))
              sedeId = match ? sedeMap[match] : null
            }
            sedeNombre = normalizar(row[col.sede])
          }

          trabajadores.push({
            cedula,
            nombres,
            apellidos,
            cargoId,
            sedeId,
            empresaId,
            genero:       col.genero >= 0 ? normalizar(row[col.genero])?.[0]?.toUpperCase() || '' : '',
            fechaIngreso: col.fechaIngreso >= 0 ? formatearFechaExcel(row[col.fechaIngreso]) : '',
            estado:       'ACTIVO',
            // Campos temporales para vista previa (no se guardan en DB)
            _cargoNombre:   cargoNombre,
            _empresaNombre: empresaId ? empresaIdANombre[empresaId] : empresaNombre,
            _sedeNombre:    sedeId    ? sedeIdANombre[sedeId]       : sedeNombre,
          })
        }

        if (trabajadores.length === 0 && errores.length === 0) {
          errores.push('No se encontraron trabajadores en el archivo.')
        }

        resolve({ trabajadores, errores, advertencias })
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(archivo)
  })
}

/**
 * Genera y descarga el formato Excel de importación de trabajadores.
 */
export function descargarFormatoTrabajadores() {
  const headers = ['Cédula', 'Nombres', 'Apellidos', 'Cargo', 'NIT Empresa / Nombre Empresa', 'Sede (opcional)', 'Fecha Ingreso (YYYY-MM-DD)']
  const ejemplo = [
    ['12345678', 'Juan Carlos', 'Martínez Gómez', 'Conductor', '900123456', 'Sede Principal', '2024-01-15'],
    ['87654321', 'María Elena', 'López Pérez', 'Operario', 'Empresa XYZ', '', '2023-06-01'],
  ]

  const wb  = XLSX.utils.book_new()
  const ws  = XLSX.utils.aoa_to_sheet([headers, ...ejemplo])
  ws['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 24 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Trabajadores')
  XLSX.writeFile(wb, 'FORMATO_IMPORTACION_TRABAJADORES.xlsx')
}
