// ─── IDENTIFICACIÓN DEL SISTEMA ─────────────────────────────────────────────

export const SISTEMA = {
  NOMBRE:             'GEPPI',
  NOMBRE_COMPLETO:    'Gestión de Elementos de Protección Personal Integrado',
  VERSION:            '1.0.0',
  EMPRESA_CLIENTE:    'Corporación para el Fomento del Bienestar Social',
  CODIGO_DOCUMENTO:   'MT-SST-005',
  VERSION_MATRIZ:     '007',
  FECHA_MATRIZ:       '15/05/2026',
  RESPONSABLE_MATRIZ: 'LILIAN LUCIA ORDÓÑEZ VERGARA',
  NORMATIVA:          'Decreto 1072/2015 | Resolución 0312/2019',
}

// ─── ESTADOS DE EPP (semáforo) ───────────────────────────────────────────────

export const ESTADO_EPP = {
  VIGENTE:         'VIGENTE',
  PROXIMO_VENCER:  'PROXIMO_VENCER',
  VENCIDO:         'VENCIDO',
  PENDIENTE:       'PENDIENTE',       // asignado al cargo pero sin entrega registrada
  SIN_ENTREGA:     'SIN_ENTREGA',     // nunca se ha entregado a este trabajador
}

/** Clases Tailwind CSS por estado — usar en Badge, Dot y tablas */
export const ESTADO_EPP_CLASES = {
  VIGENTE:        'bg-green-100 text-green-800 border border-green-200',
  PROXIMO_VENCER: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  VENCIDO:        'bg-red-100 text-red-800 border border-red-200',
  PENDIENTE:      'bg-slate-100 text-slate-600 border border-slate-200',
  SIN_ENTREGA:    'bg-slate-100 text-slate-500 border border-slate-200',
}

/** Color del punto (dot) en la UI */
export const ESTADO_EPP_DOT = {
  VIGENTE:        'bg-green-500',
  PROXIMO_VENCER: 'bg-yellow-500',
  VENCIDO:        'bg-red-500',
  PENDIENTE:      'bg-slate-400',
  SIN_ENTREGA:    'bg-slate-300',
}

/** Etiquetas en español para mostrar al usuario */
export const ESTADO_EPP_LABEL = {
  VIGENTE:        'Vigente',
  PROXIMO_VENCER: 'Próximo a vencer',
  VENCIDO:        'Vencido',
  PENDIENTE:      'Pendiente de entrega',
  SIN_ENTREGA:    'Sin entrega registrada',
}

// ─── ESTADOS DE INVENTARIO ────────────────────────────────────────────────────

export const ESTADO_STOCK = {
  OK:         'OK',
  BAJO:       'BAJO',
  AGOTADO:    'AGOTADO',
}

export const ESTADO_STOCK_CLASES = {
  OK:      'bg-green-100 text-green-800 border border-green-200',
  BAJO:    'bg-orange-100 text-orange-800 border border-orange-200',
  AGOTADO: 'bg-red-200 text-red-900 border border-red-300',
}

export const ESTADO_STOCK_LABEL = {
  OK:      'Disponible',
  BAJO:    'Bajo stock',
  AGOTADO: 'Agotado',
}

// ─── ESTADOS DE ENTREGA ───────────────────────────────────────────────────────

export const ESTADO_ENTREGA = {
  FIRMADA:         'FIRMADA',
  PENDIENTE:       'PENDIENTE',        // registrada pero sin firma
  PENDIENTE_FIRMA: 'PENDIENTE_FIRMA',  // esperando firma del trabajador vía QR
  ANULADA:         'ANULADA',
}

export const ESTADO_ENTREGA_CLASES = {
  FIRMADA:         'bg-green-100 text-green-800 border border-green-200',
  PENDIENTE:       'bg-slate-100 text-slate-600 border border-slate-200',
  PENDIENTE_FIRMA: 'bg-blue-100 text-blue-700 border border-blue-200',
  ANULADA:         'bg-red-100 text-red-700 border border-red-200',
}

export const ESTADO_ENTREGA_LABEL = {
  FIRMADA:         'Firmada',
  PENDIENTE:       'Pendiente de firma',
  PENDIENTE_FIRMA: 'Esperando firma QR',
  ANULADA:         'Anulada',
}

// ─── TIPOS DE MOVIMIENTO DE INVENTARIO ────────────────────────────────────────

export const TIPO_MOVIMIENTO = {
  ENTRADA: 'ENTRADA',   // compra / recepción de EPP
  SALIDA:  'SALIDA',    // entrega a trabajador
  AJUSTE:  'AJUSTE',    // corrección manual de inventario
}

export const TIPO_MOVIMIENTO_LABEL = {
  ENTRADA: 'Entrada',
  SALIDA:  'Salida',
  AJUSTE:  'Ajuste',
}

export const TIPO_MOVIMIENTO_CLASES = {
  ENTRADA: 'bg-green-100 text-green-800',
  SALIDA:  'bg-blue-100 text-blue-800',
  AJUSTE:  'bg-orange-100 text-orange-800',
}

// ─── ROLES DE USUARIO ─────────────────────────────────────────────────────────

export const ROL = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  SST:           'SST',
  ALMACEN:       'ALMACEN',
  SUPERVISOR:    'SUPERVISOR',
  TRABAJADOR:    'TRABAJADOR',  // solo lectura de su propio perfil (Fase 5)
}

export const ROL_LABEL = {
  ADMINISTRADOR: 'Administrador',
  SST:           'Profesional SST',
  ALMACEN:       'Almacén',
  SUPERVISOR:    'Supervisor',
  TRABAJADOR:    'Trabajador',
}

export const ROL_CLASES = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-800',
  SST:           'bg-blue-100 text-blue-800',
  ALMACEN:       'bg-orange-100 text-orange-800',
  SUPERVISOR:    'bg-teal-100 text-teal-800',
  TRABAJADOR:    'bg-slate-100 text-slate-700',
}

// ─── TIPOS DE ALERTA ─────────────────────────────────────────────────────────

export const TIPO_ALERTA = {
  VENCIMIENTO_EPP:      'VENCIMIENTO_EPP',
  VENCIMIENTO_DOTACION: 'VENCIMIENTO_DOTACION',
  STOCK_BAJO:           'STOCK_BAJO',
  STOCK_AGOTADO:        'STOCK_AGOTADO',
  ENTREGA_PENDIENTE:    'ENTREGA_PENDIENTE',
  FIRMA_PENDIENTE:      'FIRMA_PENDIENTE',
}

export const NIVEL_ALERTA = {
  INFO:      'INFO',
  WARNING:   'WARNING',
  CRITICO:   'CRITICO',
}

export const NIVEL_ALERTA_CLASES = {
  INFO:    'bg-blue-50 text-blue-800 border border-blue-200',
  WARNING: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  CRITICO: 'bg-red-50 text-red-800 border border-red-200',
}

export const NIVEL_ALERTA_DOT = {
  INFO:    'bg-blue-500',
  WARNING: 'bg-yellow-500',
  CRITICO: 'bg-red-500',
}

// ─── UMBRALES DE ALERTA (días) ────────────────────────────────────────────────

export const DIAS_ALERTA = {
  ADVERTENCIA: 30,   // badge amarillo — próximo a vencer
  CRITICO:     7,    // badge naranja/rojo — urgente
}

// ─── TIPOS DE CONTRATO ────────────────────────────────────────────────────────

export const TIPO_CONTRATO = [
  { value: 'INDEFINIDO',          label: 'Contrato a término indefinido' },
  { value: 'FIJO',                label: 'Contrato a término fijo' },
  { value: 'PRESTACION',         label: 'Prestación de servicios' },
  { value: 'APRENDIZAJE',        label: 'Contrato de aprendizaje' },
  { value: 'TEMPORAL',           label: 'Temporal / ocasional' },
  { value: 'OBRA_LABOR',         label: 'Obra o labor' },
]

// ─── SECTORES ECONÓMICOS ──────────────────────────────────────────────────────

export const SECTORES = [
  'Servicios de alimentación',
  'Industria manufacturera',
  'Comercio',
  'Salud',
  'Construcción',
  'Transporte y logística',
  'Educación',
  'Servicios generales',
  'Otro',
]

// ─── MÓDULOS DEL SISTEMA (para auditoría y gestión del cambio) ────────────────

export const MODULO = {
  DASHBOARD:       'DASHBOARD',
  EMPRESAS:        'EMPRESAS',
  SEDES:           'SEDES',
  TRABAJADORES:    'TRABAJADORES',
  CARGOS:          'CARGOS',
  MATRIZ_EPP:      'MATRIZ_EPP',
  MATRIZ_CARGOS:   'MATRIZ_CARGOS',
  INVENTARIO:      'INVENTARIO',
  ENTREGAS:        'ENTREGAS',
  HISTORIAL:       'HISTORIAL',
  REPORTES:        'REPORTES',
  ALERTAS:         'ALERTAS',
  GESTION_CAMBIO:  'GESTION_CAMBIO',
  AUDITORIA:       'AUDITORIA',
  CONFIGURACION:   'CONFIGURACION',
}

// ─── ACCIONES DE AUDITORÍA ────────────────────────────────────────────────────

export const ACCION = {
  CREAR:     'CREAR',
  EDITAR:    'EDITAR',
  ELIMINAR:  'ELIMINAR',
  IMPORTAR:  'IMPORTAR',
  EXPORTAR:  'EXPORTAR',
  FIRMAR:    'FIRMAR',
  ANULAR:    'ANULAR',
  LOGIN:     'LOGIN',
  LOGOUT:    'LOGOUT',
}

// ─── PAGINACIÓN ───────────────────────────────────────────────────────────────

export const PAGINAS_OPCIONES = [25, 50, 100]
export const PAGINA_DEFAULT  = 25

// ─── TEXTO LEGAL PARA EL PDF DE ENTREGA ──────────────────────────────────────

export const TEXTO_LEGAL_ENTREGA =
  'El trabajador declara haber recibido en perfectas condiciones los Elementos de ' +
  'Protección Personal relacionados en el presente documento, y haber recibido ' +
  'instrucción verbal sobre su correcto uso, mantenimiento, almacenamiento y ' +
  'disposición final, conforme a lo establecido en el Artículo 2.2.4.6.24 del ' +
  'Decreto 1072 de 2015 (Decreto Único Reglamentario del Sector Trabajo) y los ' +
  'Estándares Mínimos del SGSST según Resolución 0312 de 2019.'
