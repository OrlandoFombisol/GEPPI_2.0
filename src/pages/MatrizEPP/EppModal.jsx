import { useState }       from 'react'
import { useForm }        from 'react-hook-form'
import { Paperclip, X }  from 'lucide-react'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'

function Textarea({ error, rows = 3, ...props }) {
  const base = [
    'w-full rounded-lg border px-3 py-2 text-sm text-slate-900',
    'placeholder:text-slate-400 bg-white resize-none',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    'disabled:bg-slate-50 disabled:text-slate-400 transition-colors duration-150',
    error ? 'border-red-400' : 'border-slate-300',
  ].join(' ')
  return <textarea rows={rows} className={base} {...props} />
}

function Seccion({ titulo }) {
  return (
    <div className="col-span-2 pt-2 pb-0">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1">
        {titulo}
      </p>
    </div>
  )
}

const DEFAULTS = {
  item: '', nombre: '', categoria: '', normaAplicable: '', marcaSugerida: '',
  partesCuerpo: '', riesgoAsociado: '', descripcionFichaTecnica: '',
  tiempoUsoRecomendado: '', vidaUtil: '', vidaUtilDias: 365,
  disposicionFinal: '', estado: 'ACTIVO', version: 7,
  esDotacion: false,
}

export default function EppModal({ epp, onSave, onClose, saving = false }) {
  const isEdit = Boolean(epp?.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { ...DEFAULTS, ...(epp || {}) },
  })

  const [fichaPDF, setFichaPDF] = useState(null)
  const tienePDFActual = isEdit && Boolean(epp?.fichaTecnicaBlob)

  async function handleSubmitConArchivo(data) {
    let fileData = {}
    if (fichaPDF) {
      const buffer = await fichaPDF.arrayBuffer()
      fileData = {
        fichaTecnicaBlob:   buffer,
        fichaTecnicaNombre: fichaPDF.name,
      }
    }
    onSave({ ...data, ...fileData })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar EPP #${epp.item}: ${epp.nombre}` : 'Nuevo EPP — Ficha técnica'}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="epp-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear EPP'}
          </Button>
        </>
      }
    >
      <form id="epp-form" onSubmit={handleSubmit(handleSubmitConArchivo)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* ── Identificación ── */}
          <Seccion titulo="Identificación" />

          <FormField label="Ítem N°" required error={errors.item?.message}>
            <Input
              type="number"
              {...register('item', {
                required: 'Número de ítem es requerido',
                min: { value: 1,  message: 'Mínimo 1' },
                max: { value: 99, message: 'Máximo 99' },
                valueAsNumber: true,
              })}
              placeholder="1"
              error={!!errors.item}
            />
          </FormField>

          <FormField label="Estado">
            <Select {...register('estado')}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          </FormField>

          <FormField label="Nombre del EPP" required error={errors.nombre?.message} className="sm:col-span-2">
            <Input
              {...register('nombre', {
                required: 'Nombre es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              placeholder="Mascarilla tapaboca en antifluido"
              error={!!errors.nombre}
            />
          </FormField>

          <FormField label="Categoría / Parte del cuerpo">
            <Input {...register('categoria')} placeholder="Respiratoria, extremidades…" />
          </FormField>

          <FormField label="Partes del cuerpo protegidas">
            <Input {...register('partesCuerpo')} placeholder="Mucosas, vía aérea" />
          </FormField>

          <FormField label="Norma técnica aplicable" className="sm:col-span-2">
            <Input {...register('normaAplicable')} placeholder="NTC 2561, ANSI Z89.1, EN 388…" />
          </FormField>

          {/* ── Dotación ── */}
          <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <input
              id="esDotacion"
              type="checkbox"
              {...register('esDotacion')}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 accent-amber-500"
            />
            <label htmlFor="esDotacion" className="text-sm font-medium text-amber-800 cursor-pointer select-none">
              Este EPP es <strong>dotación</strong> — se renueva cada 4 meses por ley (Art. 230 CST).
              Las alertas de vencimiento serán diferenciadas.
            </label>
          </div>

          {/* ── Descripción técnica ── */}
          <Seccion titulo="Descripción técnica" />

          <FormField label="Descripción de la ficha técnica" className="sm:col-span-2">
            <Textarea
              {...register('descripcionFichaTecnica')}
              rows={3}
              placeholder="Material, composición, características físicas del EPP…"
            />
          </FormField>

          <FormField label="Riesgo asociado" className="sm:col-span-2">
            <Textarea
              {...register('riesgoAsociado')}
              rows={2}
              placeholder="Describe los riesgos que mitiga este EPP…"
            />
          </FormField>

          {/* ── Uso y vida útil ── */}
          <Seccion titulo="Uso y vida útil" />

          <FormField label="Vida útil (días)" required error={errors.vidaUtilDias?.message}>
            <Input
              type="number"
              {...register('vidaUtilDias', {
                required: 'Vida útil en días es requerida',
                min: { value: 1, message: 'Mínimo 1 día' },
                valueAsNumber: true,
              })}
              placeholder="365"
              error={!!errors.vidaUtilDias}
            />
          </FormField>

          <FormField label="Descripción de vida útil">
            <Input {...register('vidaUtil')} placeholder="Uso y desecho diario / Cada 3 meses…" />
          </FormField>

          <FormField label="Tiempo de uso recomendado" className="sm:col-span-2">
            <Textarea
              {...register('tiempoUsoRecomendado')}
              rows={2}
              placeholder="Mientras se tenga contacto con…"
            />
          </FormField>

          <FormField label="Disposición final" className="sm:col-span-2">
            <Textarea
              {...register('disposicionFinal')}
              rows={2}
              placeholder="Cómo desechar o retornar el EPP al final de su vida útil…"
            />
          </FormField>

          {/* ── Ficha técnica PDF ── */}
          <Seccion titulo="Ficha técnica (documento PDF)" />

          <div className="sm:col-span-2">
            {tienePDFActual && !fichaPDF && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
                Ya hay una ficha técnica cargada: <strong>{epp.fichaTecnicaNombre || 'ficha.pdf'}</strong>.
                Sube un nuevo archivo para reemplazarla.
              </p>
            )}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                fichaPDF
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-700',
              ].join(' ')}>
                <Paperclip size={14} />
                {fichaPDF ? fichaPDF.name : 'Seleccionar PDF'}
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => setFichaPDF(e.target.files?.[0] || null)}
              />
              {fichaPDF && (
                <button type="button" onClick={() => setFichaPDF(null)}
                  className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={15} />
                </button>
              )}
            </label>
            <p className="text-xs text-slate-400 mt-1.5">
              Sube la ficha técnica del fabricante en formato PDF (máx. 5 MB).
            </p>
          </div>

          {/* ── Control del documento ── */}
          <Seccion titulo="Control del documento" />

          <FormField label="Versión">
            <Input
              type="number"
              {...register('version', { min: 1, valueAsNumber: true })}
              placeholder="7"
            />
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
