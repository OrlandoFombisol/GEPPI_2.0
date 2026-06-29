import { useState }  from 'react'
import { FileDown }  from 'lucide-react'
import {
  entregaDB, trabajadorDB, cargoDB,
  sedeDB, empresaDB, detalleEntregaDB, eppDB, firmaDB,
} from '@/db'
import { generarActaEntrega } from '@/services/pdfGenerator'
import { Button }             from '@/components/ui'

/**
 * Botón que carga los datos necesarios desde la DB y genera el acta PDF.
 *
 * @prop {number}  entregaId    — ID de la entrega
 * @prop {string}  [firmaBase64] — firma ya disponible en memoria (evita re-fetch)
 * @prop {string}  [variant]    — variante del botón
 * @prop {string}  [size]
 * @prop {string}  [className]
 * @prop {string}  [label]      — texto del botón (default "Descargar PDF")
 */
export default function BotonPDF({
  entregaId,
  firmaBase64:  firmaMemoria = null,
  variant       = 'outline',
  size          = 'md',
  className     = '',
  label         = 'Descargar PDF',
}) {
  const [generando, setGenerando] = useState(false)
  const [error,     setError]     = useState(null)

  const handleClick = async () => {
    setGenerando(true)
    setError(null)
    try {
      // 1. Cargar entrega principal
      const entrega = await entregaDB.getById(Number(entregaId))
      if (!entrega) throw new Error('Entrega no encontrada.')

      // 2. Cargar datos relacionados en paralelo
      const [trabajador, cargo, sede, empresa, detalles, firma] = await Promise.all([
        trabajadorDB.getById(entrega.trabajadorId),
        cargoDB.getById(entrega.cargoId),
        sedeDB.getById(entrega.sedeId),
        empresaDB.getById(entrega.empresaId),
        detalleEntregaDB.getPorEntrega(entrega.id),
        firmaDB.getPorEntrega(entrega.id),
      ])

      // 3. Enriquecer detalles con info del EPP
      const todosEPP = await eppDB.getAll()
      const eppMap   = Object.fromEntries((todosEPP || []).map(e => [e.id, e]))
      const eppItems = (detalles || []).map(d => ({
        ...d,
        eppItem:          eppMap[d.eppId]?.item           || 0,
        eppNombre:        eppMap[d.eppId]?.nombre         || '—',
        normaAplicable:   eppMap[d.eppId]?.normaAplicable || '',
        disposicionFinal: d.disposicionFinal || eppMap[d.eppId]?.disposicionFinal || '',
        vidaUtil:         eppMap[d.eppId]?.vidaUtil        || '',
      }))

      // 4. Generar PDF
      await generarActaEntrega({
        entrega,
        trabajador:  trabajador  || {},
        cargo:       cargo       || {},
        sede:        sede        || {},
        empresa:     empresa     || {},
        eppItems,
        firmaBase64: firmaMemoria || firma?.firmaBase64 || null,
        responsable: entrega.responsableNombre || '',
        observaciones: entrega.observaciones || '',
      })
    } catch (err) {
      console.error('[GEPPI PDF]', err)
      setError(err.message || 'Error al generar el PDF.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className={['inline-flex flex-col items-center gap-1', className].join(' ')}>
      <Button
        variant={variant}
        size={size}
        loading={generando}
        iconLeft={generando ? undefined : FileDown}
        onClick={handleClick}
        disabled={generando}
      >
        {generando ? 'Generando PDF…' : label}
      </Button>
      {error && (
        <p className="text-xs text-red-600 text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}
