import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const UserContext = createContext(null)

function computarIniciales(nombre) {
  if (!nombre) return '--'
  return nombre.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '--'
}

function perfilAUser(perfil, authUser) {
  if (!perfil) return null
  return {
    id:        perfil.id,
    nombre:    perfil.nombre || authUser?.email || '',
    rol:       perfil.rol    || 'SST',
    email:     perfil.correo || authUser?.email || '',
    iniciales: computarIniciales(perfil.nombre || authUser?.email),
    foto:      null,
  }
}

export function UserProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Escucha cambios de sesión Supabase (login, logout, refresh de token)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await cargarPerfil(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await cargarPerfil(session.user)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(authUser) {
    const { data: perfil } = await supabase
      .from('usuario').select('*').eq('id', authUser.id).single()
    setUser(perfilAUser(perfil, authUser))
  }

  // Login con email + password (Supabase Auth)
  async function loginUser({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await cargarPerfil(data.user)
    return user
  }

  function updateUser(updates) {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      if (updates.nombre) next.iniciales = computarIniciales(updates.nombre)
      return next
    })
  }

  async function logout(navigate) {
    await supabase.auth.signOut()
    setUser(null)
    if (navigate) navigate('/login', { state: { fromLogout: true } })
  }

  const isAdmin = user?.rol === 'ADMINISTRADOR'

  return (
    <UserContext.Provider value={{ user, loading, loginUser, updateUser, logout, isAdmin }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
