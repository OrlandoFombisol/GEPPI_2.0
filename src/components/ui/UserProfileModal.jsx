import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, User, Mail, Briefcase, Save, LogOut, AlertCircle } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { ROL_LABEL } from '@/constants'

const ROLES = ['ADMINISTRADOR', 'SUPERVISOR', 'OPERADOR', 'AUDITOR']

export default function UserProfileModal({ open, onClose }) {
  const { user, updateUser, logout } = useUser()
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [form,    setForm]    = useState({ nombre: user.nombre, email: user.email, rol: user.rol })
  const [foto,    setFoto]    = useState(user.foto)
  const [saved,   setSaved]   = useState(false)
  const [confirm, setConfirm] = useState(false)

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    updateUser({ ...form, foto })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  function handleLogout() {
    onClose()
    logout(navigate)
  }

  const initials = form.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'US'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            }}
          />

          {/* Centrador */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              pointerEvents: 'all',
              width: 420, maxWidth: '95vw',
              background: 'var(--theme-bg-panel)',
              border: '1px solid var(--theme-border)',
              borderRadius: 20,
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header del modal */}
            <div style={{
              padding: '18px 20px 16px',
              borderBottom: '1px solid var(--theme-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(27,98,204,0.08), transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg,#1B62CC,#083278)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={16} color="white" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--theme-text)' }}>
                    Mi perfil
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--theme-text-faint)' }}>
                    Edita tu información personal
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--theme-text-faint)', padding: 6, borderRadius: 8,
                  display: 'flex', transition: 'color 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.color = 'var(--theme-text)'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--theme-text-faint)'}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                    background: foto ? 'transparent' : 'linear-gradient(135deg,#1b62cc,#083278)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '3px solid var(--theme-border)',
                    boxShadow: '0 4px 16px rgba(27,98,204,0.25)',
                  }}>
                    {foto
                      ? <img src={foto} alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      : <span style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>{initials}</span>
                    }
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--theme-bg-panel)',
                      background: 'linear-gradient(135deg,#1b62cc,#083278)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(27,98,204,0.4)',
                    }}
                  >
                    <Camera size={12} color="white" />
                  </motion.button>
                  <input ref={fileRef} type="file" accept="image/*"
                    onChange={handlePhoto} style={{ display: 'none' }}/>
                </div>
              </div>

              {/* Campos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {[
                  { key: 'nombre', label: 'Nombre completo', icon: User,     type: 'text'  },
                  { key: 'email',  label: 'Correo electrónico', icon: Mail,  type: 'email' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                      color: 'var(--theme-text-mid)', display: 'flex', alignItems: 'center',
                      gap: 5, marginBottom: 6,
                    }}>
                      <field.icon size={11} /> {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', height: 40, padding: '0 12px',
                        background: 'var(--theme-surface)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: 10, color: 'var(--theme-text)',
                        fontSize: 13, outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#1b62cc'}
                      onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
                    />
                  </div>
                ))}

                {/* Rol */}
                <div>
                  <label style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    color: 'var(--theme-text-mid)', display: 'flex', alignItems: 'center',
                    gap: 5, marginBottom: 6,
                  }}>
                    <Briefcase size={11} /> Rol
                  </label>
                  <select
                    value={form.rol}
                    onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                    style={{
                      width: '100%', height: 40, padding: '0 12px',
                      background: 'var(--theme-surface)',
                      border: '1px solid var(--theme-border)',
                      borderRadius: 10, color: 'var(--theme-text)',
                      fontSize: 13, outline: 'none', cursor: 'pointer',
                    }}
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROL_LABEL?.[r] ?? r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <motion.button
                  onClick={handleSave}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1, height: 42, borderRadius: 11, border: 'none',
                    background: saved
                      ? 'linear-gradient(135deg,#39B54A,#2A8C38)'
                      : 'linear-gradient(135deg,#1b62cc,#083278)',
                    color: 'white', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 7,
                    boxShadow: '0 3px 14px rgba(27,98,204,0.30)',
                    transition: 'background 0.3s',
                  }}
                >
                  <Save size={14} />
                  {saved ? '¡Guardado!' : 'Guardar cambios'}
                </motion.button>

                {/* Logout */}
                {!confirm ? (
                  <motion.button
                    onClick={() => setConfirm(true)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    style={{
                      height: 42, width: 42, borderRadius: 11, border: '1px solid var(--theme-border)',
                      background: 'var(--theme-surface)', color: '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                    title="Cerrar sesión"
                  >
                    <LogOut size={15} />
                  </motion.button>
                ) : (
                  <motion.button
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    onClick={handleLogout}
                    style={{
                      height: 42, padding: '0 14px', borderRadius: 11, border: 'none',
                      background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
                      color: 'white', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <AlertCircle size={13} /> Confirmar
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
