import { useState, useEffect, useCallback } from 'react'
import { format, startOfDay, startOfMonth, subMonths, isSameMonth } from 'date-fns'
import { es }          from 'date-fns/locale'
import {
  trabajadorDB, entregaDB, inventarioDB, detalleEntregaDB,
  alertaDB, eppDB, sedeDB, empresaDB,
} from '@/db'
import { calcularEstadoEPP, diasParaVencimiento } from '@/utils/dates'
import { ESTADO_EPP, ESTADO_EPP_LABEL, NIVEL_ALERTA } from '@/constants'

export function useDashboardData() {
  const [datos,   setDatos]   = useState(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const hoy      = startOfDay(new Date())
      const inicioMes = startOfMonth(new Date())

      // ── Carga paralela de todas las tablas ────────────────────────────────
      const [trabajadores, entregas, detalles, inventario, alertas, epps, sedes, empresas] =
        await Promise.all([
          trabajadorDB.getAll(),
          entregaDB.getAll(),
          detalleEntregaDB.getAll(),
          inventarioDB.getAll(),
          alertaDB.getAll(),
          eppDB.getAll(),
          sedeDB.getAll(),
          empresaDB.getAll(),
        ])

      const eppMap  = Object.fromEntries((epps  || []).map(e => [e.id, e]))
      const sedeMap = Object.fromEntries((sedes || []).map(s => [s.id, s.nombre]))

      // ── KPIs ─────────────────────────────────────────────────────────────
      const trabajadoresActivos = (trabajadores || []).filter(t => t.estado === 'ACTIVO').length
      const entregasEsteMes     = (entregas     || []).filter(e =>
        e.fechaEntrega && new Date(e.fechaEntrega) >= inicioMes
      ).length

      const ahora = Date.now()
      const lim30 = ahora + 30 * 86400000
      let eppVencidos = 0, eppProximos = 0
      ;(detalles || []).forEach(d => {
        if (!d.fechaVencimiento) return
        const fv = new Date(d.fechaVencimiento).getTime()
        if (fv < ahora)  eppVencidos++
        else if (fv <= lim30) eppProximos++
      })

      const stockCritico   = (inventario || []).filter(i =>
        i.stockActual <= (i.stockMinimo ?? 5)
      ).length
      const alertasNoLeidas = (alertas || []).filter(a => a.leida === 0 || a.leida === false).length

      // ── Chart 1: Entregas por mes (últimos 6 meses) ───────────────────────
      const chartEntregas = Array.from({ length: 6 }, (_, i) => {
        const mes = subMonths(new Date(), 5 - i)
        return {
          mes:      format(mes, 'MMM yy', { locale: es }),
          cantidad: (entregas || []).filter(e =>
            e.fechaEntrega && isSameMonth(new Date(e.fechaEntrega), mes)
          ).length,
        }
      })

      // ── Chart 2: Estado semáforo de EPP entregados (Pie) ─────────────────
      const estadosCount = { VIGENTE: 0, PROXIMO_VENCER: 0, VENCIDO: 0, SIN_ENTREGA: 0 }
      ;(detalles || []).forEach(d => {
        const estado = calcularEstadoEPP(d.fechaVencimiento)
        estadosCount[estado] = (estadosCount[estado] || 0) + 1
      })
      const chartEstados = [
        { estado: ESTADO_EPP.VIGENTE,        fill: '#22c55e' },
        { estado: ESTADO_EPP.PROXIMO_VENCER, fill: '#f59e0b' },
        { estado: ESTADO_EPP.VENCIDO,        fill: '#ef4444' },
        { estado: ESTADO_EPP.SIN_ENTREGA,    fill: '#94a3b8' },
      ]
        .map(({ estado, fill }) => ({
          name:  ESTADO_EPP_LABEL[estado],
          value: estadosCount[estado] || 0,
          fill,
        }))
        .filter(d => d.value > 0)

      // ── Chart 3: Inventario crítico (8 con menos stock / mínimo) ─────────
      const chartInventario = (inventario || [])
        .map(inv => {
          const epp = eppMap[inv.eppId]
          const min = inv.stockMinimo ?? 5
          return {
            nombre:  (epp?.nombre || '—').substring(0, 26),
            stock:   inv.stockActual,
            minimo:  min,
            sedeNombre: sedeMap[inv.sedeId] || '—',
          }
        })
        .sort((a, b) => (a.stock / Math.max(a.minimo, 1)) - (b.stock / Math.max(b.minimo, 1)))
        .slice(0, 8)

      // ── Alertas recientes (últimas 5 no leídas) ───────────────────────────
      const alertasRecientes = (alertas || [])
        .filter(a => a.leida === 0 || a.leida === false)
        .slice(0, 5)

      // ── Lista EPP próximos a vencer (widget detallado) ────────────────────
      const trabajadorMap = Object.fromEntries(
        (trabajadores || []).map(t => [t.id, t])
      )
      const entregaMap = Object.fromEntries(
        (entregas || []).map(e => [e.id, e])
      )
      const eppProximosLista = (detalles || [])
        .filter(d => {
          if (!d.fechaVencimiento) return false
          const estado = calcularEstadoEPP(d.fechaVencimiento)
          return estado === 'VENCIDO' || estado === 'PROXIMO_VENCER'
        })
        .map(d => {
          const entrega   = entregaMap[d.entregaId] || {}
          const trab      = trabajadorMap[entrega.trabajadorId] || {}
          const epp       = eppMap[d.eppId] || {}
          const dias      = diasParaVencimiento(d.fechaVencimiento)
          const estado    = calcularEstadoEPP(d.fechaVencimiento)
          return {
            id:         d.id,
            eppNombre:  epp.nombre     || '—',
            esDotacion: epp.esDotacion || false,
            trabajador: trab.nombres ? `${trab.nombres} ${trab.apellidos}` : '—',
            fechaVence: d.fechaVencimiento,
            dias,
            estado,
          }
        })
        .sort((a, b) => (a.dias ?? 999) - (b.dias ?? 999))
        .slice(0, 8)

      // ── Resumen del sistema ───────────────────────────────────────────────
      const empresa   = (empresas || [])[0] || null
      const sedesActivas = (sedes || []).filter(s => s.estado === 'ACTIVO').length

      setDatos({
        kpis: {
          trabajadoresActivos,
          entregasEsteMes,
          eppVencidos,
          eppProximos,
          stockCritico,
          alertasNoLeidas,
          totalEntregas:   (entregas || []).length,
          totalEPP:        (epps     || []).filter(e => e.estado === 'ACTIVO').length,
        },
        chartEntregas,
        chartEstados,
        chartInventario,
        alertasRecientes,
        eppProximosLista,
        empresa,
        sedesActivas,
        ultimaActualizacion: new Date(),
      })
    } catch (err) {
      console.error('[GEPPI Dashboard]', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { datos, loading, recargar: cargar }
}
