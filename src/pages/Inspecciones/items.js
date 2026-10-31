export const TIPOS_INSPECCION = [
  { value: 'EXTINTORES',  label: 'Extintores',        emoji: '🧯', color: '#EF4444', bg: 'bg-red-50    border-red-200'    },
  { value: 'BOTIQUIN',    label: 'Botiquín',           emoji: '🩺', color: '#F59E0B', bg: 'bg-amber-50  border-amber-200'  },
  { value: 'EPP',         label: 'EPP',                emoji: '🦺', color: '#3B82F6', bg: 'bg-blue-50   border-blue-200'   },
  { value: 'SEGURIDAD',   label: 'Seguridad General',  emoji: '🛡️', color: '#8B5CF6', bg: 'bg-purple-50 border-purple-200' },
  { value: 'ORDEN_ASEO',  label: 'Orden y Aseo',       emoji: '🧹', color: '#10B981', bg: 'bg-emerald-50 border-emerald-200'},
]

export const ITEMS_POR_TIPO = {
  EXTINTORES: [
    { id: 'ubicacion_accesible',    label: 'Ubicado en su sitio, a la vista y con acceso libre' },
    { id: 'señalizacion',           label: 'Señalización visible (fotoluminiscente donde haya poca luz)' },
    { id: 'proteccion_intemperie',  label: 'Protegido del sol, la lluvia y el salitre' },
    { id: 'manometro_verde',        label: 'Manómetro en zona verde y aguja libre' },
    { id: 'pasador_seguridad',      label: 'Pasador y precinto completos' },
    { id: 'sin_daños',              label: 'Cilindro sin corrosión por salitre ni abolladuras' },
    { id: 'manguera_estado',        label: 'Manguera sin resecamiento y boquilla destapada' },
    { id: 'agente_adecuado',        label: 'Agente adecuado al riesgo (K en cocinas, CO₂ en tableros)' },
    { id: 'recarga_vigente',        label: 'Recarga vigente (máx. 12 meses)' },
    { id: 'etiqueta_inspeccion',    label: 'Tarjeta de inspección mensual firmada' },
  ],
  BOTIQUIN: [
    // Ubicación y control
    { id: 'ubicacion_senalizada',   label: 'Botiquín señalizado, a la vista y sin llave ni candado' },
    { id: 'lugar_fresco',           label: 'En lugar fresco y seco: lejos del sol, del fogón y de la humedad' },
    { id: 'responsable_brigadista', label: 'Brigadista o responsable de turno identificado' },
    { id: 'registro_uso',           label: 'Registro de uso y reposición diligenciado' },
    { id: 'directorio_emergencia',  label: 'Directorio a la vista: 123, ARL, EPS y centro de salud más cercano' },
    // Curación de heridas
    { id: 'gasas_esteriles',        label: 'Gasas estériles y apósitos (mín. 10 sobres)' },
    { id: 'vendas_elasticas',       label: 'Vendas elásticas de 2", 3" y 5" y venda triangular' },
    { id: 'esparadrapo_curitas',    label: 'Esparadrapo, micropore y curitas suficientes' },
    { id: 'solucion_salina',        label: 'Solución salina para lavar heridas y ojos' },
    { id: 'antiseptico',            label: 'Antiséptico (yodopovidona o clorhexidina) sin vencer' },
    // Cocinas y planta (quemaduras y cortes)
    { id: 'quemaduras',             label: 'Gel o apósitos para quemaduras (cocinas, fogones y freidoras)' },
    { id: 'guantes_nitrilo',        label: 'Guantes de nitrilo (no látex) en varias tallas' },
    { id: 'tijeras_pinzas',         label: 'Tijeras de punta roma, pinzas y termómetro digital' },
    // Calor y clima del Caribe
    { id: 'suero_oral',             label: 'Sales de rehidratación oral para golpe de calor y deshidratación' },
    { id: 'repelente',              label: 'Repelente de insectos (dengue y chikunguña)' },
    { id: 'bloqueador',             label: 'Bloqueador solar para trabajo al aire libre (rutas, cargue y descargue)' },
    { id: 'compresas_frias',        label: 'Compresas frías instantáneas' },
    // Inmovilización y protección
    { id: 'inmovilizacion',         label: 'Inmovilizadores o férulas y collar cervical (planta y bodegas)' },
    { id: 'tapabocas_rcp',          label: 'Tapabocas y máscara para RCP' },
    { id: 'bolsa_roja',             label: 'Bolsa roja para residuos biológicos' },
    // Estado general
    { id: 'sin_vencidos',           label: 'Ningún insumo vencido, húmedo ni con el empaque roto' },
    { id: 'sin_medicamentos',       label: 'Sin medicamentos de venta libre sin control (solo lo autorizado por SST)' },
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
