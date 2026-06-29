import { useRef, useState }  from 'react'
import { FirmaCanvas }        from '@/components/firma'
import { Button }             from '@/components/ui'

export default function Paso3Firma({ trabajador, onNext, onAnterior }) {
  const firmaRef  = useRef(null)
  const [hasFirma, setHasFirma] = useState(false)

  const handleSiguiente = () => {
    const base64 = firmaRef.current?.getBase64()
    if (base64) onNext({ firmaBase64: base64 })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Firma digital del trabajador</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          <strong>{trabajador.nombres} {trabajador.apellidos}</strong> debe firmar
          con el dedo o mouse en el recuadro inferior.
        </p>
      </div>

      {/* Componente reutilizable de firma */}
      <FirmaCanvas
        ref={firmaRef}
        altura={220}
        onChange={setHasFirma}
      />

      {/* Texto legal */}
      <p className="text-[11px] text-slate-400 leading-relaxed border border-slate-100 rounded-lg p-3 bg-slate-50">
        Al firmar, el trabajador declara haber recibido los EPP relacionados en perfectas
        condiciones y haber recibido instrucción sobre su correcto uso, conforme al
        Artículo 2.2.4.6.24 del Decreto 1072 de 2015 y la Resolución 0312 de 2019.
      </p>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onAnterior}>← Anterior</Button>
        <Button onClick={handleSiguiente} disabled={!hasFirma}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
