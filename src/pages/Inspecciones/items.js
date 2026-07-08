export const TIPOS_INSPECCION = [
  { value: 'EXTINTORES',  label: 'Extintores',        emoji: '🧯', color: '#EF4444', bg: 'bg-red-50    border-red-200'    },
  { value: 'BOTIQUIN',    label: 'Botiquín',           emoji: '🩺', color: '#F59E0B', bg: 'bg-amber-50  border-amber-200'  },
  { value: 'EPP',         label: 'EPP',                emoji: '🦺', color: '#3B82F6', bg: 'bg-blue-50   border-blue-200'   },
  { value: 'SEGURIDAD',   label: 'Seguridad General',  emoji: '🛡️', color: '#8B5CF6', bg: 'bg-purple-50 border-purple-200' },
  { value: 'ORDEN_ASEO',  label: 'Orden y Aseo',       emoji: '🧹', color: '#10B981', bg: 'bg-emerald-50 border-emerald-200'},
]

export const ITEMS_POR_TIPO = {
  EXTINTORES: [
    { id: 'ubicacion_accesible',    label: 'Ubicación visible y accesible' },
    { id: 'señalizacion',           label: 'Señalización adecuada' },
    { id: 'manometro_verde',        label: 'Manómetro en zona verde (cargado)' },
    { id: 'pasador_seguridad',      label: 'Pasador (pin) en su lugar y sello intacto' },
    { id: 'sin_daños',              label: 'Sin daños físicos (abolladuras, corrosión)' },
    { id: 'recarga_vigente',        label: 'Fecha de recarga vigente' },
    { id: 'etiqueta_inspeccion',    label: 'Etiqueta de inspección al día' },
    { id: 'manguera_estado',        label: 'Manguera y boquilla en buen estado' },
  ],
  BOTIQUIN: [
    { id: 'ubicacion_conocida',     label: 'Ubicación conocida por el personal' },
    { id: 'contenido_completo',     label: 'Contenido completo según dotación mínima' },
    { id: 'sin_vencidos',           label: 'Medicamentos e insumos sin vencer' },
    { id: 'guantes_disponibles',    label: 'Guantes de examen disponibles' },
    { id: 'gasa_vendas',            label: 'Gasas, vendas y apósitos suficientes' },
    { id: 'antisepticos',           label: 'Antisépticos (alcohol, agua oxigenada)' },
    { id: 'tijeras_pinzas',         label: 'Tijeras y pinzas en buen estado' },
    { id: 'registro_uso',           label: 'Registro de uso actualizado' },
  ],
  EPP: [
    { id: 'epp_entregados',         label: 'EPP entregados según cargo y MIPER' },
    { id: 'epp_buen_estado',        label: 'EPP en buen estado físico (sin deterioro)' },
    { id: 'uso_correcto',           label: 'Trabajadores usan EPP correctamente' },
    { id: 'almacenamiento',         label: 'EPP almacenados adecuadamente' },
    { id: 'capacitacion_uso',       label: 'Personal capacitado en uso de EPP' },
    { id: 'reposicion_al_dia',      label: 'Reposición de EPP deteriorados al día' },
    { id: 'registro_entrega',       label: 'Actas de entrega firmadas y archivadas' },
  ],
  SEGURIDAD: [
    { id: 'señalizacion_emergencia',label: 'Señalización de emergencia visible y clara' },
    { id: 'salidas_despejadas',     label: 'Salidas de emergencia despejadas' },
    { id: 'iluminacion',            label: 'Iluminación adecuada en todas las áreas' },
    { id: 'inst_electricas',        label: 'Instalaciones eléctricas en buen estado' },
    { id: 'equipos_emergencia',     label: 'Equipos de emergencia operativos' },
    { id: 'rutas_evacuacion',       label: 'Rutas de evacuación demarcadas' },
    { id: 'punto_encuentro',        label: 'Punto de encuentro señalizado' },
    { id: 'accesos_libres',         label: 'Accesos y pasillos libres de obstáculos' },
  ],
  ORDEN_ASEO: [
    { id: 'areas_limpias',          label: 'Áreas de trabajo limpias y ordenadas' },
    { id: 'materiales_organizados', label: 'Materiales clasificados y en su lugar' },
    { id: 'pasillos_despejados',    label: 'Pasillos y zonas comunes despejados' },
    { id: 'residuos_clasificados',  label: 'Residuos clasificados y en punto ecológico' },
    { id: 'herramientas_ordenadas', label: 'Herramientas y equipos ordenados' },
    { id: 'superficies_limpias',    label: 'Superficies de trabajo limpias' },
    { id: 'baños_limpios',          label: 'Baños e instalaciones sanitarias limpios' },
    { id: 'desinfeccion',           label: 'Programa de limpieza y desinfección activo' },
  ],
}

export function calcularCumplimiento(items = []) {
  // New extintores format: items[0] has extintorId + resultados map
  if (items[0]?.extintorId !== undefined) {
    let total = 0, cumple = 0
    for (const ext of items) {
      for (const val of Object.values(ext.resultados || {})) {
        if (val.resultado && val.resultado !== 'NO_APLICA') {
          total++
          if (val.resultado === 'CUMPLE') cumple++
        }
      }
    }
    return total > 0 ? Math.round(cumple / total * 100) : 0
  }
  // Regular format
  const aplicables = items.filter(i => i.resultado !== 'NO_APLICA' && i.resultado)
  const cumple     = aplicables.filter(i => i.resultado === 'CUMPLE').length
  if (aplicables.length === 0) return 0
  return Math.round((cumple / aplicables.length) * 100)
}
