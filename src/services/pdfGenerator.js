import { jsPDF }       from 'jspdf'
import autoTable       from 'jspdf-autotable'
import QRCode          from 'qrcode'
import { SISTEMA, TEXTO_LEGAL_ENTREGA } from '@/constants'
import { formatearFecha, formatearFechaLarga } from '@/utils/dates'
import { formatearNumeroActa }                 from '@/utils/formatters'
import { formatearNIT }                        from '@/utils/validators'
import { vidaUtilLabel }                       from '@/pages/MatrizEPP/utils'

// ─── Paleta de colores (RGB) ──────────────────────────────────────────────────
const C = {
  azul:      [30, 64, 175],    // primary-800
  azulOsc:   [21, 46, 120],    // primary-950
  blanco:    [255, 255, 255],
  negro:     [15, 23, 42],
  grisOsc:   [71, 85, 105],
  grisMed:   [148, 163, 184],
  grisClaro: [241, 245, 249],
  borde:     [226, 232, 240],
}

// ─── Medidas de página (A4 en mm) ─────────────────────────────────────────────
const PW  = 210          // page width
const ML  = 13           // left margin
const MR  = 13           // right margin
const CW  = PW - ML - MR // content width = 184mm

// ─── Helper: añadir fondo blanco a la firma (evita transparencia en PDF) ──────
async function prepararFirma(firmaBase64) {
  if (!firmaBase64 || !firmaBase64.startsWith('data:image')) return null
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = () => resolve(null)
    img.src = firmaBase64
  })
}

// ─── SECCIÓN 1: Encabezado ────────────────────────────────────────────────────
async function dibujarEncabezado(doc, { empresa, entrega }) {
  // Franja azul superior
  doc.setFillColor(...C.azulOsc)
  doc.rect(0, 0, PW, 32, 'F')

  doc.setTextColor(...C.blanco)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('ACTA DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL', PW / 2, 9, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text((empresa?.razonSocial || SISTEMA.EMPRESA_CLIENTE).toUpperCase(), PW / 2, 16.5, { align: 'center' })

  doc.setFontSize(8)
  const nro = formatearNumeroActa(entrega.id, new Date(entrega.fechaEntrega).getFullYear())
  doc.text(`${SISTEMA.CODIGO_DOCUMENTO} · Versión ${SISTEMA.VERSION_MATRIZ}`, ML, 25)
  doc.text(`Acta N° ${nro}`, PW - MR, 25, { align: 'right' })

  // QR code con ID de entrega (esquina superior derecha)
  try {
    const payload = `GEPPI-E:${entrega.id}:${nro}`
    const qrDataUrl = await QRCode.toDataURL(payload, { width: 80, margin: 1 })
    doc.addImage(qrDataUrl, 'PNG', PW - MR - 22, 5, 20, 20)
  } catch { /* silencioso */ }

  return 38  // y siguiente
}

// ─── SECCIÓN 2: Datos del trabajador ─────────────────────────────────────────
function dibujarDatosTrabajador(doc, yInicio, { trabajador, cargo, sede, empresa, entrega }) {
  let y = yInicio

  // Título sección
  doc.setFillColor(...C.azul)
  doc.rect(ML, y, CW, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.blanco)
  doc.text('DATOS DEL TRABAJADOR', ML + 3, y + 4.2)
  y += 8

  // Función helper para línea de datos
  const campo = (label, valor, xBase, ancho = CW / 2 - 2) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.grisOsc)
    doc.text(label.toUpperCase() + ':', xBase, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.negro)
    const maxW = ancho - 22
    const lines = doc.splitTextToSize(String(valor || '—'), maxW)
    doc.text(lines[0], xBase + 22, y)
  }

  const col1 = ML
  const col2 = ML + CW / 2 + 2
  const lineH = 5.5

  campo('Nombre',    `${trabajador.nombres} ${trabajador.apellidos}`, col1)
  campo('Cédula',    trabajador.cedula,                               col2)
  y += lineH

  campo('Cargo',     cargo?.nombre || '—',                           col1)
  campo('Sede',      sede?.nombre  || '—',                           col2)
  y += lineH

  campo('Fecha entrega', formatearFechaLarga(entrega.fechaEntrega), col1)
  campo('Empresa',       empresa?.razonSocial ? formatearNIT(empresa.nit) : '—', col2)
  y += lineH

  // Separador
  doc.setDrawColor(...C.borde)
  doc.setLineWidth(0.3)
  doc.line(ML, y, ML + CW, y)

  return y + 5
}

// ─── SECCIÓN 3: Tabla de EPP ──────────────────────────────────────────────────
function dibujarTablaEPP(doc, yInicio, eppItems) {
  // Título sección
  doc.setFillColor(...C.azul)
  doc.rect(ML, yInicio, CW, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.blanco)
  doc.text('ELEMENTOS DE PROTECCIÓN PERSONAL ENTREGADOS', ML + 3, yInicio + 4.2)

  autoTable(doc, {
    startY: yInicio + 7,
    margin: { left: ML, right: MR },
    head: [['N°', 'Elemento de Protección Personal', 'Cant.', 'Vida útil', 'Vence', 'Norma técnica']],
    body: eppItems.map(item => [
      String(item.eppItem).padStart(2, '0'),
      item.eppNombre,
      String(item.cantidad),
      vidaUtilLabel(item.vidaUtilDias),
      item.fechaVencimiento ? formatearFecha(item.fechaVencimiento) : '—',
      item.normaAplicable || '—',
    ]),
    headStyles: {
      fillColor: [51, 77, 140],
      textColor: C.blanco,
      fontStyle: 'bold',
      fontSize:  7.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize:    8,
      textColor:   C.negro,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: C.grisClaro },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 11, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 36 },
    },
    theme: 'grid',
    tableLineColor: C.borde,
    tableLineWidth: 0.2,
  })

  return doc.lastAutoTable.finalY + 5
}

// ─── SECCIÓN 4: Texto legal ───────────────────────────────────────────────────
function dibujarTextoLegal(doc, yInicio) {
  // Cuadro con fondo
  const textoLineas = doc.splitTextToSize(TEXTO_LEGAL_ENTREGA, CW - 6)
  const altoCuadro  = textoLineas.length * 3.8 + 8

  doc.setFillColor(...C.grisClaro)
  doc.setDrawColor(...C.borde)
  doc.setLineWidth(0.3)
  doc.roundedRect(ML, yInicio, CW, altoCuadro, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.azul)
  doc.text('DECLARACIÓN Y CONSTANCIA LEGAL', ML + 3, yInicio + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  doc.setTextColor(...C.grisOsc)
  doc.text(textoLineas, ML + 3, yInicio + 9)

  return yInicio + altoCuadro + 6
}

// ─── SECCIÓN 5: Firmas ────────────────────────────────────────────────────────
async function dibujarFirmas(doc, yInicio, { trabajador, responsable, firmaJpeg }) {
  const mitad     = CW / 2
  const colDer    = ML + mitad + 6
  const alturaFirma = 28
  const altTotal  = alturaFirma + 18

  // Cuadros de firma
  doc.setDrawColor(...C.borde)
  doc.setLineWidth(0.3)
  doc.rect(ML,      yInicio, mitad - 4, altTotal, 'S')
  doc.rect(colDer,  yInicio, mitad - 4, altTotal, 'S')

  // Títulos
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.azul)
  doc.text('FIRMA DEL TRABAJADOR',   ML + 3,      yInicio + 4.5)
  doc.text('RESPONSABLE DE ENTREGA', colDer + 3,  yInicio + 4.5)

  // Imagen de firma (si existe)
  if (firmaJpeg) {
    try {
      doc.addImage(firmaJpeg, 'JPEG', ML + 3, yInicio + 7, mitad - 12, alturaFirma - 8)
    } catch { /* si falla la imagen, continuar */ }
  }

  // Líneas de firma
  const lineY = yInicio + alturaFirma + 3
  doc.setDrawColor(...C.grisOsc)
  doc.setLineWidth(0.4)
  doc.line(ML + 3,      lineY, ML + mitad - 7,       lineY)
  doc.line(colDer + 3,  lineY, colDer + mitad - 7,   lineY)

  // Nombres bajo la línea
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.negro)
  const nomTrab = `${trabajador.nombres} ${trabajador.apellidos}`
  doc.text(doc.splitTextToSize(nomTrab, mitad - 12)[0], ML + 3, lineY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...C.grisOsc)
  doc.text(`CC ${trabajador.cedula}`, ML + 3, lineY + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.negro)
  doc.text(doc.splitTextToSize(responsable || '—', mitad - 12)[0], colDer + 3, lineY + 4)

  return yInicio + altTotal + 5
}

// ─── PIE DE PÁGINA ────────────────────────────────────────────────────────────
function dibujarPie(doc, empresa) {
  const PH = 297
  doc.setFillColor(...C.grisClaro)
  doc.rect(0, PH - 10, PW, 10, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.grisMed)
  doc.text(
    `${SISTEMA.CODIGO_DOCUMENTO} · Versión ${SISTEMA.VERSION_MATRIZ} · ${SISTEMA.NORMATIVA}`,
    ML, PH - 4.5
  )
  doc.text('Página 1 de 1', PW - MR, PH - 4.5, { align: 'right' })
}

// ─── FUNCIÓN PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Genera y descarga el Acta de Entrega de EPP en formato PDF.
 *
 * @param {{ entrega, trabajador, cargo, sede, empresa, eppItems, firmaBase64, responsable, observaciones }}
 */
export async function generarActaEntrega({
  entrega, trabajador, cargo, sede, empresa,
  eppItems, firmaBase64, responsable, observaciones,
}) {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const firma = await prepararFirma(firmaBase64)

  // Secciones
  let y = await dibujarEncabezado(doc, { empresa, entrega })
  y = dibujarDatosTrabajador(doc, y, { trabajador, cargo, sede, empresa, entrega })
  y = dibujarTablaEPP(doc, y, eppItems)

  // Si la sección de firma queda muy abajo, nueva página
  if (y > 220) { doc.addPage(); y = 15 }

  y = dibujarTextoLegal(doc, y)
  await dibujarFirmas(doc, y, { trabajador, responsable, firmaJpeg: firma })
  dibujarPie(doc, empresa)

  // Marcar PDF como generado en la DB (fire-and-forget)
  if (entrega?.id) {
    import('@/db').then(({ entregaDB }) => entregaDB.marcarPdfGenerado(entrega.id)).catch(() => {})
  }

  // Descargar
  const fecha    = (entrega.fechaEntrega || new Date().toISOString()).slice(0, 10)
  const cedula   = trabajador?.cedula || 'sinCedula'
  const filename = `EPP_${cedula}_${fecha}.pdf`
  doc.save(filename)
}
