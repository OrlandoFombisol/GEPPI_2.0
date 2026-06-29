import { useForm }   from 'react-hook-form'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'
import { MODULO, SISTEMA }                         from '@/constants'

const MODULOS_OPTS = [
  { value: '',                       label: 'General'           },
  { value: MODULO.MATRIZ_EPP,        label: 'Matriz EPP'        },
  { value: MODULO.MATRIZ_CARGOS,     label: 'Matriz por Cargos' },
  { value: MODULO.INVENTARIO,        label: 'Inventario'        },
  { value: MODULO.ENTREGAS,          label: 'Entregas'          },
  { value: MODULO.TRABAJADORES,      label: 'Trabajadores'      },
  { value: MODULO.CONFIGURACION,     label: 'Configuración'     },
]

const DEFAULTS = {
  versionNueva:     '',
  codigoDocumento:  SISTEMA.CODIGO_DOCUMENTO,
  modulo:           MODULO.MATRIZ_EPP,
  fecha:            new Date().toISOString().slice(0, 10),
  descripcion:      '',
  responsable:      '',
  cargoResponsable: '',
}

export default function CambioModal({ onSave, onClose, saving = false }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: DEFAULTS,
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar nueva versión"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="cambio-form" loading={saving}>
            Registrar cambio
          </Button>
        </>
      }
    >
      <form id="cambio-form" onSubmit={handleSubmit(onSave)}>
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Versión nueva" required error={errors.versionNueva?.message}>
              <Input
                {...register('versionNueva', {
                  required: 'Versión es requerida',
                  minLength: { value: 1, message: 'Mínimo 1 carácter' },
                })}
                placeholder="008"
                error={!!errors.versionNueva}
              />
            </FormField>

            <FormField label="Fecha" required error={errors.fecha?.message}>
              <input
                type="date"
                {...register('fecha', { required: 'Fecha es requerida' })}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm
                           text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código del documento">
              <Input {...register('codigoDocumento')} placeholder="MT-SST-005" />
            </FormField>

            <FormField label="Módulo afectado">
              <Select {...register('modulo')}>
                {MODULOS_OPTS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Descripción del cambio" required error={errors.descripcion?.message}>
            <textarea
              {...register('descripcion', {
                required: 'La descripción es requerida',
                minLength: { value: 5, message: 'Mínimo 5 caracteres' },
              })}
              rows={3}
              placeholder="Describe qué cambió en esta versión del documento…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
                         text-slate-900 placeholder:text-slate-400 bg-white resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
            {errors.descripcion && (
              <p className="text-xs text-red-500 mt-0.5">{errors.descripcion.message}</p>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Responsable" required error={errors.responsable?.message}>
              <Input
                {...register('responsable', { required: 'Responsable es requerido' })}
                placeholder="Nombre del responsable"
                error={!!errors.responsable}
              />
            </FormField>

            <FormField label="Cargo del responsable">
              <Input {...register('cargoResponsable')} placeholder="Profesional SST" />
            </FormField>
          </div>

        </div>
      </form>
    </Modal>
  )
}
