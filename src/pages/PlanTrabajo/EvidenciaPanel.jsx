import { useState, useEffect, useRef } from 'react'
import { X, Upload, FileText, FileSpreadsheet, Image as ImageIcon, Trash2, ExternalLink, Paperclip, Loader2 } from 'lucide-react'
import { evidenciaDB } from '@/db'

const TIPOS_LABEL = {
  pdf:    { label: 'PDF',    Icon: FileText,        color: 'text-red-600',    bg: 'bg-red-50 border-red-200'    },
  excel:  { label: 'Excel',  Icon: FileSpreadsheet, color: 'text-green-700',  bg: 'bg-green-50 border-green-200'},
  imagen: { label: 'Imagen', Icon: ImageIcon,       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'  },
}

function formatBytes(b) {
  if (!b) return ''
  if (b < 1024)       return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

function FilaEvidencia({ ev, onVer, onEliminar }) {
  const [verCargando, setVerCargando] = useState(false)
  const [eliminando,  setEliminando]  = useState(false)
  const meta = TIPOS_LABEL[ev.tipo] || TIPOS_LABEL.pdf
  const Icon = meta.Icon

  const handleVer = async () => {
    setVerCargando(true)
    try { await onVer(ev) } finally { setVerCargando(false) }
  }
  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar "${ev.nombre}"? Esta acción no se puede deshacer.`)) return
    setEliminando(true)
    try { await onEliminar(ev) } finally { setEliminando(false) }
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${meta.bg}`}>
      <div className={`w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate" title={ev.nombre}>{ev.nombre}</p>
        <p className="text-xs text-slate-400">{meta.label} · {formatBytes(ev.tamañoBytes)} · {ev.fechaSubida ? new Date(ev.fechaSubida).toLocaleDateString('es-CO') : ''}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={handleVer} disabled={verCargando}
          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-white transition-colors"
          title="Ver / descargar">
          {verCargando ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
        </button>
        <button onClick={handleEliminar} disabled={eliminando}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-colors"
          title="Eliminar evidencia">
          {eliminando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  )
}

export default function EvidenciaPanel({ actividad, usuarioId, onClose }) {
  const [evidencias, setEvidencias] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [subiendo,   setSubiendo]   = useState(false)
  const [error,      setError]      = useState('')
  const fileRef = useRef(null)

  useEffect(() => { cargar() }, [actividad.id])

  async function cargar() {
    setLoading(true)
    try {
      const data = await evidenciaDB.getByPlan(actividad.id)
      setEvidencias(data || [])
    } finally { setLoading(false) }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSubiendo(true)
    try {
      await evidenciaDB.upload(actividad.id, file, usuarioId)
      await cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleVer(ev) {
    const url = await evidenciaDB.getUrl(ev.storagePath)
    window.open(url, '_blank')
  }

  async function handleEliminar(ev) {
    await evidenciaDB.remove(ev.id, ev.storagePath)
    setEvidencias(prev => prev.filter(e => e.id !== ev.id))
  }

  const lleno = evidencias.length >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
              <Paperclip size={16} className="text-primary-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">Evidencias</p>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{actividad.actividad}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : evidencias.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Paperclip size={28} className="text-slate-300" strokeWidth={1.3} />
              <p className="text-sm text-slate-400">Sin evidencias registradas</p>
              <p className="text-xs text-slate-300">Sube el primer archivo de soporte</p>
            </div>
          ) : (
            evidencias.map(ev => (
              <FilaEvidencia key={ev.id} ev={ev} onVer={handleVer} onEliminar={handleEliminar} />
            ))
          )}
        </div>

        {/* Upload */}
        <div className="p-5 border-t border-slate-100 space-y-3">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <input ref={fileRef} type="file" onChange={handleFile} className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.xlsx,.xls"
            disabled={subiendo || lleno}
          />

          {lleno ? (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              Límite alcanzado — máximo 5 evidencias por actividad
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={subiendo}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-primary-400 hover:text-primary-700 transition-colors disabled:opacity-50"
            >
              {subiendo
                ? <><Loader2 size={16} className="animate-spin" /> Subiendo…</>
                : <><Upload size={16} /> Subir evidencia</>}
            </button>
          )}

          <p className="text-center text-xs text-slate-400">
            Máx. 5 MB por archivo · JPG, PNG, PDF, Excel · Máx. 5 archivos por actividad
          </p>
        </div>
      </div>
    </div>
  )
}
