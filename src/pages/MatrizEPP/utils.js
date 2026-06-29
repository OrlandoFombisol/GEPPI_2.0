/** Etiqueta legible para la vida útil en días */
export function vidaUtilLabel(dias) {
  if (!dias || dias <= 0) return 'No definida'
  if (dias === 1)   return 'Desecho diario'
  if (dias <= 7)    return `${dias} días`
  if (dias <= 14)   return '2 semanas'
  if (dias <= 30)   return '1 mes'
  if (dias <= 60)   return '2 meses'
  if (dias <= 90)   return '3 meses'
  if (dias <= 120)  return '4 meses'
  if (dias <= 180)  return '6 meses'
  if (dias <= 365)  return '1 año'
  if (dias <= 730)  return '2 años'
  const años = Math.round(dias / 365)
  return `${años} años`
}

/** Variante de Badge según vida útil (corta → rojo, larga → verde) */
export function vidaUtilVariant(dias) {
  if (!dias) return 'neutral'
  if (dias <= 1)   return 'danger'
  if (dias <= 30)  return 'warning'
  if (dias <= 180) return 'info'
  return 'success'
}

/** Color CSS para el número de ítem del EPP */
export function itemColorClass(item) {
  const paleta = [
    'bg-blue-700',   'bg-indigo-700', 'bg-violet-700', 'bg-purple-700',
    'bg-rose-700',   'bg-orange-700', 'bg-amber-700',  'bg-teal-700',
    'bg-cyan-700',   'bg-emerald-700','bg-lime-700',   'bg-sky-700',
  ]
  return paleta[(item - 1) % paleta.length]
}
