import * as XLSX from 'xlsx'

function normalizar(v) {
  if (v == null) return ''
  return String(v).replace(/\s+/g, ' ').trim()
}

function limpiarNIT(v) {
  return String(v || '').replace(/[\s.-]/g, '').trim()
}

/**
 * Parsea un archivo Excel y extrae empresas.
 * Columnas esperadas (tolerantes al orden y mayúsculas):
 *   NIT | Razón Social | Representante Legal | Departamento | Ciudad | Dirección | Sector
 *
 * @param {File} archivo
 * @returns {Promise<{ empresas, errores, advertencias }>}
 */
export async function parsearEmpresas(archivo) {
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

        // Buscar fila de encabezado (primeras 10 filas)
        let headerIdx = -1
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const row = data[i].map(c => normalizar(c).toLowerCase())
          if (row.some(c => c.includes('nit') || c.includes('razón') || c.includes('razon') || c.includes('social'))) {
            headerIdx = i
            break
          }
        }
        if (headerIdx === -1) {
          errores.push('No se encontró fila de encabezado. La primera fila debe contener: NIT, Razón Social, etc.')
          return resolve({ empresas: [], errores, advertencias })
        }

        const headers = data[headerIdx].map(h => normalizar(h).toLowerCase())

        const col = {
          nit:            headers.findIndex(h => h.includes('nit')),
          razonSocial:    headers.findIndex(h => h.includes('razón') || h.includes('razon') || h.includes('social') || h.includes('empresa')),
          representante:  headers.findIndex(h => h.includes('representante') || h.includes('legal')),
          departamento:   headers.findIndex(h => h.includes('departamento') || h.includes('depto')),
          ciudad:         headers.findIndex(h => h.includes('ciudad') || h.includes('municipio')),
          direccion:      headers.findIndex(h => h.includes('dirección') || h.includes('direccion') || h.includes('direcc')),
          sector:         headers.findIndex(h => h.includes('sector')),
        }

        if (col.nit === -1)         errores.push('Columna NIT no encontrada.')
        if (col.razonSocial === -1) errores.push('Columna Razón Social no encontrada.')
        if (errores.length > 0)     return resolve({ empresas: [], errores, advertencias })

        const empresas = []
        for (let i = headerIdx + 1; i < data.length; i++) {
          const row       = data[i]
          const nitRaw    = normalizar(row[col.nit])
          const nit       = limpiarNIT(nitRaw)
          const razon     = col.razonSocial >= 0 ? normalizar(row[col.razonSocial]) : ''

          if (!nit && !razon) continue  // fila vacía

          if (!nit) {
            advertencias.push(`Fila ${i + 1}: sin NIT — omitida.`)
            continue
          }
          if (!/^\d{6,12}$/.test(nit)) {
            advertencias.push(`Fila ${i + 1}: NIT "${nitRaw}" con formato inusual — incluido igualmente.`)
          }
          if (!razon) {
            advertencias.push(`Fila ${i + 1}: sin Razón Social — omitida.`)
            continue
          }

          empresas.push({
            nit,
            razonSocial:       razon,
            representanteLegal: col.representante >= 0 ? normalizar(row[col.representante]) : '',
            departamento:      col.departamento  >= 0 ? normalizar(row[col.departamento])   : '',
            ciudad:            col.ciudad        >= 0 ? normalizar(row[col.ciudad])         : '',
            direccion:         col.direccion     >= 0 ? normalizar(row[col.direccion])      : '',
            sector:            col.sector        >= 0 ? normalizar(row[col.sector])         : '',
          })
        }

        if (empresas.length === 0 && errores.length === 0) {
          errores.push('No se encontraron empresas en el archivo.')
        }

        resolve({ empresas, errores, advertencias })
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(archivo)
  })
}

/**
 * Genera y descarga el formato Excel de importación de empresas.
 */
export function descargarFormatoEmpresas() {
  const headers = ['NIT', 'Razón Social', 'Representante Legal', 'Departamento', 'Ciudad / Municipio', 'Dirección', 'Sector']
  const ejemplo = [
    ['900123456', 'Corporación XYZ S.A.S.', 'Juan Pérez', 'Cundinamarca', 'Bogotá', 'Calle 10 # 15-30', 'Servicios generales'],
    ['860001234', 'Empresa ABC Ltda.', 'María López', 'Antioquia', 'Medellín', 'Carrera 50 # 22-10', 'Industria manufacturera'],
  ]

  const wb  = XLSX.utils.book_new()
  const ws  = XLSX.utils.aoa_to_sheet([headers, ...ejemplo])

  // Ancho de columnas
  ws['!cols'] = [{ wch: 14 }, { wch: 35 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 22 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Empresas')
  XLSX.writeFile(wb, 'FORMATO_IMPORTACION_EMPRESAS.xlsx')
}
