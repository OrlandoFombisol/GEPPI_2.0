import { useEffect }        from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ArrowDownCircle, SlidersHorizontal } from 'lucide-react'
import { Modal, FormField, Input, Select, Button } from '@/components/ui'
import { TIPO_MOVIMIENTO }                         from '@/constants'

const TIPOS = [
  { value: TIPO_MOVIMIENTO.ENTRADA, label: 'Entrada (compra / recepción)', icon: ArrowDownCircle },
  { value: TIPO_MOVIMIENTO.AJUSTE,  label: 'Ajuste de inventario',          icon: SlidersHorizontal },
]

export default function MovimientoModal({
  registro,
  eppNombre,
  sedeNombre,
  epps   = [],
  sedes  = [],
  empresas = [],
  onSave,
  onClose,
  saving = false,
}) {
  const esNuevo    = !registro
  const stockActual = registro?.stockActual ?? 0

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      eppId:          registro?.eppId   ? String(registro.eppId)  : '',
      sedeId:         registro?.sedeId  ? String(registro.sedeId) : '',
      empresaId:      '',
      tipo:           TIPO_MOVIMIENTO.ENTRADA,
      cantidad:       '',
      nuevoStock:     '',
      proveedor:      '',
      costoUnitario:  '',
      motivo:         '',
      observacion:    '',
    },
  })

  const tipoWatch       = useWatch({ control, name: 'tipo' })
  const nuevoStockWatch = useWatch({ control, name: 'nuevoStock' })
  const empresaWatch    = watch('empresaId')
  const esEntrada       = tipoWatch === TIPO_MOVIMIENTO.ENTRADA
  const esAjuste        = tipoWatch === TIPO_MOVIMIENTO.AJUSTE

  // Filtrar sedes por empresa seleccionada cuando es nuevo
  const sedesFiltradas = esNuevo && empresaWatch
    ? sedes.filter(s => s.estado === 'ACTIVO' && s.empresaId === Number(empresaWatch))
    : sedes.filter(s => s.estado === 'ACTIVO')

  // Resetear sedeId al cambiar empresa
  useEffect(() => {
    if (esNuevo) setValue('sedeId', '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaWatch])

  const deltaAjuste = esAjuste && nuevoStockWatch !== ''
    ? Number(nuevoStockWatch) - stockActual
    : null

  // Nombre de sede para mostrar (si no hay sede, mostrar empresa)
  const sedeDisplay = sedeNombre || (
    registro?.empresaId
      ? empresas.find(e => e.id === registro.empresaId)?.razonSocial
      : ''
  )

  const onSubmit = async (data) => {
    let delta, tipo, meta = {}

    if (data.tipo === TIPO_MOVIMIENTO.ENTRADA) {
      delta = Number(data.cantidad)
      tipo  = TIPO_MOVIMIENTO.ENTRADA
      meta  = {
        proveedor:     data.proveedor     || null,
        costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : null,
        observacion:   data.observacion   || null,
      }
    } else {
      delta = Number(data.nuevoStock) - stockActual
      tipo  = TIPO_MOVIMIENTO.AJUSTE
      meta  = {
        motivo:      data.motivo      || null,
        observacion: data.observacion || null,
      }
    }

    await onSave({
      eppId:     esNuevo ? Number(data.eppId)     : registro.eppId,
      sedeId:    esNuevo ? (Number(data.sedeId) || null) : registro.sedeId,
      empresaId: esNuevo ? (Number(data.empresaId) || null) : (registro.empresaId || null),
      delta, tipo, meta,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={esNuevo ? 'Registrar entrada de inventario' : `Movimiento — ${eppNombre}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form="mov-form" loading={saving}>
            Registrar movimiento
          </Button>
        </>
      }
    >
      <form id="mov-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">

          {/* Contexto EPP × Sede (readonly o selects si es nuevo) */}
          {esNuevo ? (
            <div className="space-y-3">
              {/* Empresa (nueva entrada) */}
              <FormField label="Empresa">
                <Select {...register('empresaId')}>
                  <option value="">Todas las empresas / Sin empresa</option>
                  {empresas.filter(e => e.estado === 'ACTIVO').map(e => (
                    <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="EPP" required error={errors.eppId?.message}>
                  <Select {...register('eppId', { required: 'Selecciona un EPP' })} error={!!errors.eppId}>
                    <option value="">Seleccionar EPP</option>
                    {epps.map(e => (
                      <option key={e.id} value={String(e.id)}>
                        {String(e.item).padStart(2,'0')}. {e.nombre}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Sede">
                  <Select {...register('sedeId')}>
                    <option value="">Sin sede específica</option>
                    {sedesFiltradas.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.nombre}</option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{eppNombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">{sedeDisplay || 'Sin sede'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Stock actual</p>
                <p className="text-2xl font-black tabular-nums text-slate-800">{stockActual}</p>
              </div>
            </div>
          )}

          {/* Tipo de movimiento */}
          <FormField label="Tipo de movimiento" required>
            <Select {...register('tipo')}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormField>

          {/* Campos según tipo */}
          {esEntrada && (
            <>
              <FormField label="Cantidad a ingresar" required error={errors.cantidad?.message}>
                <Input
                  type="number"
                  {...register('cantidad', {
                    required: 'La cantidad es requerida',
                    min: { value: 1, message: 'Mínimo 1 unidad' },
                    valueAsNumber: true,
                  })}
                  placeholder="50"
                  error={!!errors.cantidad}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Proveedor">
                  <Input {...register('proveedor')} placeholder="Nombre del proveedor" />
                </FormField>
                <FormField label="Costo unitario (COP)">
                  <Input
                    type="number"
                    {...register('costoUnitario', { min: 0, valueAsNumber: true })}
                    placeholder="15000"
                  />
                </FormField>
              </div>
            </>
          )}

          {esAjuste && (
            <>
              <FormField label="Stock corregido (cantidad final)" required error={errors.nuevoStock?.message}>
                <Input
                  type="number"
                  {...register('nuevoStock', {
                    required: 'El stock corregido es requerido',
                    min: { value: 0, message: 'No puede ser negativo' },
                    valueAsNumber: true,
                  })}
                  placeholder={String(stockActual)}
                  error={!!errors.nuevoStock}
                />
              </FormField>
              {deltaAjuste !== null && (
                <div className={[
                  'text-sm font-medium px-3 py-2 rounded-lg',
                  deltaAjuste > 0  ? 'bg-green-50 text-green-800'  :
                  deltaAjuste < 0  ? 'bg-red-50 text-red-800'      :
                  'bg-slate-50 text-slate-600',
                ].join(' ')}>
                  {deltaAjuste === 0 ? 'Sin cambio' :
                   deltaAjuste > 0  ? `+${deltaAjuste} unidades` :
                   `${deltaAjuste} unidades`}
                </div>
              )}
              <FormField label="Motivo del ajuste" required error={errors.motivo?.message}>
                <Input
                  {...register('motivo', { required: 'El motivo es requerido para un ajuste' })}
                  placeholder="Conteo físico, merma, error anterior…"
                  error={!!errors.motivo}
                />
              </FormField>
            </>
          )}

          <FormField label="Observación (opcional)">
            <Input {...register('observacion')} placeholder="Nota adicional…" />
          </FormField>

        </div>
      </form>
    </Modal>
  )
}
