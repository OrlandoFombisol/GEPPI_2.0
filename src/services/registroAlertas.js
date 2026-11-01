import { alertaDB } from '@/db'

/**
 * Registro de alertas en memoria para una corrida de «Generar alertas».
 * La base solo admite una alerta por (tipo, referencia), así que:
 *  - si no existe, se crea;
 *  - si existe y sube de nivel (p. ej. de «por vencer» a «vencido»), se actualiza y vuelve a «no leída»;
 *  - si existe con el mismo nivel, solo se refresca el mensaje si sigue sin leer
 *    (una alerta leída no reaparece).
 */
const PESO_NIVEL = { INFO: 0, WARNING: 1, CRITICO: 2 }

export async function crearRegistroAlertas() {
  const existentes = await alertaDB.getAll()
  const mapa = new Map((existentes || []).map(a => [`${a.tipo}|${a.referenciaId}`, a]))
  const vistas = new Set()
  let nuevas = 0

  async function registrar(data) {
    const key = `${data.tipo}|${String(data.referenciaId)}`
    vistas.add(key)
    const previa = mapa.get(key)
    if (!previa) {
      await alertaDB.create(data)
      nuevas++
      return
    }
    const sube = (PESO_NIVEL[data.nivel] ?? 0) > (PESO_NIVEL[previa.nivel] ?? 0)
    if (sube) {
      await alertaDB.actualizar(previa.id, { nivel: data.nivel, mensaje: data.mensaje, leida: false })
      nuevas++
    } else if (!previa.leida && previa.mensaje !== data.mensaje) {
      await alertaDB.actualizar(previa.id, { mensaje: data.mensaje })
    }
  }

  /** Marca como leídas las alertas sin leer de estos tipos que ya no aplican (stock repuesto, EPP reemplazado…) */
  async function cerrarLasQueNoAplican(tipos) {
    const ids = []
    for (const [key, a] of mapa) {
      if (tipos.includes(a.tipo) && !a.leida && !vistas.has(key)) ids.push(a.id)
    }
    if (ids.length) await alertaDB.marcarLeidas(ids)
  }

  return { registrar, cerrarLasQueNoAplican, get nuevas() { return nuevas } }
}
