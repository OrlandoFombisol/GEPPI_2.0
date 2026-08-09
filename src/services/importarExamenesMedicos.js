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
      if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    } catch { /* ignore */ }
  }
  const s = normalizar(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return ''
}

const TIPO_POR_TEXTO = {
  'ingreso':               'INGRESO',
  'periodico':             'PERIODICO',
  'periódico':             'PERIODICO',
  'retiro':                'RETIRO',
  'restriccion':           'RESTRICCION',
  'restricción':           'RESTRICCION',
  'restriccion medica':    'RESTRICCION',
  'restricción médica':    'RESTRICCION',
}

const APTITUD_POR_TEXTO = {
  'apto':                    'APTO',
  'apto con restricciones':  'APTO_CON_RESTRICCIONES',
  'no apto':                 'NO_APTO',
}

/**
 * Parsea un archivo Excel y extrae exámenes médicos.
 * Columnas tolerantes al orden:
 *   Cédula · Tipo · Fecha Realización · Fecha Vencimiento · Aptitud · Restricciones · Entidad Realizadora · Observaciones
 *
 * @param {File} archivo
 * @param {{ trabajadores: Array }} contexto
 * @returns {Promise<{ examenes, errores, advertencias }>}
 */
export async function parsearExamenesMedicos(archivo, { trabajadores = [] } = {}) {
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

        let headerIdx = -1
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const row = data[i].map(c => normalizar(c).toLowerCase())
          if (row.some(c => c.includes('cédula') || c.includes('cedula') || c.includes('identificación'))) {
            headerIdx = i
            break
          }
        }
        if (headerIdx === -1) {
          errores.push('No se encontró encabezado. La primera fila debe contener: Cédula, Tipo, Fecha Realización…')
          return resolve({ examenes: [], errores, advertencias })
        }

        const headers = data[headerIdx].map(h => normalizar(h).toLowerCase())
        const col = {
          cedula:      headers.findIndex(h => h.includes('cédula') || h.includes('cedula') || h.includes('identif')),
          tipo:        headers.findIndex(h => h.includes('tipo')),
          fechaReal:   headers.findIndex(h => h.includes('realiza')),
          fechaVenc:   headers.findIndex(h => h.includes('vencim')),
          aptitud:     headers.findIndex(h => h.includes('aptitud') || h.includes('concepto')),
          restric:     headers.findIndex(h => h.includes('restric')),
          entidad:     headers.findIndex(h => h.includes('entidad') || h.includes('eps') || h.includes('ips')),
          observ:      headers.findIndex(h => h.includes('observ')),
        }

        if (col.cedula === -1) errores.push('Columna Cédula no encontrada.')
        if (col.fechaReal === -1) errores.push('Columna Fecha Realización no encontrada.')
        if (errores.length > 0) return resolve({ examenes: [], errores, advertencias })

        const trabajadorPorCedula = Object.fromEntries(trabajadores.map(t => [String(t.cedula), t]))

        const examenes = []

        for (let i = headerIdx + 1; i < data.length; i++) {
          const row    = data[i]
          const cedula = String(normalizar(row[col.cedula])).replace(/\D/g, '')
          if (!cedula) continue

          const trabajador = trabajadorPorCedula[cedula]
          if (!trabajador) {
            advertencias.push(`Fila ${i + 1}: no existe ningún trabajador con cédula ${cedula} — omitida.`)
            continue
          }

          const fechaRealizacion = col.fechaReal >= 0 ? formatearFechaExcel(row[col.fechaReal]) : ''
          if (!fechaRealizacion) {
            advertencias.push(`Fila ${i + 1}: sin fecha de realización válida — omitida.`)
            continue
          }

          const tipoTexto = col.tipo >= 0 ? normalizar(row[col.tipo]).toLowerCase() : ''
          const tipo = TIPO_POR_TEXTO[tipoTexto] || 'PERIODICO'
          if (col.tipo >= 0 && tipoTexto && !TIPO_POR_TEXTO[tipoTexto]) {
            advertencias.push(`Fila ${i + 1}: tipo "${row[col.tipo]}" no reconocido — se usó "Periódico".`)
          }

          const aptitudTexto = col.aptitud >= 0 ? normalizar(row[col.aptitud]).toLowerCase() : ''
          const aptitudLaboral = APTITUD_POR_TEXTO[aptitudTexto] || 'APTO'
          if (col.aptitud >= 0 && aptitudTexto && !APTITUD_POR_TEXTO[aptitudTexto]) {
            advertencias.push(`Fila ${i + 1}: aptitud "${row[col.aptitud]}" no reconocida — se usó "Apto".`)
          }

          examenes.push({
            trabajadorId:       trabajador.id,
            empresaId:          trabajador.empresaId || null,
            tipo,
            fechaRealizacion,
            fechaVencimiento:   col.fechaVenc >= 0 ? formatearFechaExcel(row[col.fechaVenc]) : '',
            aptitudLaboral,
            restricciones:      col.restric >= 0 ? normalizar(row[col.restric]) : '',
            entidadRealizadora: col.entidad >= 0 ? normalizar(row[col.entidad]) : '',
            observaciones:      col.observ >= 0 ? normalizar(row[col.observ]) : '',
            // Campos temporales para vista previa (no se guardan en DB)
            _cedula:            cedula,
            _nombreTrabajador:  `${trabajador.nombres} ${trabajador.apellidos}`.trim(),
          })
        }

        if (examenes.length === 0 && errores.length === 0) {
          errores.push('No se encontraron exámenes válidos en el archivo.')
        }

        resolve({ examenes, errores, advertencias })
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(archivo)
  })
}

/**
 * Genera y descarga el formato Excel de importación de exámenes médicos.
 */
export function descargarFormatoExamenesMedicos() {
  const headers = ['Cédula', 'Tipo', 'Fecha Realización (YYYY-MM-DD)', 'Fecha Vencimiento (opcional)', 'Aptitud', 'Restricciones (opcional)', 'Entidad Realizadora (opcional)', 'Observaciones (opcional)']
  const ejemplo = [
    ['12345678', 'Ingreso',   '2026-01-15', '2027-01-15', 'Apto',                   '',                       'IPS Centro de Reconocimiento', ''],
    ['87654321', 'Periódico', '2026-03-01', '2027-03-01', 'Apto con restricciones', 'No cargar objetos > 10kg', 'IPS Centro de Reconocimiento', 'Control en 6 meses'],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...ejemplo])
  ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 22 }, { wch: 30 }, { wch: 28 }, { wch: 30 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Examenes')
  XLSX.writeFile(wb, 'FORMATO_IMPORTACION_EXAMENES_MEDICOS.xlsx')
}
