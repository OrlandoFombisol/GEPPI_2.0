import { Link } from 'react-router-dom'
import { ShieldOff, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
        <ShieldOff size={28} className="text-slate-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Página no encontrada
      </h1>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        La ruta que buscas no existe en GEPPI. Puede que el módulo esté en construcción
        o que la URL sea incorrecta.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 bg-primary-800 text-white
                   px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900
                   transition-colors"
      >
        <ArrowLeft size={16} />
        Ir al Dashboard
      </Link>
    </div>
  )
}
