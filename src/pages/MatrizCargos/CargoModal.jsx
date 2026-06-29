import { useForm }    from 'react-hook-form'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'

const NIVELES = ['Operativo', 'Técnico', 'Administrativo', 'Profesional', 'Directivo', 'Otro']

const DEFAULTS = { nombre: '', descripcion: '', nivel: 'Operativo', estado: 'ACTIVO' }

export default function CargoModal({ cargo, onSave, onClose, saving = false }) {
  const isEdit = Boolean(cargo?.id)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { ...DEFAULTS, ...(cargo || {}) },
  })

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar cargo: ${cargo.nombre}` : 'Nuevo cargo'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="cargo-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear cargo'}
          </Button>
        </>
      }
    >
      <form id="cargo-form" onSubmit={handleSubmit(onSave)}>
        <div className="space-y-4">

          <FormField label="Nombre del cargo" required error={errors.nombre?.message}>
            <Input
              {...register('nombre', {
                required: 'El nombre del cargo es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                setValueAs: v => String(v).toUpperCase().trim(),
              })}
              placeholder="ALMACENISTA"
              error={!!errors.nombre}
              className="uppercase"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nivel del cargo">
              <Select {...register('nivel')}>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </FormField>

            <FormField label="Estado">
              <Select {...register('estado')}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Descripción del cargo">
            <textarea
              {...register('descripcion')}
              rows={3}
              placeholder="Responsable del control y despacho de mercancía…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         text-slate-900 placeholder:text-slate-400 bg-white resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500
                         focus:border-primary-500 transition-colors"
            />
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
