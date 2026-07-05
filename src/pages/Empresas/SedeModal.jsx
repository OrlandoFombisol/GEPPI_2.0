import { useState, useEffect } from 'react'
import { useForm }             from 'react-hook-form'
import { MapPin }              from 'lucide-react'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'
import { DEPARTAMENTOS, CAPITALES } from '@/constants/colombia'
import { validarTelefono, validarEmail } from '@/utils/validators'

const DEFAULTS = {
  empresaId: '', nombre: '', direccion: '',
  departamento: '', municipio: '', telefono: '',
  email: '', responsableSst: '', estado: 'ACTIVO',
}

export default function SedeModal({ sede, empresas = [], onSave, onClose, saving = false }) {
  const isEdit = Boolean(sede?.id)
  const [primero, setPrimero] = useState(true)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...DEFAULTS,
      // Pre-seleccionar la única empresa si solo hay una
      empresaId: empresas.length === 1 ? String(empresas[0].id) : '',
      ...(sede
        ? { ...sede, empresaId: String(sede.empresaId ?? '') }
        : {}),
    },
  })

  const depto = watch('departamento')

  useEffect(() => {
    if (primero) { setPrimero(false); return }
    if (depto && CAPITALES[depto]) setValue('municipio', CAPITALES[depto])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depto])

  const onSubmit = async (data) => {
    await onSave({ ...data, empresaId: Number(data.empresaId) })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Editar sede: ${sede.nombre}` : 'Nueva sede'}
      icon={MapPin} color="#083278"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="sede-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear sede'}
          </Button>
        </>
      }
    >
      <form id="sede-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Empresa */}
          <FormField label="Empresa" required error={errors.empresaId?.message} className="sm:col-span-2">
            <Select
              {...register('empresaId', { required: 'Selecciona una empresa' })}
              error={!!errors.empresaId}
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map(e => (
                <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>
              ))}
            </Select>
          </FormField>

          {/* Nombre sede */}
          <FormField label="Nombre de la sede" required error={errors.nombre?.message} className="sm:col-span-2">
            <Input
              {...register('nombre', {
                required: 'Nombre de la sede es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              placeholder="Sede Principal Bogotá"
              error={!!errors.nombre}
            />
          </FormField>

          {/* Departamento */}
          <FormField label="Departamento">
            <Select {...register('departamento')}>
              <option value="">Seleccionar departamento</option>
              {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </FormField>

          {/* Municipio */}
          <FormField label="Municipio">
            <Input {...register('municipio')} placeholder="Bogotá" />
          </FormField>

          {/* Dirección */}
          <FormField label="Dirección" className="sm:col-span-2">
            <Input {...register('direccion')} placeholder="Calle 10 # 15-30" />
          </FormField>

          {/* Teléfono */}
          <FormField label="Teléfono" error={errors.telefono?.message}>
            <Input
              {...register('telefono', {
                validate: v => !v || validarTelefono(v) || 'Teléfono inválido (10 dígitos)',
              })}
              placeholder="3001234567"
              error={!!errors.telefono}
            />
          </FormField>

          {/* Correo */}
          <FormField label="Correo de la sede" error={errors.email?.message}>
            <Input
              {...register('email', {
                validate: v => !v || validarEmail(v) || 'Correo inválido',
              })}
              type="email"
              placeholder="sede@empresa.com"
              error={!!errors.email}
            />
          </FormField>

          {/* Responsable SST */}
          <FormField label="Responsable SST" className="sm:col-span-2">
            <Input {...register('responsableSst')} placeholder="Nombre del responsable SST" />
          </FormField>

          {/* Estado */}
          <FormField label="Estado">
            <Select {...register('estado')}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
