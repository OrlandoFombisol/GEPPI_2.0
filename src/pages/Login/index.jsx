import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

// SST Fombisol no tiene ingreso propio: se entra desde ATLAS (cuenta Microsoft 365 de Fombisol),
// que abre la sesión con un pase de un solo uso según el rol. Queda la animación de entrada;
// al terminar, quien ya tiene sesión va al tablero y quien no, ve cómo entrar por ATLAS.
const ATLAS = 'https://atlas.fombisol.com.co'

// ── Paleta corporativa ────────────────────────────────────────────────────────
const C = {
  bgDeep:     '#010C18',
  bgRight:    'linear-gradient(160deg, #010C18 0%, #020F20 100%)',
  blue:       '#1B62CC',
  blueDeep:   '#083278',
  blueBright: '#4A9EFF',
  blueGlow:   'rgba(27,98,204,0.55)',
  blueGlowSm: 'rgba(27,98,204,0.22)',
  green:      '#39B54A',
  greenGlow:  'rgba(57,181,74,0.35)',
  orange:     '#F7941D',
  light:      'rgba(147,197,253,0.92)',
  lightMid:   'rgba(100,160,255,0.50)',
  lightFaint: 'rgba(100,160,255,0.20)',
  frame:      'linear-gradient(135deg,#4A9EFF 0%,#1B62CC 32%,#083278 62%,#3A8AFF 100%)',
  tricolor:   'linear-gradient(90deg,#39B54A 0%,#1B62CC 50%,#F7941D 100%)',
  scanLine:   'linear-gradient(90deg,transparent,rgba(74,158,255,0.85),rgba(57,181,74,0.6),transparent)',
}


// ── Partículas ────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2.8 + 0.7, delay: Math.random() * 5, dur: Math.random() * 7 + 5,
  color: i%3===0 ? 'rgba(57,181,74,0.9)' : i%3===1 ? 'rgba(27,98,204,0.9)' : 'rgba(74,158,255,0.9)',
}))


// ── Efecto construcción: cortinas abren + materiales ensamblan ───────────────
function ConstructEffect({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  const BLOCKS = [
    // Panel izquierdo — 3 capas desde la izquierda
    { x0:-120, w:'58%', h:'34%',  delay:0.32, bg:'rgba(1,14,30,0.98)',  border:'left'                    },
    { x0:-120, w:'58%', h:'34%',  delay:0.46, bg:'rgba(3,18,48,0.96)',  border:'left',  top:'33%'        },
    { x0:-120, w:'58%', h:'35%',  delay:0.60, bg:'rgba(1,12,28,0.97)',  border:'left',  top:'66%'        },
    // Panel derecho — 4 capas desde la derecha
    { x0: 120, w:'42%', h:'25%',  delay:0.36, bg:'rgba(2,14,34,0.98)',  border:'right', left:'58%'       },
    { x0: 120, w:'42%', h:'25%',  delay:0.50, bg:'rgba(1,10,24,0.97)',  border:'right', left:'58%', top:'25%' },
    { x0: 120, w:'42%', h:'26%',  delay:0.64, bg:'rgba(3,16,40,0.96)',  border:'right', left:'58%', top:'50%' },
    { x0: 120, w:'42%', h:'26%',  delay:0.78, bg:'rgba(1,12,30,0.98)',  border:'right', left:'58%', top:'75%' },
  ]

  return (
    <div style={{ position:'absolute', inset:0, zIndex:60, pointerEvents:'none', overflow:'hidden' }}>

      {/* Cortina superior — sube */}
      <motion.div
        initial={{ y:0 }} animate={{ y:'-102%' }}
        transition={{ duration:0.80, ease:[0.55,0,0.45,1] }}
        style={{
          position:'absolute', top:0, left:0, right:0, height:'51%',
          background:`linear-gradient(to bottom, ${C.bgDeep} 80%, rgba(8,40,110,0.95))`,
          borderBottom:`2px solid ${C.blueBright}`,
          zIndex:61,
        }}
      />

      {/* Cortina inferior — baja */}
      <motion.div
        initial={{ y:0 }} animate={{ y:'102%' }}
        transition={{ duration:0.80, ease:[0.55,0,0.45,1] }}
        style={{
          position:'absolute', bottom:0, left:0, right:0, height:'51%',
          background:`linear-gradient(to top, ${C.bgDeep} 80%, rgba(8,40,110,0.95))`,
          borderTop:`2px solid ${C.blueBright}`,
          zIndex:61,
        }}
      />

      {/* Línea horizontal tricolor que barre de izquierda a derecha */}
      <motion.div
        initial={{ scaleX:0, opacity:1 }}
        animate={{ scaleX:1, opacity:0 }}
        transition={{ duration:0.70, delay:0.25, ease:'easeOut',
                     opacity:{ delay:0.72, duration:0.36 } }}
        style={{
          position:'absolute', top:'50%', left:0, right:0, height:2,
          background:C.tricolor, transformOrigin:'left', zIndex:62,
          boxShadow:`0 0 14px ${C.blueGlow}`,
        }}
      />

      {/* Divisor vertical tricolor que se traza de arriba abajo */}
      <motion.div
        initial={{ scaleY:0 }} animate={{ scaleY:1, opacity:[1,1,0] }}
        transition={{ duration:0.65, delay:0.38, ease:'easeOut',
                     opacity:{ delay:0.86, duration:0.36 } }}
        style={{
          position:'absolute', top:0, bottom:0, left:'58%', width:2,
          background:`linear-gradient(to bottom, ${C.green}, ${C.blue}, ${C.orange})`,
          transformOrigin:'top', zIndex:62,
          boxShadow:`0 0 14px ${C.blueGlow}`,
        }}
      />

      {/* Bloques de material volando y ensamblando */}
      {BLOCKS.map((b,i)=>(
        <motion.div key={i}
          initial={{ x:`${b.x0}%`, opacity:0.95 }}
          animate={{ x:0, opacity:0 }}
          transition={{ duration:0.68, delay:b.delay, ease:[0.22,1,0.36,1],
                       opacity:{ delay:b.delay+0.30, duration:0.36 } }}
          style={{
            position:'absolute',
            top: b.top ?? 0,
            left: b.left ?? 0,
            width:b.w, height:b.h,
            background:b.bg,
            borderRight: b.border==='left'  ? `1px solid rgba(74,158,255,0.25)` : undefined,
            borderLeft:  b.border==='right' ? `1px solid rgba(74,158,255,0.18)` : undefined,
            zIndex:63,
          }}
        >
          {/* Línea de "soldadura"/ensamble en el borde del bloque */}
          <motion.div
            initial={{ scaleX:0 }} animate={{ scaleX:1 }}
            transition={{ duration:0.35, delay:b.delay+0.06, ease:'easeOut' }}
            style={{
              position:'absolute',
              [b.border==='left'?'right':'left']: 0,
              top:0, bottom:0, width:2,
              background:`linear-gradient(to bottom,
                ${i%3===0?C.blue:i%3===1?C.green:C.orange},
                transparent)`,
              transformOrigin:'top',
              opacity:0.7,
            }}
          />
        </motion.div>
      ))}

      {/* Destellos de "chispa" de ensamble en las esquinas */}
      {[
        {x:'58%',y:'0%' },{x:'0%',y:'50%'},{x:'58%',y:'50%'},{x:'100%',y:'50%'},
      ].map((pos,i)=>(
        <motion.div key={i}
          initial={{ scale:0, opacity:0.9 }}
          animate={{ scale:2.8, opacity:0 }}
          transition={{ duration:0.5, delay:0.48+i*0.10, ease:'easeOut' }}
          style={{
            position:'absolute', left:pos.x, top:pos.y,
            width:10, height:10,
            borderRadius:'50%',
            background: i%2===0?C.blue:C.green,
            boxShadow:`0 0 16px ${i%2===0?C.blueGlow:C.greenGlow}`,
            transform:'translate(-50%,-50%)',
            zIndex:64,
          }}
        />
      ))}
    </div>
  )
}

// ── SPLASH INTRO: protagonismo del logo ──────────────────────────────────────
function LogoSplash({ onDone }) {
  const [broken, setBroken] = useState(false)
  const [ready,  setReady]  = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600)
    return () => clearTimeout(t)
  }, [])

  function handleClick() {
    if (broken) return
    setBroken(true)
  }

  const RINGS = [
    { r:200,  color:'rgba(27,98,204,0.28)',  delay:0,   speed:18 },
    { r:310,  color:'rgba(57,181,74,0.18)',  delay:0.2, speed:25 },
    { r:430,  color:'rgba(247,148,29,0.10)', delay:0.4, speed:34 },
    { r:560,  color:'rgba(27,98,204,0.06)',  delay:0.6, speed:46 },
    { r:700,  color:'rgba(57,181,74,0.04)',  delay:0.8, speed:60 },
  ]

  const CORNER_STATS = [
    { x:'3%',  y:'4%',  label:'SISTEMA SST',       val:'ACTIVO',   color:C.green      },
    { x:'72%', y:'4%',  label:'RESOLUCIÓN 0312',   val:'CUMPLIDO', color:C.blueBright },
    { x:'3%',  y:'88%', label:'NORMA GTC 45',       val:'VIGENTE',  color:C.orange     },
    { x:'72%', y:'88%', label:'ISO 45001',           val:'CERT.',    color:C.green      },
  ]

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: `radial-gradient(ellipse at 50% 45%,
          rgba(8,50,120,0.35) 0%,
          ${C.bgDeep} 60%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        cursor: ready ? 'pointer' : 'default',
      }}
    >
      {/* Cuadrícula técnica full-screen */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04, pointerEvents:'none' }}>
        <defs>
          <pattern id="sg1" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke={C.blue} strokeWidth="0.5"/>
          </pattern>
          <pattern id="sg2" width="220" height="220" patternUnits="userSpaceOnUse">
            <rect width="220" height="220" fill="url(#sg1)"/>
            <path d="M 220 0 L 0 0 0 220" fill="none" stroke={C.blue} strokeWidth="1.2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sg2)"/>
      </svg>

      {/* Partículas full-screen */}
      {PARTICLES.map(p => (
        <motion.div key={p.id}
          style={{
            position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
            width:p.size+1, height:p.size+1, borderRadius:'50%',
            background:`radial-gradient(circle,${p.color},transparent)`,
            pointerEvents:'none',
          }}
          animate={{ y:[0,-70,0], opacity:[0,0.8,0], scale:[0.5,1.5,0.5] }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity }}
        />
      ))}

      {/* Stats en las 4 esquinas */}
      {CORNER_STATS.map((s,i) => (
        <motion.div key={i}
          initial={{ opacity:0, scale:0.8 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ delay:1.2+i*0.12, type:'spring', stiffness:240, damping:18 }}
          style={{
            position:'absolute', left:s.x, top:s.y,
            padding:'8px 14px', borderRadius:12,
            background:'rgba(27,98,204,0.10)',
            border:`1px solid ${C.lightFaint}`,
            backdropFilter:'blur(12px)',
          }}
        >
          <p style={{ color:C.lightFaint, fontSize:8, fontWeight:700, letterSpacing:'0.12em', margin:'0 0 2px' }}>
            {s.label}
          </p>
          <p style={{ color:s.color, fontSize:13, fontWeight:900, margin:0, letterSpacing:'0.06em' }}>
            {s.val}
          </p>
        </motion.div>
      ))}

      {/* Líneas decorativas desde los bordes hacia el centro */}
      {[
        { x1:'0%', y1:'50%', x2:'18%', y2:'50%', delay:0.7, color:C.blue },
        { x1:'82%',y1:'50%', x2:'100%',y2:'50%', delay:0.8, color:C.green },
        { x1:'50%',y1:'0%',  x2:'50%', y2:'16%', delay:0.9, color:C.orange },
        { x1:'50%',y1:'84%', x2:'50%', y2:'100%',delay:1.0, color:C.blue },
      ].map((l,i) => (
        <motion.svg key={i} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'visible' }}>
          <motion.line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength:0, opacity:0 }}
            animate={{ pathLength:1, opacity:0.35 }}
            transition={{ delay:l.delay, duration:0.6 }}
          />
        </motion.svg>
      ))}

      {/* ── ANILLOS FULL-SCREEN ── */}
      {RINGS.map((ring, i) => (
        <motion.div key={i}
          initial={{ scale:0, opacity:0 }}
          animate={{ scale:1, opacity:[0,0.9,0.5] }}
          transition={{ delay:0.05+ring.delay, duration:0.7, ease:[0.22,1,0.36,1] }}
          style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            width:ring.r*2, height:ring.r*2,
            borderRadius:'50%',
            border:`1px solid ${ring.color}`,
            boxShadow:`0 0 20px ${ring.color}`,
            pointerEvents:'none',
          }}
        >
          <motion.div
            animate={{ rotate: i%2===0 ? 360 : -360 }}
            transition={{ duration:ring.speed, repeat:Infinity, ease:'linear' }}
            style={{ width:'100%', height:'100%', borderRadius:'50%', position:'relative' }}
          >
            <div style={{
              position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)',
              width:8, height:8, borderRadius:'50%',
              background:i%3===0?C.blue:i%3===1?C.green:C.orange,
              boxShadow:`0 0 14px ${i%3===0?C.blue:i%3===1?C.green:C.orange}`,
            }}/>
          </motion.div>
        </motion.div>
      ))}

      {/* ── LOGO PRINCIPAL ── grande y centrado ── */}
      <motion.div
        initial={{ scale:0.08, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        transition={{ duration:1.0, ease:[0.22,1,0.36,1] }}
        style={{ position:'relative', zIndex:10 }}
      >
        <motion.div
          animate={{ y:[-14, 10, -14] }}
          transition={{ duration:4.5, repeat:Infinity, ease:'easeInOut' }}
        >
          {/* Halo tricolor difuso gigante */}
          <div style={{
            position:'absolute', inset:-80, borderRadius:'50%',
            background:`radial-gradient(circle,
              rgba(57,181,74,0.22)   0%,
              rgba(27,98,204,0.30)  30%,
              rgba(247,148,29,0.14) 60%,
              transparent           75%)`,
            filter:'blur(30px)',
          }}/>

          {/* Logo circular — 300px */}
          <div style={{
            width:300, height:300, borderRadius:'50%',
            overflow:'hidden', background:'white', padding:24,
            boxShadow:`
              0 0 0 4px rgba(27,98,204,0.45),
              0 0 0 10px rgba(57,181,74,0.20),
              0 0 0 18px rgba(247,148,29,0.10),
              0 0 70px  rgba(27,98,204,1),
              0 0 140px rgba(27,98,204,0.65),
              0 0 220px rgba(57,181,74,0.35),
              0 0 320px rgba(247,148,29,0.20)
            `,
          }}>
            <img src="/logo.png" alt="SST Fombisol"
              style={{ width:'100%', height:'100%', objectFit:'contain', display:'block' }}/>
          </div>

          {/* Destello que barre */}
          <motion.div
            initial={{ x:-380, opacity:0.8 }} animate={{ x:380, opacity:0 }}
            transition={{ delay:0.6, duration:1.3, ease:'easeInOut' }}
            style={{
              position:'absolute', top:-30, left:0, width:70, height:360,
              background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)',
              transform:'rotate(-30deg)', pointerEvents:'none',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Nombre SST Fombisol — grande */}
      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.55, duration:0.7, ease:[0.22,1,0.36,1] }}
        style={{ textAlign:'center', marginTop:44, position:'relative', zIndex:10 }}
      >
        <p style={{
          fontSize:'clamp(36px, 7vw, 64px)', fontWeight:900, letterSpacing:'0.12em', whiteSpace:'nowrap', margin:0, lineHeight:1,
          background:C.tricolor,
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>
          SST FOMBISOL
        </p>
        <motion.div
          initial={{ scaleX:0 }} animate={{ scaleX:1 }}
          transition={{ delay:0.85, duration:0.6 }}
          style={{ height:3, background:C.tricolor, borderRadius:99,
                   margin:'12px auto 0', width:260, transformOrigin:'center' }}
        />
      </motion.div>

      {/* Subtítulo */}
      <motion.p
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.95, duration:0.5 }}
        style={{ color:C.lightFaint, fontSize:13, letterSpacing:'0.24em', fontWeight:600,
                 margin:'12px 0 0', textAlign:'center', position:'relative', zIndex:10 }}
      >
        SEGURIDAD Y SALUD EN EL TRABAJO
      </motion.p>

      {/* Tags SST */}
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:1.1, duration:0.5 }}
        style={{ display:'flex', gap:10, marginTop:18, position:'relative', zIndex:10, flexWrap:'wrap', justifyContent:'center' }}
      >
        {['ISO 45001','GTC 45','RESOLUCIÓN 0312','SST','DECRETO 1072'].map((tag,i) => (
          <motion.div key={tag}
            initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
            transition={{ delay:1.15+i*0.08, type:'spring', stiffness:260, damping:18 }}
            style={{
              padding:'5px 12px', borderRadius:99,
              background:'rgba(27,98,204,0.12)',
              border:`1px solid ${C.lightFaint}`,
              color:C.lightMid, fontSize:9, fontWeight:700, letterSpacing:'0.12em',
            }}
          >
            {tag}
          </motion.div>
        ))}
      </motion.div>

      {/* Hint centrado abajo */}
      <AnimatePresence>
        {ready && !broken && (
          <motion.div
            key="hint"
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.5 }}
            style={{
              position:'absolute', bottom:'6%', left:'50%', transform:'translateX(-50%)',
              textAlign:'center', zIndex:10,
            }}
          >
            <motion.div
              animate={{ scaleX:[0.5,1,0.5], opacity:[0.3,1,0.3] }}
              transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
              style={{ height:2, width:220, background:C.tricolor, borderRadius:99,
                       margin:'0 auto 14px', transformOrigin:'center' }}
            />
            <motion.p
              animate={{ opacity:[0.4,1,0.4] }}
              transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
              style={{ color:C.lightMid, fontSize:11, letterSpacing:'0.20em', fontWeight:700, margin:0 }}
            >
              ● TOCA EN CUALQUIER LUGAR PARA CONTINUAR
            </motion.p>
            <motion.div
              animate={{ y:[0,8,0], opacity:[0.4,1,0.4] }}
              transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}
              style={{ marginTop:10, fontSize:22 }}
            >
              👆
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efecto de construcción al clic */}
      {broken && <ConstructEffect onDone={onDone} />}
    </motion.div>
  )
}

// ── Entrada ───────────────────────────────────────────────────────────────────
export default function Login() {
  const { user, loading } = useUser()
  const location = useLocation()
  // Si viene de cerrar sesión, se salta la animación
  const [splashDone, setSplashDone] = useState(() => location?.state?.fromLogout === true)
  if (!splashDone) return <AnimatePresence><LogoSplash onDone={() => setSplashDone(true)} /></AnimatePresence>
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(135deg, #213053 0%, #1B3A66 55%, #045C94 100%)',
      fontFamily: 'Poppins, Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 20, padding: 32,
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.6)', textAlign: 'center',
      }}>
        <img src="/logo.jpg" alt="SST Fombisol" style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px', display: 'block' }} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#213053' }}>SST Fombisol</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#566181' }}>Seguridad y salud en el trabajo</p>
        <p style={{ margin: '24px 0', fontSize: 14, lineHeight: 1.6, color: '#334155' }}>
          Para entrar, abre ATLAS con tu cuenta de Fombisol y elige la tarjeta <b>SST</b>.
        </p>
        <a href={ATLAS} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 20px',
          borderRadius: 12, background: '#045C94', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
          textDecoration: 'none',
        }}>
          Ir a ATLAS <ArrowRight size={16} aria-hidden="true" />
        </a>
        <div style={{ height: 3, width: 40, background: '#FFB71B', borderRadius: 3, margin: '28px auto 0' }} />
      </div>
    </div>
  )
}
