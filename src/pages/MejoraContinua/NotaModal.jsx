import { useForm } from 'react-hook-form'
import { NotebookPen } from 'lucide-react'
import { Modal, FormField, Input, Textarea, Select, DateInput, Button } from '@/components/ui'
import { TIPO_NOTA_MEJORA, TIPO_NOTA_MEJORA_LABEL } from '@/constants'

const DEFAULTS = {
  fecha:   new Date().toISOString().slice(0, 10),
  tipo:    TIPO_NOTA_MEJORA.ANALISIS,
  titulo:  '',
  detalle: '',
}

export default function NotaModal({ onSave, onClose, saving = false }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: DEFAULTS,
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Agregar nota de mejora"
      icon={NotebookPen} color="#8B5CF6"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="nota-mejora-form" loading={saving}>
            Guardar nota
          </Button>
        </>
      }
    >
      <form id="nota-mejora-form" onSubmit={handleSubmit(onSave)}>
        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha" required error={errors.fecha?.message}>
              <DateInput
                {...register('fecha', { required: 'La fecha es requerida' })}
                error={!!errors.fecha}
              />
            </FormField>

            <FormField label="Tipo" required>
              <Select {...register('tipo')}>
                {Object.values(TIPO_NOTA_MEJORA).map(t => (
                  <option key={t} value={t}>{TIPO_NOTA_MEJORA_LABEL[t]}</option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label="Título" required error={errors.titulo?.message}>
            <Input
              {...register('titulo', {
                required: 'El título es requerido',
                minLength: { value: 3,   message: 'Mínimo 3 caracteres' },
                maxLength: { value: 140, message: 'Máximo 140 caracteres' },
              })}
              placeholder="Ej: Capacitación al equipo de SST sobre el nuevo módulo"
              error={!!errors.titulo}
            />
          </FormField>

          <FormField label="Detalle" error={errors.detalle?.message} hint="Opcional, hasta 1000 caracteres">
            <Textarea
              {...register('detalle', {
                maxLength: { value: 1000, message: 'Máximo 1000 caracteres' },
              })}
              rows={4}
              placeholder="Describe brevemente en qué consistió…"
              error={!!errors.detalle}
            />
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
