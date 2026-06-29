import { createContext, useContext, useState } from 'react'

const UserContext = createContext(null)

function computarIniciales(nombre) {
  if (!nombre) return '--'
  return nombre.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '--'
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('geppi-user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  function loginUser(userData) {
    const u = {
      id:        userData.id,
      nombre:    userData.nombre,
      rol:       userData.rol,
      email:     userData.correo,
      iniciales: computarIniciales(userData.nombre),
      foto:      userData.foto || null,
    }
    localStorage.setItem('geppi-user', JSON.stringify(u))
    setUser(u)
    return u
  }

  function updateUser(updates) {
    setUser(prev => {
      const next = { ...prev, ...updates }
      if (updates.nombre) next.iniciales = computarIniciales(updates.nombre)
      localStorage.setItem('geppi-user', JSON.stringify(next))
      return next
    })
  }

  function logout(navigate) {
    localStorage.removeItem('geppi-user')
    setUser(null)
    if (navigate) navigate('/login', { state: { fromLogout: true } })
  }

  return (
    <UserContext.Provider value={{ user, loginUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
