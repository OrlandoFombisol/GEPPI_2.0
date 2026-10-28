import { createClient } from '@supabase/supabase-js'

// En el servidor de la empresa la API vive en la misma dirección que las pantallas
// (geepi.fombisol.com.co/auth/v1, /rest/v1, /storage/v1): se compila con VITE_SUPABASE_URL=mismo-origen
const configurada = import.meta.env.VITE_SUPABASE_URL
const url = configurada === 'mismo-origen' ? window.location.origin : configurada
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('[GEPPI] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env')
}

export const supabase = createClient(url, key)
export default supabase
