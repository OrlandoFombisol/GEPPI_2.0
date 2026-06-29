import { useForm }  from 'react-hook-form'
import { Modal, FormField, Input, Textarea, Select, Button } from '@/components/ui'

const MESES = [
  { v: 1,  l: 'Enero' },  { v: 2,  l: 'Febrero' }, { v: 3,  l: 'Marzo' },
  { v: 4,  l: 'Abril' },  { v: 5,  l: 'Mayo' },    { v: 6,  l: 'Junio' },
  { v: 7,  l: 'Julio' },  { v: 8,  l: 'Agosto' },  { v: 9,  l: 'Septiembre' },
  { v: 10, l: 'Octubre' },{ v: 11, l: 'Noviembre' },{ v: 12, l: 'Diciembre' },
]

const AÑO_ACTUAL = new Date().getFullYear()
const AÑOS = [AÑO_ACTUAL - 1, AÑO_ACTUAL, AÑO_ACTUAL + 1]

const DEFAULTS = {
  actividad:    '',
  empresa:      '',
  objetivo:     '',
  metas:        '',
  estado:       'PENDIENTE',
  mesEjecucion: new Date().getMonth() + 1,
  año:          AÑO_ACTUAL,
  responsable:  '',
  observaciones:'',
}

export default function ActividadModal({ actividad, empresas = [], onSave, onClose, saving = false }) {
  const isEdit = Boolean(actividad?.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ...DEFAULTS,
      ...(actividad || {}),
      mesEjecucion: actividad?.mesEjecucion ?? (new Date().getMonth() + 1),
      año:          actividad?.año          ?? AÑO_ACTUAL,
    },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Editar actividad' : 'Nueva actividad'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="actividad-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear actividad'}
          </Button>
        </>
      }
    >
      <form id="actividad-form" onSubmit={handleSubmit(onSave)}>
        <div className="space-y-4">

          <FormField label="Actividad" required error={errors.actividad?.message}>
            <Input
              {...register('actividad', { required: 'Requerido', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
              placeholder="Ej: Capacitación en uso y mantenimiento de EPP"
              error={!!errors.actividad}
            />
          </FormField>

          <FormField label="Empresa" required error={errors.empresa?.message}>
            {empresas.length > 0 ? (
              <Select {...register('empresa', { required: 'Requerido' })}>
                <option value="">Seleccionar empresa…</option>
                {empresas.map(e => (
                  <option key={e.id} value={e.razonSocial}>{e.razonSocial}</option>
                ))}
              </Select>
            ) : (
              <Input
                {...register('empresa', { required: 'Requerido' })}
                placeholder="Nombre de la empresa"
                error={!!errors.empresa}
              />
            )}
          </FormField>

          <FormField label="Objetivo" required error={errors.objetivo?.message}>
            <Textarea
              {...register('objetivo', { required: 'Requerido' })}
              rows={2}
              placeholder="Ej: Garantizar el correcto uso de los EPP por parte de los trabajadores"
            />
          </FormField>

          <FormField label="Metas" required error={errors.metas?.message}>
            <Textarea
              {...register('metas', { required: 'Requerido' })}
              rows={2}
              placeholder="Ej: 100% de trabajadores capacitados en el primer semestre"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Estado">
              <Select {...register('estado')}>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EJECUTADO">Ejecutado</option>
              </Select>
            </FormField>

            <FormField label="Mes de ejecución">
              <Select {...register('mesEjecucion', { valueAsNumber: true })}>
                {MESES.map(m => (
                  <option key={m.v} value={m.v}>{m.l}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Año">
              <Select {...register('año', { valueAsNumber: true })}>
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </FormField>
          </div>

          <FormField label="Responsable">
            <Input
              {...register('responsable')}
              placeholder="Nombre del responsable"
            />
          </FormField>

          <FormField label="Observaciones">
            <Textarea
              {...register('observaciones')}
              rows={2}
              placeholder="Observaciones adicionales…"
            />
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
