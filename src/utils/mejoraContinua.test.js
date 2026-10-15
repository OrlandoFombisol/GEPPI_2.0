import { describe, it, expect } from 'vitest'
import { limpiarTitulo, clasificarArea, fechaEnBogota, agruparPorDia } from './mejoraContinua'

describe('limpiarTitulo', () => {
  it('quita prefijos técnicos de commit', () => {
    expect(limpiarTitulo('feat: agregar módulo de alertas')).toBe('Agregar módulo de alertas')
    expect(limpiarTitulo('fix(entregas): corrige cálculo de stock')).toBe('Corrige cálculo de stock')
    expect(limpiarTitulo('chore: actualizar dependencias')).toBe('Actualizar dependencias')
  })

  it('quita menciones a herramientas de IA sin dejar rastro', () => {
    expect(limpiarTitulo('Corrige bug en login (con ayuda de ChatGPT)')).toBe('Corrige bug en login')
    expect(limpiarTitulo('feat: agrega validación generada con Claude')).toBe('Agrega validación')
    expect(limpiarTitulo('Mejora el formulario usando Copilot')).toBe('Mejora el formulario')
    expect(limpiarTitulo('Ajusta estilos - IA')).not.toMatch(/\bia\b/i)
  })
})

describe('clasificarArea', () => {
  it('clasifica por la primera palabra clave que coincide', () => {
    expect(clasificarArea('fix: corrige inspección de extintores')).toBe('Inspecciones')
    expect(clasificarArea('feat: nueva entrega de EPP')).toBe('Entregas y matriz de EPP')
    expect(clasificarArea('chore: ajustar permisos de rol administrador')).toBe('Seguridad y acceso')
  })

  it('usa General cuando ninguna palabra clave coincide', () => {
    expect(clasificarArea('ajustar espaciado del logo')).toBe('General')
  })
})

describe('fechaEnBogota — medianoche en la zona horaria', () => {
  it('ubica un commit cerca de medianoche UTC en el día correcto de Bogotá (UTC-5)', () => {
    // 2026-10-14T02:30:00Z es 2026-10-13 21:30 en Bogotá (UTC-5) → debe quedar el día 13
    expect(fechaEnBogota('2026-10-14T02:30:00Z')).toBe('2026-10-13')
    // 2026-10-14T05:30:00Z es 2026-10-14 00:30 en Bogotá → ya cruzó al día 14
    expect(fechaEnBogota('2026-10-14T05:30:00Z')).toBe('2026-10-14')
  })

  it('respeta el offset ya incluido en una fecha ISO de git', () => {
    // Commit hecho con reloj en UTC-3 a las 23:50 → son las 21:50 en Bogotá, mismo día
    expect(fechaEnBogota('2026-10-13T23:50:00-03:00')).toBe('2026-10-13')
  })
})

describe('agruparPorDia', () => {
  it('incluye un día que solo tiene notas, sin commits', () => {
    const dias = agruparPorDia([], [
      { id: 1, fecha: '2026-10-10', tipo: 'SOPORTE', titulo: 'Capacitación al equipo de SST', detalle: '' },
    ])
    expect(dias).toHaveLength(1)
    expect(dias[0].fecha).toBe('2026-10-10')
    expect(dias[0].mejoras).toEqual([])
    expect(dias[0].notas).toHaveLength(1)
    expect(dias[0].notas[0].tipoLabel).toBe('Soporte')
  })

  it('ordena los días de más reciente a más antiguo', () => {
    const dias = agruparPorDia([
      { hash: 'a', fecha: '2026-10-01', titulo: 'feat: a', archivos: 1, agregadas: 5, quitadas: 0 },
      { hash: 'b', fecha: '2026-10-05', titulo: 'feat: b', archivos: 1, agregadas: 2, quitadas: 1 },
    ], [])
    expect(dias.map(d => d.fecha)).toEqual(['2026-10-05', '2026-10-01'])
  })
})
