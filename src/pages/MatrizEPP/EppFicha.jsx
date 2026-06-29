import { Shield, Clock, Trash2, AlertTriangle, FileText, Tag, ExternalLink, Package } from 'lucide-react'
import { Modal, Badge, Button }  from '@/components/ui'
import { vidaUtilLabel, vidaUtilVariant } from './utils'

function Bloque({ titulo, icon: Icon, children, span2 = false }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={13} className="text-slate-400" strokeWidth={2} />}
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{titulo}</p>
      </div>
      <div className="text-sm text-slate-800 leading-relaxed">
        {children || <span className="text-slate-400">—</span>}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="sm:col-span-2 border-t border-slate-100" />
}

function abrirPDF(blob, nombre) {
  try {
    const b = new Blob([blob], { type: 'application/pdf' })
    const url = URL.createObjectURL(b)
    const win = window.open(url, '_blank')
    if (!win) {
      const a = document.createElement('a')
      a.href = url
      a.download = nombre || 'ficha-tecnica.pdf'
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  } catch {
    alert('No se pudo abrir la ficha técnica.')
  }
}

export default function EppFicha({ epp, onEdit, onClose }) {
  if (!epp) return null

  const tienePDF = Boolean(epp.fichaTecnicaBlob)

  return (
    <Modal
      open
      onClose={onClose}
      title="Ficha Técnica de EPP"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            MT-SST-005 · Versión {epp.version ?? '007'}
          </span>
          <div className="flex gap-2">
            {tienePDF && (
              <Button variant="outline" onClick={() => abrirPDF(epp.fichaTecnicaBlob, epp.fichaTecnicaNombre)}
                className="flex items-center gap-1.5">
                <ExternalLink size={13} />
                Ver PDF
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            {onEdit && (
              <Button variant="primary" onClick={() => onEdit(epp)}>Editar</Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Cabecera del EPP ── */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100">
          <div className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">
              {String(epp.item).padStart(2, '0')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-snug">{epp.nombre}</h3>
            {epp.categoria && (
              <p className="text-xs text-slate-500 mt-0.5">{epp.categoria}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={epp.estado === 'ACTIVO' ? 'success' : 'neutral'}>
                {epp.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
              </Badge>
              <Badge variant={vidaUtilVariant(epp.vidaUtilDias)}>
                {vidaUtilLabel(epp.vidaUtilDias)}
              </Badge>
              {epp.esDotacion && (
                <Badge variant="warning">
                  <span className="flex items-center gap-1">
                    <Package size={10} />
                    Dotación (Art. 230 CST)
                  </span>
                </Badge>
              )}
              {tienePDF && (
                <Badge variant="info">
                  <span className="flex items-center gap-1">
                    <FileText size={10} />
                    PDF disponible
                  </span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Cuerpo: grid de bloques técnicos ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">

          <Bloque titulo="Descripción técnica" icon={FileText} span2>
            {epp.descripcionFichaTecnica}
          </Bloque>

          <Divider />

          <Bloque titulo="Riesgo asociado" icon={AlertTriangle}>
            {epp.riesgoAsociado}
          </Bloque>

          <Bloque titulo="Partes del cuerpo protegidas" icon={Shield}>
            {epp.partesCuerpo}
          </Bloque>

          <Divider />

          <Bloque titulo="Tiempo de uso recomendado" icon={Clock}>
            {epp.tiempoUsoRecomendado}
          </Bloque>

          <Bloque titulo="Vida útil">
            <p>{epp.vidaUtil || vidaUtilLabel(epp.vidaUtilDias)}</p>
            {epp.vidaUtilDias && (
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {epp.vidaUtilDias} día{epp.vidaUtilDias !== 1 ? 's' : ''}
              </p>
            )}
          </Bloque>

          <Divider />

          <Bloque titulo="Norma técnica aplicable" icon={Tag} span2>
            {epp.normaAplicable}
          </Bloque>

          {epp.marcaSugerida && (
            <Bloque titulo="Marca / Fabricante sugerido" span2>
              {epp.marcaSugerida}
            </Bloque>
          )}

          <Divider />

          <Bloque titulo="Disposición final" icon={Trash2} span2>
            {epp.disposicionFinal}
          </Bloque>

          {tienePDF && (
            <>
              <Divider />
              <div className="sm:col-span-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <FileText size={18} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-800">Ficha técnica PDF disponible</p>
                    <p className="text-xs text-blue-600 truncate">{epp.fichaTecnicaNombre || 'ficha-tecnica.pdf'}</p>
                  </div>
                  <Button variant="outline" size="sm"
                    onClick={() => abrirPDF(epp.fichaTecnicaBlob, epp.fichaTecnicaNombre)}
                    className="flex items-center gap-1.5 flex-shrink-0">
                    <ExternalLink size={13} /> Abrir
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </Modal>
  )
}
