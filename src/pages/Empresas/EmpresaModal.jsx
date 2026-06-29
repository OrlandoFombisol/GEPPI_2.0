import { useState, useEffect } from 'react'
import { useForm }             from 'react-hook-form'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'
import { DEPARTAMENTOS, CAPITALES } from '@/constants/colombia'
import { SECTORES }                 from '@/constants'
import { validarNIT }               from '@/utils/validators'

const DEFAULTS = {
  nit: '', razonSocial: '', representanteLegal: '',
  direccion: '', departamento: '', ciudad: '',
  sector: '', estado: 'ACTIVO',
}

export default function EmpresaModal({ empresa, onSave, onClose, saving = false }) {
  const isEdit = Boolean(empresa?.id)
  const [primero, setPrimero] = useState(true)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({ defaultValues: { ...DEFAULTS, ...(empresa || {}) } })

  const depto = watch('departamento')

  useEffect(() => {
    if (primero) { setPrimero(false); return }
    if (depto && CAPITALES[depto]) setValue('ciudad', CAPITALES[depto])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depto])

  const onSubmit = async (data) => {
    data.nit = data.nit.replace(/[\s.\-]/g, '')
    await onSave(data)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar: ${empresa.razonSocial}` : 'Nueva empresa'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="empresa-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear empresa'}
          </Button>
        </>
      }
    >
      <form id="empresa-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField label="NIT" required error={errors.nit?.message}>
            <Input
              {...register('nit', {
                required: 'NIT es requerido',
                validate: v => validarNIT(v) || 'Debe tener 8-10 dígitos numéricos',
              })}
              placeholder="900123456"
              error={!!errors.nit}
            />
          </FormField>

          <FormField label="Estado">
            <Select {...register('estado')}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          </FormField>

          <FormField label="Razón social" required error={errors.razonSocial?.message} className="sm:col-span-2">
            <Input
              {...register('razonSocial', {
                required: 'Razón social es requerida',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              placeholder="Corporación para el Fomento del Bienestar Social"
              error={!!errors.razonSocial}
            />
          </FormField>

          <FormField label="Representante legal" required error={errors.representanteLegal?.message} className="sm:col-span-2">
            <Input
              {...register('representanteLegal', {
                required: 'Representante legal es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              placeholder="Nombre completo del representante"
              error={!!errors.representanteLegal}
            />
          </FormField>

          <FormField label="Departamento">
            <Select {...register('departamento')}>
              <option value="">Seleccionar departamento</option>
              {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormField>

          <FormField label="Ciudad / Municipio">
            <Input {...register('ciudad')} placeholder="Bogotá" />
          </FormField>

          <FormField label="Dirección" className="sm:col-span-2">
            <Input {...register('direccion')} placeholder="Calle 10 # 15-30" />
          </FormField>

          <FormField label="Sector económico" className="sm:col-span-2">
            <Select {...register('sector')}>
              <option value="">Seleccionar sector</option>
              {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
