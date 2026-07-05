import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Lock,
  Package, CheckCircle2, BarChart3,
} from 'lucide-react'

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg:         '#040B17',
  bgPanel:    '#060F1F',
  blue:       '#1B62CC',
  blueDeep:   '#083278',
  blueBright: '#4A9EFF',
  blueGlow:   'rgba(27,98,204,0.50)',
  blueGlowSm: 'rgba(27,98,204,0.18)',
  green:      '#39B54A',
  orange:     '#F7941D',
  teal:       '#06D6A0',
  light:      'rgba(232,241,255,0.92)',
  muted:      'rgba(148,175,220,0.55)',
  border:     'rgba(255,255,255,0.09)',
  tricolor:   'linear-gradient(90deg,#39B54A 0%,#1B62CC 50%,#F7941D 100%)',
}

// ── Propuestas de valor (cualitativas, no inventadas) ─────────────────────────
const VALUES = [
  {
    icon: Package,
    title: 'Inventario EPP',
    desc:  'Control desde la compra hasta la disposición final de cada equipo',
    color: C.blue,
  },
  {
    icon: CheckCircle2,
    title: 'Trazabilidad total',
    desc:  'Registro digital de cada entrega, devolución e inspección',
    color: C.green,
  },
  {
    icon: BarChart3,
    title: 'Cumplimiento normativo',
    desc:  'Alineado con ISO 45001 · GTC 45 · Resolución 0312',
    color: C.orange,
  },
]

// ── LogoSplash (simplificado y elegante) ──────────────────────────────────────
function LogoSplash({ onDone }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      onClick={ready ? onDone : undefined}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: ready ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
    >
      {/* Anillos orbitales */}
      {[{ r: 160, color: 'rgba(27,98,204,0.35)',  speed: 14, dot: C.blue   },
        { r: 250, color: 'rgba(57,181,74,0.18)',   speed: 22, dot: C.green  },
        { r: 360, color: 'rgba(247,148,29,0.11)',  speed: 34, dot: C.orange }]
        .map((ring, i) => (
          <motion.div key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.15, duration: 0.7, ease: [0.22,1,0.36,1] }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: ring.r * 2, height: ring.r * 2,
              borderRadius: '50%',
              border: `1px solid ${ring.color}`,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: ring.speed, repeat: Infinity, ease: 'linear' }}
              style={{ width: '100%', height: '100%', borderRadius: '50%', position: 'relative' }}
            >
              <div style={{
                position: 'absolute', top: -5, left: '50%',
                transform: 'translateX(-50%)',
                width: 10, height: 10, borderRadius: '50%',
                background: ring.dot,
                boxShadow: `0 0 18px ${ring.dot}`,
              }} />
            </motion.div>
          </motion.div>
        ))
      }

      {/* Glow central */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,98,204,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo flotante */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
        style={{ position: 'relative', zIndex: 10, marginBottom: 28 }}
      >
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Brillo difuso */}
          <div style={{
            position: 'absolute', inset: -30, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(27,98,204,0.35) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }} />
          <div style={{
            width: 110, height: 110, borderRadius: 26, background: 'white',
            padding: 13, position: 'relative', zIndex: 2,
            boxShadow: `
              0 0 0 3px rgba(27,98,204,0.5),
              0 0 0 8px rgba(57,181,74,0.15),
              0 0 60px rgba(27,98,204,0.7),
              0 0 120px rgba(27,98,204,0.30)
            `,
          }}>
            <img src="/logo.jpg" alt="GEPPI"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        </motion.div>
      </motion.div>

      {/* GEPPI */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.6 }}
        style={{
          fontSize: 54, fontWeight: 900, letterSpacing: '0.24em',
          margin: '0 0 8px', lineHeight: 1,
          position: 'relative', zIndex: 10,
          background: C.tricolor,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >GEPPI</motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.62, duration: 0.5 }}
        style={{
          color: C.muted, fontSize: 10, letterSpacing: '0.22em', fontWeight: 600,
          margin: '0 0 52px', position: 'relative', zIndex: 10, textAlign: 'center',
        }}
      >GESTIÓN DE EQUIPOS DE PROTECCIÓN PERSONAL</motion.p>

      {/* Hint */}
      <AnimatePresence>
        {ready && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}
          >
            <motion.div
              animate={{ scaleX: [0.55, 1, 0.55], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={{
                height: 2, width: 200, background: C.tricolor,
                borderRadius: 99, margin: '0 auto 14px',
              }}
            />
            <motion.p
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{
                color: 'rgba(148,175,220,0.65)', fontSize: 11,
                letterSpacing: '0.20em', fontWeight: 700, margin: 0,
              }}
            >TOCA PARA INGRESAR</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Panel izquierdo ───────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Imagen de fondo — textura oscura */}
      <img
        src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80"
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.22) saturate(0.4)',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(160deg,
            rgba(4,11,23,0.55) 0%,
            rgba(8,50,120,0.18) 50%,
            rgba(4,11,23,0.72) 100%
          )
        `,
      }} />

      {/* Patrón hexagonal */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.045, pointerEvents: 'none',
      }}>
        <defs>
          <pattern id="hexpat" x="0" y="0" width="64" height="56" patternUnits="userSpaceOnUse">
            <path
              d="M32 2L60 17V47L32 62L4 47V17L32 2Z"
              fill="none" stroke="#4A9EFF" strokeWidth="0.9"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexpat)" />
      </svg>

      {/* Glow radial */}
      <div style={{
        position: 'absolute', top: '35%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,98,204,0.16) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Contenido principal */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center', padding: '0 44px', maxWidth: 540,
      }}>

        {/* Ícono escudo */}
        <motion.div
          initial={{ scale: 0, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 220, damping: 18 }}
          style={{ marginBottom: 22 }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 4L46 15V37L26 48L6 37V15L26 4Z"
              stroke={C.blueBright} strokeWidth="1.5"
              fill="rgba(27,98,204,0.10)" />
            <path d="M26 14L38 21V35L26 42L14 35V21L26 14Z"
              stroke={C.blueBright} strokeWidth="0.8" opacity="0.35"
              fill="rgba(27,98,204,0.06)" />
            <path d="M20 26l4 4 8-8" stroke={C.teal} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Headline tricolor — cada palabra su color de marca */}
        <div style={{ marginBottom: 18 }}>
          {[
            { word: 'Seguridad.', color: C.green,  delay: 0.60 },
            { word: 'Control.',   color: C.blueBright, delay: 0.75 },
            { word: 'Resultados.',color: C.orange, delay: 0.90 },
          ].map(({ word, color, delay }) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay, duration: 0.55, ease: [0.22,1,0.36,1] }}
              style={{
                display: 'block',
                fontSize: 38, fontWeight: 900,
                letterSpacing: '-0.01em', lineHeight: 1.2,
                color,
                textShadow: `0 0 48px ${color}44`,
              }}
            >{word}</motion.span>
          ))}
        </div>

        {/* Descripción */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.5 }}
          style={{
            color: 'rgba(184,210,255,0.58)', fontSize: 14,
            lineHeight: 1.65, margin: '0 0 32px', fontWeight: 400,
          }}
        >
          Plataforma integral de gestión de EPP y cumplimiento<br />
          en Seguridad y Salud en el Trabajo.
        </motion.p>

        {/* Pilares de valor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {VALUES.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.12 + i * 0.11, duration: 0.45 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 13,
                padding: '12px 16px', borderRadius: 13,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: `${color}14`, border: `1px solid ${color}38`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  color: 'rgba(232,241,255,0.88)', fontSize: 13,
                  fontWeight: 700, margin: '0 0 3px',
                }}>{title}</p>
                <p style={{
                  color: 'rgba(148,175,220,0.5)', fontSize: 11, margin: 0,
                }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Badges normativos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.46, duration: 0.5 }}
          style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          }}
        >
          {['ISO 45001', 'GTC 45', 'RES. 0312', 'DEC. 1072'].map(tag => (
            <span key={tag} style={{
              padding: '4px 11px', borderRadius: 99,
              background: 'rgba(27,98,204,0.10)',
              border: '1px solid rgba(74,158,255,0.18)',
              color: 'rgba(148,175,220,0.65)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
            }}>{tag}</span>
          ))}
        </motion.div>
      </div>

      {/* Línea tricolor inferior */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.6, duration: 0.9 }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2,
          background: C.tricolor,
          transformOrigin: 'left',
        }}
      />
    </div>
  )
}

// ── Panel derecho ─────────────────────────────────────────────────────────────
function RightPanel({ onSubmit, form, setForm, showPass, setShowPass, loading, error }) {
  return (
    <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>

      {/* Logo + marca */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 13, marginBottom: 38,
        }}
      >
        <div style={{
          width: 46, height: 46, borderRadius: 13, background: 'white',
          padding: 6,
          boxShadow: `0 0 28px rgba(27,98,204,0.45), 0 0 60px rgba(27,98,204,0.15)`,
        }}>
          <img src="/logo.jpg" alt="GEPPI"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <p style={{
            fontSize: 22, fontWeight: 900, letterSpacing: '0.16em', margin: 0,
            background: C.tricolor,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>GEPPI</p>
          <p style={{
            color: C.muted, fontSize: 9, letterSpacing: '0.14em',
            fontWeight: 600, margin: 0,
          }}>SISTEMA DE GESTIÓN SST</p>
        </div>
      </motion.div>

      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.5 }}
        style={{ marginBottom: 30 }}
      >
        <h1 style={{
          color: C.light, fontSize: 27, fontWeight: 800,
          margin: '0 0 7px', letterSpacing: '-0.02em',
        }}>Bienvenido</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          Ingresa tus credenciales para continuar
        </p>
      </motion.div>

      {/* Formulario */}
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {[
          {
            key: 'email', label: 'Correo electrónico', type: 'email',
            placeholder: 'usuario@empresa.co', isPass: false, autoComplete: 'email',
          },
          {
            key: 'password', label: 'Contraseña', type: 'password',
            placeholder: '••••••••', isPass: true, autoComplete: 'current-password',
          },
        ].map(field => (
          <div key={field.key}>
            <label style={{
              color: 'rgba(148,175,220,0.65)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.09em', display: 'block', marginBottom: 9,
            }}>
              {field.label.toUpperCase()}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={field.isPass ? (showPass ? 'text' : 'password') : field.type}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                style={{
                  width: '100%', height: 50,
                  padding: field.isPass ? '0 50px 0 16px' : '0 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 13,
                  color: 'rgba(232,241,255,0.90)',
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = C.blue
                  e.target.style.boxShadow   = `0 0 0 3px rgba(27,98,204,0.22)`
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.target.style.boxShadow   = 'none'
                }}
              />
              {field.isPass && (
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    color: C.muted, background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(248,113,113,0.25)',
              color: '#FCA5A5', fontSize: 12, textAlign: 'center',
            }}
          >{error}</motion.div>
        )}

        {/* Botón submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading  ? { scale: 0.97 } : {}}
          style={{
            marginTop: 4, height: 52, borderRadius: 13, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading
              ? 'rgba(255,255,255,0.06)'
              : `linear-gradient(135deg, ${C.blue} 0%, ${C.blueDeep} 60%, ${C.blue} 100%)`,
            color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: 12, fontWeight: 800, letterSpacing: '0.13em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : `0 4px 28px rgba(27,98,204,0.45)`,
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="l"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
                  }}
                />
                VERIFICANDO…
              </motion.div>
            ) : (
              <motion.div key="i"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                INGRESAR AL SISTEMA <ArrowRight size={15} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.form>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, marginTop: 22,
        }}
      >
        <Lock size={10} color={C.muted} />
        <span style={{
          color: C.muted, fontSize: 10, letterSpacing: '0.08em',
        }}>Acceso seguro · Solo personal autorizado</span>
      </motion.div>
    </div>
  )
}

// ── LOGIN PRINCIPAL ───────────────────────────────────────────────────────────
export default function Login() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const { loginUser } = useUser()
  const [splashDone, setSplashDone] = useState(
    () => location?.state?.fromLogout === true
  )
  const [showPass,    setShowPass]   = useState(false)
  const [loading,     setLoading]    = useState(false)
  const [loginError,  setLoginError] = useState('')
  const [form, setForm] = useState({ email: 'admin@geppi.com', password: '123456' })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    try {
      await loginUser({ email: form.email.trim(), password: form.password })
      navigate('/dashboard')
    } catch {
      setLoginError('Correo o contraseña incorrectos. Verifica tus credenciales.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      overflow: 'hidden', background: C.bg,
    }}>

      {/* Splash */}
      <AnimatePresence>
        {!splashDone && <LogoSplash onDone={() => setSplashDone(true)} />}
      </AnimatePresence>

      {/* Panel izquierdo */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={splashDone ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
        transition={{ type: 'spring', stiffness: 150, damping: 22, delay: 0.15 }}
        style={{ flex: '0 0 58%', position: 'relative' }}
        className="hidden lg:block"
      >
        <LeftPanel />
      </motion.div>

      {/* Divisor */}
      <div
        className="hidden lg:block"
        style={{
          width: 1, alignSelf: 'stretch', flexShrink: 0,
          background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,0.08) 25%,rgba(255,255,255,0.08) 75%,transparent)',
        }}
      />

      {/* Panel derecho */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={splashDone ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
        transition={{ type: 'spring', stiffness: 150, damping: 22, delay: 0.22 }}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(160deg,${C.bgPanel} 0%,${C.bg} 100%)`,
          overflowY: 'auto',
        }}
        className="px-5 py-10 sm:px-10"
      >
        <RightPanel
          onSubmit={handleSubmit}
          form={form} setForm={setForm}
          showPass={showPass} setShowPass={setShowPass}
          loading={loading} error={loginError}
        />
      </motion.div>
    </div>
  )
}
