import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
} from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Shield, ArrowLeft,
  ChevronLeft, ChevronRight, Package, Users,
  Bell, BarChart3, ClipboardList, HardHat, ShieldCheck,
} from 'lucide-react'

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

// ── 10 imágenes que representan la plataforma GEPPI ──────────────────────────
const IMAGES = [
  {
    src:   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=420&q=75',
    caption: 'Entrega de EPP en obra',    tag: 'ENTREGA EPP',     stat: '340 entregas/mes',
    hotspots: [
      { x:28, y:22, label:'Casco EN 397',     sub:'Clase C certificado', color:C.orange    },
      { x:62, y:48, label:'Chaleco Tipo II',   sub:'Alta visibilidad',    color:C.green     },
      { x:40, y:78, label:'Botas S3 SRC',      sub:'Puntera de acero',    color:C.blue      },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=420&q=75',
    caption: 'Supervisión digital SST',  tag: 'SUPERVISIÓN',     stat: '100% documentado',
    hotspots: [
      { x:50, y:18, label:'EPP Completo',      sub:'5 elementos activos', color:C.green     },
      { x:72, y:42, label:'Gestión GEPPI',      sub:'Tiempo real',         color:C.blueBright},
      { x:30, y:65, label:'Guantes Nivel 4',    sub:'Resistencia mecánica',color:C.blue      },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=420&q=75',
    caption: 'Control industrial SST',   tag: 'INDUSTRIA',       stat: '0 accidentes',
    hotspots: [
      { x:35, y:30, label:'Protección auditiva',sub:'NRR 25 dB',           color:C.orange    },
      { x:60, y:55, label:'Gafas ANSI Z87.1',  sub:'Impacto alto',         color:C.blueBright},
      { x:25, y:72, label:'Arnés clase III',    sub:'Certificado EN 361',   color:C.green     },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?auto=format&fit=crop&w=420&q=75',
    caption: 'Inventario de equipos',    tag: 'INVENTARIO EPP',  stat: '250+ referencias',
    hotspots: [
      { x:42, y:25, label:'Casco Dieléctrico',  sub:'Clase E / 20 kV',     color:C.blue      },
      { x:65, y:60, label:'Cert. ICONTEC',      sub:'NTC 1523',             color:C.blueBright},
      { x:20, y:68, label:'Vida útil activa',   sub:'Revisión 2026-01',    color:C.green     },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=420&q=75',
    caption: 'Gestión en sitio de obra', tag: 'OBRA CIVIL',      stat: '98% cobertura',
    hotspots: [
      { x:38, y:28, label:'Casco obra',         sub:'EN 397 resistencia',   color:C.orange    },
      { x:55, y:52, label:'Arnés anticaída',     sub:'Altura mayor 1.5m',   color:C.green     },
      { x:70, y:70, label:'Rodilleras',          sub:'Uso continuo',         color:C.blue      },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=420&q=75',
    caption: 'Almacén y distribución',   tag: 'BODEGA EPP',      stat: '1,200+ trazados',
    hotspots: [
      { x:30, y:30, label:'Estante organizado',  sub:'Clasificación GEPPI',  color:C.blueBright},
      { x:60, y:50, label:'Stock controlado',    sub:'Mínimos configurados', color:C.green     },
      { x:45, y:75, label:'QR de trazabilidad', sub:'Escaneo en entrega',   color:C.orange    },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=420&q=75',
    caption: 'Auditoría y cumplimiento', tag: 'AUDITORÍA',       stat: 'ISO 45001 activo',
    hotspots: [
      { x:45, y:20, label:'Inspección EPP',      sub:'Check GTC-45',         color:C.green     },
      { x:65, y:48, label:'Registro digital',    sub:'Sin papel',            color:C.blueBright},
      { x:25, y:68, label:'Alerta cumplimiento', sub:'Vencimiento -30 días', color:C.orange    },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?auto=format&fit=crop&w=420&q=75',
    caption: 'Protección integral',      tag: 'EPP COMPLETO',    stat: '5 EPP / trabajador',
    hotspots: [
      { x:50, y:22, label:'Kit completo SST',    sub:'5 elementos básicos',  color:C.green     },
      { x:30, y:55, label:'Guantes EN 388',      sub:'Nivel 4 mecánico',     color:C.orange    },
      { x:68, y:72, label:'Calzado S3',          sub:'Puntera composite',    color:C.blue      },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=420&q=75',
    caption: 'Reporte y análisis SST',   tag: 'REPORTES',        stat: 'Alertas en tiempo real',
    hotspots: [
      { x:40, y:25, label:'Dashboard SST',       sub:'KPIs en tiempo real',  color:C.blueBright},
      { x:65, y:55, label:'Tendencias EPP',      sub:'Últimos 6 meses',      color:C.green     },
      { x:25, y:70, label:'Exportar PDF',         sub:'Informe regulatorio',  color:C.orange    },
    ],
  },
  {
    src:   'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=88',
    thumb: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=420&q=75',
    caption: 'Equipos y empresas',       tag: 'ORGANIZACIÓN',    stat: '50+ empresas activas',
    hotspots: [
      { x:35, y:28, label:'Multiempresa',        sub:'Sedes y sucursales',   color:C.blue      },
      { x:60, y:50, label:'Roles de acceso',     sub:'Admin / Supervisor',   color:C.green     },
      { x:45, y:72, label:'Historial completo',  sub:'Por trabajador',       color:C.blueBright},
    ],
  },
]

// ── Partículas ────────────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2.8 + 0.7, delay: Math.random() * 5, dur: Math.random() * 7 + 5,
  color: i%3===0 ? 'rgba(57,181,74,0.9)' : i%3===1 ? 'rgba(27,98,204,0.9)' : 'rgba(74,158,255,0.9)',
}))

// ── SVG SST ───────────────────────────────────────────────────────────────────
const HardHatSVG = ({size=80,op=0.07}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.blueBright} strokeWidth="0.7" style={{opacity:op}}>
    <path d="M2 18h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z"/>
    <path d="M12 2C8.13 2 5 5.13 5 9v4h14V9c0-3.87-3.13-7-7-7z"/>
    <path d="M8 13V9M16 13V9M12 2v4"/>
  </svg>
)
const ShieldCheckSVG = ({size=60,op=0.06}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="0.7" style={{opacity:op}}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)
const AlertSVG = ({size=50,op=0.05}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="0.7" style={{opacity:op}}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ── Fondo SST ─────────────────────────────────────────────────────────────────
function SSTBackground() {
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04}}>
        <defs>
          <pattern id="g1" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke={C.blue} strokeWidth="0.4"/>
          </pattern>
          <pattern id="g2" width="180" height="180" patternUnits="userSpaceOnUse">
            <rect width="180" height="180" fill="url(#g1)"/>
            <path d="M 180 0 L 0 0 0 180" fill="none" stroke={C.blue} strokeWidth="0.9"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g2)"/>
      </svg>
      {PARTICLES.map(p=>(
        <motion.div key={p.id}
          style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,
                 width:p.size,height:p.size,borderRadius:'50%',
                 background:`radial-gradient(circle,${p.color},transparent)`}}
          animate={{y:[0,-55,0],opacity:[0,0.8,0],scale:[0.5,1.4,0.5]}}
          transition={{duration:p.dur,delay:p.delay,repeat:Infinity,ease:'easeInOut'}}
        />
      ))}
      {[
        {x:'4%', y:'7%', size:110,Comp:HardHatSVG,   delay:0   },
        {x:'76%',y:'4%', size:88, Comp:ShieldCheckSVG,delay:1.4 },
        {x:'3%', y:'60%',size:78, Comp:AlertSVG,      delay:0.7 },
        {x:'80%',y:'68%',size:96, Comp:HardHatSVG,    delay:2.1 },
        {x:'44%',y:'86%',size:68, Comp:ShieldCheckSVG,delay:0.9 },
        {x:'60%',y:'20%',size:55, Comp:AlertSVG,      delay:1.8 },
      ].map(({x,y,size,Comp,delay},i)=>(
        <motion.div key={i} style={{position:'absolute',left:x,top:y}}
          animate={{y:[0,-16,0],rotate:[0,2.5,0]}}
          transition={{duration:8+i*1.2,delay,repeat:Infinity,ease:'easeInOut'}}>
          <Comp size={size}/>
        </motion.div>
      ))}
      {[
        {text:'0 ACCIDENTES',      x:'5%', y:'21%',color:C.green     },
        {text:'ISO 45001',         x:'70%',y:'30%',color:C.blueBright},
        {text:'SST CERTIFICADO',   x:'6%', y:'77%',color:C.blueBright},
        {text:'NORMA GTC 45',      x:'68%',y:'84%',color:C.orange    },
        {text:'RESOLUCIÓN 0312',   x:'46%',y:'4%', color:C.green     },
        {text:'100% EPP ACTIVO',   x:'72%',y:'56%',color:C.green     },
      ].map((s,i)=>(
        <motion.p key={i} style={{
          position:'absolute',left:s.x,top:s.y,margin:0,
          color:s.color,fontSize:9,fontWeight:800,letterSpacing:'0.14em',
          fontFamily:'monospace',opacity:0.22}}
          animate={{opacity:[0.14,0.38,0.14]}}
          transition={{duration:4.5,delay:i*0.7,repeat:Infinity}}>
          {s.text}
        </motion.p>
      ))}
      {[170,260,360].map((r,i)=>(
        <motion.div key={i} style={{
          position:'absolute',bottom:'-12%',left:'18%',
          width:r,height:r,borderRadius:'50%',
          border:`1px solid ${i===0?C.blue:i===1?C.green:C.orange}`,opacity:0.08-i*0.02}}
          animate={{scale:[1,1.08,1],opacity:[0.05,0.13,0.05]}}
          transition={{duration:5+i,delay:i*0.9,repeat:Infinity,ease:'easeInOut'}}
        />
      ))}
      <div style={{position:'absolute',top:'10%',left:'15%',width:480,height:480,borderRadius:'50%',
                   background:`radial-gradient(circle,${C.blueGlowSm},transparent 65%)`}}/>
      <div style={{position:'absolute',bottom:'5%',right:'10%',width:320,height:320,borderRadius:'50%',
                   background:`radial-gradient(circle,rgba(57,181,74,0.06),transparent 65%)`}}/>
    </div>
  )
}

// ── Bandeja de cristal ────────────────────────────────────────────────────────
function CrystalTray({wide=false}) {
  return (
    <div style={{position:'absolute',bottom:-18,left:'50%',transform:'translateX(-50%)',zIndex:0}}>
      <div style={{
        width:wide?580:480,height:13,borderRadius:99,
        background:`linear-gradient(180deg,rgba(74,158,255,0.09),rgba(27,98,204,0.05))`,
        backdropFilter:'blur(20px)',
        border:`1px solid ${C.lightFaint}`,
        boxShadow:`0 4px 28px ${C.blueGlowSm},inset 0 1px 0 rgba(147,197,253,0.12)`,
      }}/>
      <div style={{
        width:wide?380:300,height:18,marginTop:4,marginLeft:wide?100:90,
        background:`radial-gradient(ellipse at center,${C.blueGlowSm},transparent 70%)`,
        filter:'blur(6px)',
      }}/>
    </div>
  )
}

// ── Filmstrip auto-scroll ─────────────────────────────────────────────────────
function Filmstrip({ current, onSelect }) {
  const items = [...IMAGES, ...IMAGES]   // duplicar para loop infinito
  const W = 88, GAP = 8, TOTAL = IMAGES.length * (W + GAP)

  return (
    <div style={{ width:'100%', overflow:'hidden', position:'relative', height: 62 }}>
      {/* Degradado izq */}
      <div style={{
        position:'absolute',left:0,top:0,bottom:0,width:60,zIndex:2,pointerEvents:'none',
        background:`linear-gradient(to right,${C.bgDeep},transparent)`,
      }}/>
      {/* Degradado der */}
      <div style={{
        position:'absolute',right:0,top:0,bottom:0,width:60,zIndex:2,pointerEvents:'none',
        background:`linear-gradient(to left,${C.bgDeep},transparent)`,
      }}/>

      <motion.div
        animate={{ x: [0, -TOTAL] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        style={{ display:'flex', gap: GAP, position:'absolute', left:0, top:0 }}
      >
        {items.map((img, i) => {
          const realIdx = i % IMAGES.length
          const isActive = realIdx === current
          return (
            <motion.div
              key={i}
              onClick={() => onSelect(realIdx)}
              whileHover={{ scale: 1.1, y: -3 }}
              style={{
                width: W, height: 56, borderRadius: 10, overflow:'hidden',
                flexShrink: 0, cursor:'pointer', position:'relative',
                border: isActive ? `2px solid ${C.blue}` : `1px solid ${C.lightFaint}`,
                boxShadow: isActive ? `0 0 14px ${C.blueGlow}` : 'none',
                transition:'border 0.25s,box-shadow 0.25s',
              }}
            >
              <img src={img.thumb} alt={img.caption}
                style={{ width:'100%', height:'100%', objectFit:'cover',
                         filter: isActive ? 'brightness(1)' : 'brightness(0.55)' }}
                onError={e=>{ e.target.parentNode.style.background='#040E20' }}
              />
              {isActive && (
                <div style={{
                  position:'absolute',inset:0,
                  background:'linear-gradient(to top,rgba(27,98,204,0.5),transparent 60%)',
                }}/>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

// ── Ecosistema ────────────────────────────────────────────────────────────────
function EcosystemView({ img, imgIndex, onExit, onNext, onPrev }) {
  const [activeHotspot, setActiveHotspot] = useState(null)
  const [scanDone, setScanDone]           = useState(false)

  useEffect(() => {
    setScanDone(false)
    const t = setTimeout(() => setScanDone(true), 1700)
    return () => clearTimeout(t)
  }, [imgIndex])

  return (
    <motion.div key={imgIndex}
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      transition={{duration:0.4}}
      style={{position:'absolute',inset:0,zIndex:100,background:C.bgDeep,
              display:'flex',flexDirection:'column',overflow:'hidden'}}>

      <motion.div drag="x" dragConstraints={{left:0,right:0}} dragElastic={0.12}
        onDragEnd={(_,info)=>{ if(info.offset.x<-70) onNext(); else if(info.offset.x>70) onPrev() }}
        style={{position:'absolute',inset:0,cursor:'grab'}} whileDrag={{cursor:'grabbing'}}>
        <img src={img.src} alt={img.caption}
          style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.3) saturate(0.6)'}}
          onError={e=>{e.target.style.background='#040E20'}}/>
      </motion.div>

      <div style={{position:'absolute',inset:0,
                   background:`linear-gradient(160deg,rgba(1,12,24,0.6) 0%,rgba(8,50,120,0.15) 50%,rgba(1,12,24,0.8) 100%)`}}/>

      {PARTICLES.slice(0,16).map(p=>(
        <motion.div key={p.id} style={{
          position:'absolute',left:`${p.x}%`,top:`${p.y}%`,
          width:p.size+1,height:p.size+1,borderRadius:'50%',
          background:`radial-gradient(circle,${p.color},transparent)`,pointerEvents:'none'}}
          animate={{y:[0,-65,0],opacity:[0,0.9,0],scale:[0.5,1.6,0.5]}}
          transition={{duration:p.dur,delay:p.delay,repeat:Infinity}}/>
      ))}

      {!scanDone && (
        <motion.div style={{
          position:'absolute',left:0,right:0,height:2,
          background:C.scanLine,boxShadow:`0 0 22px ${C.blueGlow}`,pointerEvents:'none'}}
          initial={{top:'0%'}} animate={{top:'100%'}}
          transition={{duration:1.6,ease:'easeInOut'}}/>
      )}

      {scanDone && img.hotspots.map((h,i)=>(
        <motion.div key={i}
          initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{delay:i*0.18,type:'spring',stiffness:280,damping:18}}
          style={{position:'absolute',left:`${h.x}%`,top:`${h.y}%`,
                 transform:'translate(-50%,-50%)',cursor:'pointer',zIndex:20}}
          onClick={()=>setActiveHotspot(activeHotspot===i?null:i)}>
          <motion.div animate={{scale:[1,1.9,1],opacity:[0.8,0,0.8]}} transition={{duration:2.2,repeat:Infinity}}
            style={{position:'absolute',inset:-9,borderRadius:'50%',border:`1.5px solid ${h.color}`}}/>
          <div style={{width:13,height:13,borderRadius:'50%',background:h.color,
                       boxShadow:`0 0 12px ${h.color},0 0 26px ${h.color}55`,position:'relative',zIndex:2}}/>
          <AnimatePresence>
            {activeHotspot===i && (
              <motion.div initial={{opacity:0,scale:0.85,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.85}}
                style={{position:'absolute',left:20,top:-10,background:'rgba(1,12,24,0.92)',
                        border:`1px solid ${h.color}55`,borderRadius:10,padding:'8px 14px',
                        backdropFilter:'blur(16px)',whiteSpace:'nowrap',zIndex:30}}>
                <p style={{color:h.color,fontSize:11,fontWeight:800,letterSpacing:'0.08em',margin:0}}>{h.label}</p>
                <p style={{color:'rgba(147,197,253,0.55)',fontSize:10,marginTop:3}}>{h.sub}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Panel superior */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        style={{position:'absolute',top:24,left:0,right:0,
                display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'0 28px',zIndex:30}}>
        <div>
          <div style={{display:'inline-block',padding:'3px 10px',borderRadius:99,
                       background:'rgba(27,98,204,0.18)',border:`1px solid ${C.lightFaint}`,
                       color:C.blueBright,fontSize:9,fontWeight:800,letterSpacing:'0.15em',marginBottom:6}}>
            {img.tag}
          </div>
          <h2 style={{color:'white',fontSize:22,fontWeight:900,margin:0}}>{img.caption}</h2>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{color:C.green,fontSize:20,fontWeight:900,margin:0}}>{img.stat}</p>
          <p style={{color:C.lightFaint,fontSize:10,letterSpacing:'0.1em'}}>INDICADOR SST</p>
        </div>
      </motion.div>

      {/* Flechas */}
      {[{side:'left',Icon:ChevronLeft,action:onPrev},{side:'right',Icon:ChevronRight,action:onNext}].map(({side,Icon,action})=>(
        <motion.button key={side} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
          onClick={action} whileHover={{background:'rgba(27,98,204,0.28)',scale:1.1}} whileTap={{scale:0.92}}
          style={{position:'absolute',[side]:20,top:'50%',transform:'translateY(-50%)',
                 background:'rgba(27,98,204,0.14)',border:`1px solid ${C.lightFaint}`,
                 borderRadius:'50%',width:44,height:44,display:'flex',alignItems:'center',
                 justifyContent:'center',cursor:'pointer',color:C.blueBright,zIndex:30,backdropFilter:'blur(8px)'}}>
          <Icon size={20}/>
        </motion.button>
      ))}

      {/* Dots */}
      <div style={{position:'absolute',bottom:72,left:0,right:0,display:'flex',
                   justifyContent:'center',gap:8,zIndex:30}}>
        {IMAGES.map((_,i)=>(
          <motion.div key={i}
            animate={{width:i===imgIndex?28:7,background:i===imgIndex?C.blue:C.lightFaint}}
            transition={{type:'spring',stiffness:300,damping:25}}
            style={{height:6,borderRadius:99}}/>
        ))}
      </div>

      {scanDone && (
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
          style={{position:'absolute',bottom:100,left:0,right:0,textAlign:'center',
                 color:C.lightFaint,fontSize:10,letterSpacing:'0.15em',pointerEvents:'none',margin:0}}>
          ← ARRASTRA PARA NAVEGAR →
        </motion.p>
      )}

      {/* Botón salir */}
      <motion.button initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
        onClick={onExit}
        whileHover={{background:'rgba(27,98,204,0.22)',borderColor:C.lightMid,scale:1.03}}
        whileTap={{scale:0.97}}
        style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',
               display:'flex',alignItems:'center',gap:8,padding:'10px 24px',borderRadius:99,
               background:'rgba(1,12,24,0.65)',border:`1px solid ${C.lightFaint}`,
               backdropFilter:'blur(16px)',color:C.light,fontSize:11,fontWeight:700,
               letterSpacing:'0.12em',cursor:'pointer',zIndex:40}}>
        <ArrowLeft size={13}/> SALIR DEL ECOSISTEMA
      </motion.button>
    </motion.div>
  )
}

// ── Carrusel 3D ───────────────────────────────────────────────────────────────
function getSlot(offset) {
  if(offset===0) return {x:0,   z:0,   rotY:0,  scale:1,   opacity:1,   bright:1   }
  if(offset===1) return {x:220, z:-220,rotY:-44,scale:0.70,opacity:0.45,bright:0.50}
  return               {x:-220,z:-220,rotY:44, scale:0.70,opacity:0.45,bright:0.50}
}

function Carousel3D({ current, onClickActive, onNext, onPrev, onSelectIndex }) {
  const sceneRef=useRef(null)
  const mouseX=useMotionValue(0), mouseY=useMotionValue(0)
  const rotateX=useSpring(useTransform(mouseY,[-260,260],[9,-9]),{stiffness:110,damping:28})
  const rotateY=useSpring(useTransform(mouseX,[-260,260],[-9,9]),{stiffness:110,damping:28})
  const total=IMAGES.length

  return (
    <motion.div ref={sceneRef}
      onMouseMove={e=>{const r=sceneRef.current?.getBoundingClientRect();if(!r)return;mouseX.set(e.clientX-r.left-r.width/2);mouseY.set(e.clientY-r.top-r.height/2)}}
      onMouseLeave={()=>{mouseX.set(0);mouseY.set(0)}}
      drag="x" dragConstraints={{left:0,right:0}} dragElastic={0.1}
      onDragEnd={(_,info)=>{ if(info.offset.x<-60) onNext(); else if(info.offset.x>60) onPrev() }}
      style={{position:'relative',width:520,height:320,cursor:'grab'}}
      whileDrag={{cursor:'grabbing'}}>
      <motion.div style={{rotateX,rotateY,transformStyle:'preserve-3d',width:'100%',height:'100%'}}>
        {IMAGES.map((img,i)=>{
          const offset=(i-current+total)%total
          if(offset>1&&offset<total-1) return null
          const s=getSlot(offset), isActive=offset===0
          return (
            <motion.div key={i}
              animate={{x:s.x,z:s.z,rotateY:s.rotY,scale:s.scale,opacity:s.opacity}}
              transition={{type:'spring',stiffness:200,damping:26,mass:0.8}}
              onClick={()=>isActive?onClickActive():onSelectIndex(i)}
              whileHover={isActive?{scale:1.05,z:40,transition:{duration:0.2}}:{scale:s.scale*1.06,opacity:0.65}}
              style={{position:'absolute',zIndex:isActive?10:4,transformStyle:'preserve-3d',
                     cursor:isActive?'zoom-in':'pointer'}}>
              <motion.div animate={{y:isActive?[-12,6,-12]:[-5,5,-5]}}
                transition={{duration:isActive?3.5:5.5,repeat:Infinity,ease:'easeInOut'}}
                style={{transformStyle:'preserve-3d'}}>
                <div style={{
                  padding:3,borderRadius:18,
                  background:isActive?C.frame:C.tricolor,
                  boxShadow:isActive
                    ?`0 0 55px ${C.blueGlow},0 0 110px ${C.blueGlowSm},0 36px 70px rgba(0,0,0,0.9)`
                    :`0 0 16px ${C.blueGlowSm},0 18px 44px rgba(0,0,0,0.75)`}}>
                  <div style={{
                    width:isActive?300:200,height:isActive?200:136,
                    borderRadius:16,overflow:'hidden',position:'relative',
                    filter:`brightness(${s.bright})`,transition:'width 0.4s,height 0.4s,filter 0.4s'}}>
                    <img src={img.thumb} alt={img.caption}
                      style={{width:'100%',height:'100%',objectFit:'cover'}}
                      onError={e=>{e.target.parentNode.style.background='#040E20'}}/>
                    {isActive&&(
                      <>
                        <div style={{position:'absolute',inset:0,
                                     background:'linear-gradient(to top,rgba(1,12,24,0.65) 0%,transparent 55%)'}}/>
                        <motion.div animate={{opacity:[0.5,1,0.5]}} transition={{duration:2.5,repeat:Infinity}}
                          style={{position:'absolute',bottom:34,right:12,background:'rgba(27,98,204,0.22)',
                                 border:`1px solid ${C.lightFaint}`,borderRadius:8,padding:'4px 9px',
                                 color:C.blueBright,fontSize:9,fontWeight:700,letterSpacing:'0.1em'}}>
                          TAP PARA ENTRAR
                        </motion.div>
                        <p style={{position:'absolute',bottom:10,left:12,margin:0,
                                   color:C.light,fontSize:10,fontWeight:700,
                                   letterSpacing:'0.08em',textTransform:'uppercase'}}>
                          {img.caption}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {isActive&&(
                  <div style={{width:'100%',height:48,marginTop:2,borderRadius:'0 0 14px 14px',
                               background:`linear-gradient(to bottom,${C.blueGlowSm},transparent)`,
                               transform:'scaleY(-1)',opacity:0.3,filter:'blur(3px)',overflow:'hidden'}}>
                    <img src={img.thumb} alt=""
                      style={{width:'100%',height:48,objectFit:'cover',
                             objectPosition:'bottom',transform:'scaleY(-1)'}}/>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )
        })}
        <CrystalTray wide/>
      </motion.div>
    </motion.div>
  )
}

// ── Panel derecho: animaciones y features ─────────────────────────────────────
const FEATURES = [
  { icon: Package,      label: 'Inventario EPP',    color: C.blue      },
  { icon: ClipboardList,label: 'Entregas digitales', color: C.green     },
  { icon: Bell,         label: 'Alertas SST',        color: C.orange    },
  { icon: BarChart3,    label: 'Reportes',           color: C.blueBright},
  { icon: Users,        label: 'Trabajadores',       color: C.green     },
  { icon: ShieldCheck,  label: 'Cumplimiento',       color: C.blue      },
]

const STATS = [
  { value: 1200, suffix:'+', label: 'Trabajadores'  },
  { value: 340,  suffix:'',  label: 'Entregas/mes'  },
  { value: 50,   suffix:'+', label: 'Empresas'      },
]

function AnimatedCounter({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const dur = 1400
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / dur, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{display}{suffix}</>
}

function RightPanel({ onSubmit, form, setForm, showPass, setShowPass, loading, error }) {
  return (
    <div style={{ width: '100%', maxWidth: 360, position: 'relative' }}>

      {/* Partículas de fondo del panel */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 24 }}>
        {PARTICLES.slice(0,12).map(p=>(
          <motion.div key={p.id}
            style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,
                   width:p.size,height:p.size,borderRadius:'50%',
                   background:`radial-gradient(circle,${p.color},transparent)`}}
            animate={{y:[0,-40,0],opacity:[0,0.5,0],scale:[0.5,1.2,0.5]}}
            transition={{duration:p.dur,delay:p.delay,repeat:Infinity,ease:'easeInOut'}}/>
        ))}
      </div>

      {/* Logo */}
      <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
        transition={{type:'spring',stiffness:220,damping:18,delay:0.3}}
        style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:28,position:'relative'}}>
        <div style={{position:'relative',width:82,height:82,marginBottom:14}}>
          {[{inset:-13,color:'rgba(57,181,74,0.4)',delay:0},{inset:-5,color:'rgba(74,158,255,0.38)',delay:0.6}].map((ring,ri)=>(
            <motion.div key={ri}
              animate={{scale:[1,1.18,1],opacity:[0.5,0.1,0.5]}}
              transition={{duration:3,repeat:Infinity,ease:'easeInOut',delay:ring.delay}}
              style={{position:'absolute',inset:ring.inset,borderRadius:'50%',border:`1.5px solid ${ring.color}`}}/>
          ))}
          <div style={{width:82,height:82,borderRadius:20,background:'#fff',
                       boxShadow:`0 0 40px ${C.blueGlowSm},0 8px 32px rgba(0,0,0,0.8)`,
                       display:'flex',alignItems:'center',justifyContent:'center',
                       padding:9,position:'relative',zIndex:2}}>
            <img src="/logo.jpg" alt="GEPPI" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
          </div>
        </div>
        <p style={{fontSize:28,fontWeight:900,letterSpacing:'0.18em',margin:'0 0 3px',
                   background:C.tricolor,WebkitBackgroundClip:'text',
                   WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
          GEPPI
        </p>
        <p style={{color:C.lightFaint,fontSize:9,letterSpacing:'0.18em',fontWeight:600,margin:0}}>
          GESTIÓN DE EQUIPOS DE PROTECCIÓN PERSONAL
        </p>
        <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.65,duration:0.5}}
          style={{marginTop:10,height:2,width:140,background:C.tricolor,
                 transformOrigin:'center',borderRadius:99}}/>
      </motion.div>

      {/* Stats animados */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
        transition={{delay:0.45,duration:0.5}}
        style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:22}}>
        {STATS.map((s,i)=>(
          <motion.div key={i}
            initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
            transition={{delay:0.5+i*0.1,duration:0.45}}
            style={{
              textAlign:'center',padding:'10px 6px',borderRadius:12,
              background:'rgba(27,98,204,0.08)',border:`1px solid ${C.lightFaint}`,
            }}>
            <p style={{color:C.blueBright,fontSize:20,fontWeight:900,margin:'0 0 2px',lineHeight:1}}>
              <AnimatedCounter value={s.value} suffix={s.suffix}/>
            </p>
            <p style={{color:C.lightFaint,fontSize:9,fontWeight:600,letterSpacing:'0.08em',margin:0}}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Features pills */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
        style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:22}}>
        {FEATURES.map(({icon:Icon,label,color},i)=>(
          <motion.div key={i}
            initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
            transition={{delay:0.65+i*0.07,type:'spring',stiffness:260,damping:18}}
            style={{display:'flex',alignItems:'center',gap:5,
                   padding:'5px 10px',borderRadius:99,
                   background:'rgba(27,98,204,0.08)',border:`1px solid ${C.lightFaint}`}}>
            <Icon size={11} style={{color,flexShrink:0}}/>
            <span style={{color:C.lightMid,fontSize:10,fontWeight:600,letterSpacing:'0.06em'}}>{label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Separador */}
      <motion.div initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:0.7,duration:0.4}}
        style={{height:1,background:`linear-gradient(90deg,transparent,${C.lightFaint},transparent)`,
               marginBottom:20,transformOrigin:'left',borderRadius:99}}/>

      {/* Formulario */}
      <motion.form onSubmit={onSubmit}
        initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}
        transition={{delay:0.72,duration:0.45}}
        style={{display:'flex',flexDirection:'column',gap:14}}>
        {[
          {key:'email',   label:'CORREO ELECTRÓNICO',type:'email',   placeholder:'usuario@empresa.co',isPass:false},
          {key:'password',label:'CONTRASEÑA',         type:'password',placeholder:'••••••••',          isPass:true },
        ].map(field=>(
          <div key={field.key}>
            <label style={{color:C.lightFaint,fontSize:10,fontWeight:700,
                           letterSpacing:'0.1em',display:'block',marginBottom:7}}>
              {field.label}
            </label>
            <div style={{position:'relative'}}>
              <input
                type={field.isPass?(showPass?'text':'password'):field.type}
                value={form[field.key]}
                onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}
                placeholder={field.placeholder}
                style={{width:'100%',height:44,
                       padding:field.isPass?'0 44px 0 16px':'0 16px',
                       background:'rgba(27,98,204,0.07)',
                       border:`1px solid ${C.lightFaint}`,
                       borderRadius:10,color:'rgba(255,255,255,0.88)',
                       fontSize:13,outline:'none',boxSizing:'border-box',
                       transition:'border-color 0.2s,box-shadow 0.2s'}}
                onFocus={e=>{e.target.style.borderColor=C.blue;e.target.style.boxShadow=`0 0 0 3px ${C.blueGlowSm}`}}
                onBlur={e=>{e.target.style.borderColor=C.lightFaint;e.target.style.boxShadow='none'}}
              />
              {field.isPass&&(
                <button type="button" onClick={()=>setShowPass(p=>!p)}
                  style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',
                         color:C.lightFaint,background:'none',border:'none',cursor:'pointer',
                         padding:0,display:'flex'}}>
                  {showPass?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              )}
            </div>
          </div>
        ))}

        {error && (
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
            style={{padding:'10px 14px',borderRadius:10,
                   background:'rgba(220,38,38,0.12)',border:'1px solid rgba(248,113,113,0.30)',
                   color:'#FCA5A5',fontSize:12,textAlign:'center'}}>
            {error}
          </motion.div>
        )}

        <motion.button type="submit" disabled={loading}
          whileHover={!loading?{scale:1.02,boxShadow:`0 0 28px ${C.blueGlow}`}:{}}
          whileTap={!loading?{scale:0.97}:{}}
          style={{marginTop:4,height:48,borderRadius:12,border:'none',
                 cursor:loading?'not-allowed':'pointer',
                 background:loading?'rgba(255,255,255,0.06)':`linear-gradient(135deg,${C.blue} 0%,${C.blueDeep} 50%,${C.blue} 100%)`,
                 color:loading?'rgba(255,255,255,0.3)':'#fff',
                 fontSize:11,fontWeight:800,letterSpacing:'0.14em',
                 display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                 boxShadow:loading?'none':`0 4px 20px ${C.blueGlowSm}`,transition:'background 0.3s'}}>
          <AnimatePresence mode="wait">
            {loading?(
              <motion.div key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{display:'flex',alignItems:'center',gap:8}}>
                <motion.div animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:'linear'}}
                  style={{width:14,height:14,borderRadius:'50%',
                         border:'2px solid rgba(255,255,255,0.2)',borderTopColor:'#fff'}}/>
                VERIFICANDO…
              </motion.div>
            ):(
              <motion.div key="i" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{display:'flex',alignItems:'center',gap:8}}>
                INGRESAR AL SISTEMA <ArrowRight size={14}/>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.form>

      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.95}}
        style={{textAlign:'center',marginTop:18}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,color:C.lightFaint}}>
          <Shield size={10}/><span style={{fontSize:10,letterSpacing:'0.08em'}}>Acceso seguro · Solo personal autorizado</span>
        </div>
      </motion.div>
    </div>
  )
}

// ── Fragmentos de vidrio (clip-path + dirección de salida) ───────────────────
const SHARDS = [
  { c:'0% 0%,33% 0%,27% 32%,0% 24%',         dx:-280,dy:-210,rot:-44,dl:0.00,a:135 },
  { c:'33% 0%,60% 0%,55% 28%,35% 30%',        dx:-40, dy:-270,rot: 14,dl:0.02,a:160 },
  { c:'60% 0%,85% 0%,82% 26%,62% 28%',        dx: 80, dy:-275,rot:-17,dl:0.01,a:200 },
  { c:'85% 0%,100% 0%,100% 24%,84% 26%',      dx: 250,dy:-210,rot: 40,dl:0.03,a:220 },
  { c:'0% 24%,27% 32%,22% 58%,0% 50%',        dx:-300,dy: -30,rot:-40,dl:0.04,a:110 },
  { c:'35% 30%,55% 28%,58% 56%,38% 60%',      dx: -75,dy: -90,rot: 24,dl:0.02,a:145 },
  { c:'62% 28%,82% 26%,84% 52%,65% 58%',      dx:  85,dy: -80,rot:-23,dl:0.03,a:215 },
  { c:'84% 26%,100% 24%,100% 52%,86% 52%',    dx: 280,dy: -25,rot: 34,dl:0.01,a:230 },
  { c:'0% 50%,22% 58%,18% 80%,0% 75%',        dx:-295,dy: 115,rot: 42,dl:0.03,a: 90 },
  { c:'38% 60%,58% 56%,62% 82%,40% 85%',      dx: -55,dy: 135,rot:-19,dl:0.02,a:180 },
  { c:'65% 58%,84% 52%,86% 78%,68% 82%',      dx:  95,dy: 125,rot: 28,dl:0.04,a:190 },
  { c:'86% 52%,100% 52%,100% 78%,88% 78%',    dx: 270,dy: 105,rot:-38,dl:0.02,a:250 },
  { c:'0% 75%,18% 80%,16% 100%,0% 100%',      dx:-240,dy: 240,rot:-46,dl:0.03,a: 80 },
  { c:'40% 85%,62% 82%,60% 100%,38% 100%',    dx: -28,dy: 290,rot: 18,dl:0.01,a:170 },
  { c:'68% 82%,86% 78%,84% 100%,65% 100%',    dx: 105,dy: 280,rot:-24,dl:0.04,a:195 },
  { c:'88% 78%,100% 78%,100% 100%,85% 100%',  dx: 220,dy: 230,rot: 44,dl:0.02,a:240 },
]

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
  const [hitPos, setHitPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600)
    return () => clearTimeout(t)
  }, [])

  function handleClick(e) {
    if (broken) return
    setHitPos({ x: e.clientX, y: e.clientY })
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
            <img src="/logo.jpg" alt="GEPPI"
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

      {/* Nombre GEPPI — grande */}
      <motion.div
        initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.55, duration:0.7, ease:[0.22,1,0.36,1] }}
        style={{ textAlign:'center', marginTop:44, position:'relative', zIndex:10 }}
      >
        <p style={{
          fontSize:72, fontWeight:900, letterSpacing:'0.26em', margin:0, lineHeight:1,
          background:C.tricolor,
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>
          GEPPI
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
        GESTIÓN DE EQUIPOS DE PROTECCIÓN PERSONAL
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
              ● TOCA EN CUALQUIER LUGAR PARA INGRESAR
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

// ── LOGIN PRINCIPAL ───────────────────────────────────────────────────────────
export default function Login() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { loginUser } = useUser()
  // Si viene de logout, saltarse el splash
  const [splashDone, setSplashDone] = useState(
    () => location?.state?.fromLogout === true
  )
  const [current, setCurrent]   = useState(0)
  const [mode, setMode]         = useState('carousel')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [loginError, setLoginError] = useState('')
  const [form, setForm]         = useState({ email:'admin@geppi.co', password:'' })

  const total = IMAGES.length
  const next  = useCallback(()=>setCurrent(c=>(c+1)%total),[total])
  const prev  = useCallback(()=>setCurrent(c=>(c-1+total)%total),[total])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    try {
      const { usuarioDB } = await import('@/db')
      const usuario = await usuarioDB.getByCorreo(form.email.trim())
      if (!usuario || usuario.estado !== 'ACTIVO' || usuario.password !== form.password) {
        setLoginError('Correo o contraseña incorrectos')
        setLoading(false)
        return
      }
      await usuarioDB.update(usuario.id, { ultimoAcceso: new Date().toISOString() })
      loginUser(usuario)
      navigate('/dashboard')
    } catch (err) {
      console.error('[Login]', err)
      setLoginError('Error al verificar credenciales. Intente nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',overflow:'hidden',background:C.bgDeep,position:'relative'}}>

      {/* ── SPLASH LOGO ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!splashDone && <LogoSplash onDone={() => setSplashDone(true)} />}
      </AnimatePresence>

      {/* ── PANEL IZQUIERDO ── llega desde la izquierda ──────────────── */}
      <motion.div
        initial={{opacity:0, x:-80}}
        animate={splashDone ? {opacity:1, x:0} : {opacity:0, x:-80}}
        transition={{type:'spring', stiffness:160, damping:22, delay:0.18}}
        style={{flex:'0 0 58%',position:'relative',display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',overflow:'hidden',gap:0}}
        className="hidden lg:flex">

        <SSTBackground/>

        {/* Carrusel + ecosistema */}
        <AnimatePresence>
          {mode==='carousel'&&(
            <motion.div key="carousel"
              initial={{opacity:0}} animate={{opacity:1}}
              exit={{opacity:0,scale:1.04}} transition={{duration:0.4}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,
                     perspective:'1100px',paddingTop:30,position:'relative',zIndex:10,width:'100%'}}>

              {/* Badge SST */}
              <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'7px 18px',borderRadius:99,
                       background:'rgba(27,98,204,0.09)',border:`1px solid ${C.lightFaint}`,backdropFilter:'blur(10px)'}}>
                <motion.div animate={{opacity:[1,0.3,1]}} transition={{duration:2,repeat:Infinity}}
                  style={{width:6,height:6,borderRadius:'50%',background:C.green}}/>
                <span style={{color:C.lightMid,fontSize:10,fontWeight:700,letterSpacing:'0.14em'}}>
                  GEPPI · SEGURIDAD Y SALUD EN EL TRABAJO
                </span>
              </motion.div>

              {/* Carrusel 3D */}
              <Carousel3D current={current} onClickActive={()=>setMode('ecosystem')}
                onNext={next} onPrev={prev} onSelectIndex={setCurrent}/>

              {/* Dots */}
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {IMAGES.slice(0,6).map((_,i)=>(
                  <motion.button key={i} onClick={()=>setCurrent(i)}
                    animate={{width:i===current?24:6,background:i===current?C.blue:C.lightFaint}}
                    transition={{type:'spring',stiffness:300,damping:25}}
                    style={{height:6,borderRadius:99,border:'none',cursor:'pointer',padding:0}}/>
                ))}
                {current>=6&&<span style={{color:C.lightFaint,fontSize:9}}>{current+1}/{IMAGES.length}</span>}
              </div>

              <motion.p animate={{opacity:[0.25,0.6,0.25]}} transition={{duration:3.5,repeat:Infinity}}
                style={{color:C.lightFaint,fontSize:9,letterSpacing:'0.14em',margin:'0 0 6px'}}>
                ← ARRASTRA · HAZ CLIC PARA ENTRAR →
              </motion.p>

              {/* Filmstrip */}
              <div style={{width:'100%',paddingBottom:24}}>
                <Filmstrip current={current} onSelect={setCurrent}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mode==='ecosystem'&&(
            <EcosystemView key={`eco-${current}`} img={IMAGES[current]} imgIndex={current}
              total={total} onExit={()=>setMode('carousel')} onNext={next} onPrev={prev}/>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Línea divisoria */}
      <div style={{width:1,alignSelf:'stretch',flexShrink:0,
                   background:`linear-gradient(to bottom,transparent,${C.lightFaint} 25%,${C.lightFaint} 75%,transparent)`}}
           className="hidden lg:block"/>

      {/* ── PANEL DERECHO ── llega desde la derecha ───────────────────── */}
      <motion.div
        initial={{opacity:0, x:80}}
        animate={splashDone ? {opacity:1, x:0} : {opacity:0, x:80}}
        transition={{type:'spring', stiffness:160, damping:22, delay:0.26}}
        style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
               justifyContent:'center',padding:'32px 40px',background:C.bgRight,
               overflowY:'auto'}}>
        <RightPanel
          onSubmit={handleSubmit}
          form={form} setForm={setForm}
          showPass={showPass} setShowPass={setShowPass}
          loading={loading}
          error={loginError}
        />
      </motion.div>
    </div>
  )
}
