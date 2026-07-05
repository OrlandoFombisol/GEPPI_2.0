import { useEffect, useState } from 'react'
import { useForm }             from 'react-hook-form'
import { UserCheck }           from 'lucide-react'
import { Modal, FormField, Input, Select, DateInput, Button } from '@/components/ui'
import { validarCedula }       from '@/utils/validators'

const DEFAULTS = {
  cedula: '', nombres: '', apellidos: '',
  cargoId: '', sedeId: '', empresaId: '',
  fechaIngreso: '', genero: '', estado: 'ACTIVO',
}

export default function TrabajadorModal({
  trabajador, cargos = [], sedes = [], empresas = [],
  onSave, onClose, saving = false,
}) {
  const isEdit = Boolean(trabajador?.id)
  const [primero, setPrimero] = useState(true)

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...DEFAULTS,
      ...(trabajador
        ? {
            ...trabajador,
            cargoId:   String(trabajador.cargoId   ?? ''),
            sedeId:    String(trabajador.sedeId    ?? ''),
            empresaId: String(trabajador.empresaId ?? ''),
          }
        : {}),
    },
  })

  const sedeWatch    = watch('sedeId')
  const empresaWatch = watch('empresaId')

  // Auto-derivar empresaId cuando cambia la sede
  useEffect(() => {
    if (primero) { setPrimero(false); return }
    if (sedeWatch) {
      const sede = sedes.find(s => s.id === Number(sedeWatch))
      if (sede) setValue('empresaId', String(sede.empresaId))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeWatch])

  // Sedes filtradas por empresa seleccionada
  const sedesFiltradas = empresaWatch
    ? sedes.filter(s => s.estado === 'ACTIVO' && s.empresaId === Number(empresaWatch))
    : sedes.filter(s => s.estado === 'ACTIVO')

  const onSubmit = async (data) => {
    await onSave({
      ...data,
      cargoId:   Number(data.cargoId)   || null,
      sedeId:    data.sedeId ? Number(data.sedeId) : null,
      empresaId: Number(data.empresaId) || null,
      cedula:    String(data.cedula).trim(),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit
        ? `Editar: ${trabajador.nombres} ${trabajador.apellidos}`
        : 'Nuevo trabajador'}
      icon={UserCheck} color="#1B62CC"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="trab-form" loading={saving}>
            {isEdit ? 'Guardar cambios' : 'Crear trabajador'}
          </Button>
        </>
      }
    >
      <form id="trab-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Cédula */}
          <FormField label="Número de cédula" required error={errors.cedula?.message}>
            <Input
              {...register('cedula', {
                required: 'Cédula es requerida',
                validate: v => validarCedula(v) || 'Cédula inválida (6-10 dígitos)',
              })}
              placeholder="12345678"
              error={!!errors.cedula}
              disabled={isEdit}
            />
          </FormField>

          {/* Género */}
          <FormField label="Género">
            <Select {...register('genero')}>
              <option value="">Sin especificar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </Select>
          </FormField>

          {/* Nombres */}
          <FormField label="Nombres" required error={errors.nombres?.message}>
            <Input
              {...register('nombres', {
                required: 'Nombres son requeridos',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              placeholder="Juan Carlos"
              error={!!errors.nombres}
            />
          </FormField>

          {/* Apellidos */}
          <FormField label="Apellidos" required error={errors.apellidos?.message}>
            <Input
              {...register('apellidos', {
                required: 'Apellidos son requeridos',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              placeholder="Martínez Gómez"
              error={!!errors.apellidos}
            />
          </FormField>

          {/* Empresa */}
          <FormField label="Empresa" required error={errors.empresaId?.message}>
            <Select
              {...register('empresaId', { required: 'Empresa es requerida' })}
              error={!!errors.empresaId}
            >
              <option value="">Seleccionar empresa</option>
              {empresas.filter(e => e.estado === 'ACTIVO').map(e => (
                <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>
              ))}
            </Select>
          </FormField>

          {/* Sede (opcional) */}
          <FormField label="Sede / UT (opcional)">
            <Select {...register('sedeId')}>
              <option value="">Sin sede asignada</option>
              {sedesFiltradas.map(s => (
                <option key={s.id} value={String(s.id)}>{s.nombre}</option>
              ))}
            </Select>
          </FormField>

          {/* Cargo */}
          <FormField label="Cargo" required error={errors.cargoId?.message}>
            <Select
              {...register('cargoId', { required: 'Cargo es requerido' })}
              error={!!errors.cargoId}
            >
              <option value="">Seleccionar cargo</option>
              {cargos.filter(c => c.estado === 'ACTIVO').map(c => (
                <option key={c.id} value={String(c.id)}>{c.nombre}</option>
              ))}
            </Select>
          </FormField>

          {/* Fecha de ingreso */}
          <FormField label="Fecha de ingreso" required error={errors.fechaIngreso?.message}>
            <DateInput
              {...register('fechaIngreso', { required: 'Fecha de ingreso es requerida' })}
              error={!!errors.fechaIngreso}
            />
          </FormField>

          {/* Estado */}
          <FormField label="Estado" className="sm:col-span-2">
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
