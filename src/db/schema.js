import Dexie from 'dexie'

const db = new Dexie('geppi_db')

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 1 — Esquema inicial completo
//  Nomenclatura de índices:
//    ++id        → clave primaria autoincremental
//    &campo      → índice único
//    campo       → índice simple (búsquedas y filtros)
//    [a+b]       → índice compuesto (consultas combinadas frecuentes)
// ─────────────────────────────────────────────────────────────────────────────
db.version(1).stores({

  // ── Organización ────────────────────────────────────────────────────────────
  empresa: [
    '++id',
    '&nit',          // NIT único por empresa
    'razonSocial',
    'estado',
  ].join(', '),

  sede: [
    '++id',
    'empresaId',     // FK empresa
    'nombre',
    'estado',
    '[empresaId+estado]',
  ].join(', '),

  centroDeTrabajo: [
    '++id',
    'sedeId',        // FK sede
    'nombre',
  ].join(', '),

  // ── Cargos ──────────────────────────────────────────────────────────────────
  cargo: [
    '++id',
    '&nombre',       // nombre de cargo único
    'estado',
  ].join(', '),

  // ── EPP (Elementos de Protección Personal) ──────────────────────────────────
  epp: [
    '++id',
    'item',          // número de ítem de la matriz (1-31)
    'nombre',
    'estado',
    'version',       // versión de la ficha técnica
  ].join(', '),

  // ── Matriz por Cargos: cruce cargo ↔ EPP ────────────────────────────────────
  asignacionCargoEpp: [
    '++id',
    'cargoId',
    'eppId',
    '[cargoId+eppId]',  // evita duplicados y acelera búsquedas cruzadas
    'vigente',
  ].join(', '),

  // ── Trabajadores ────────────────────────────────────────────────────────────
  trabajador: [
    '++id',
    '&cedula',       // cédula única
    'cargoId',
    'sedeId',
    'empresaId',
    'estado',
    '[sedeId+estado]',
    '[empresaId+estado]',
    '[cargoId+estado]',
  ].join(', '),

  // ── Inventario (stock actual por EPP × Sede) ─────────────────────────────────
  inventario: [
    '++id',
    'eppId',
    'sedeId',
    '[eppId+sedeId]', // el par EPP+Sede es la clave lógica del stock
  ].join(', '),

  // ── Kardex: cada movimiento de inventario ───────────────────────────────────
  movimientoInventario: [
    '++id',
    'inventarioId',
    'eppId',
    'sedeId',
    'tipo',          // ENTRADA | SALIDA | AJUSTE
    'fecha',
    'referenciaEntregaId',
    '[eppId+sedeId]',
    '[sedeId+fecha]',
  ].join(', '),

  // ── Entregas ────────────────────────────────────────────────────────────────
  entrega: [
    '++id',
    'trabajadorId',
    'cargoId',
    'sedeId',
    'empresaId',
    'fechaEntrega',
    'estado',        // FIRMADA | PENDIENTE | ANULADA
    '[trabajadorId+estado]',
    '[sedeId+fechaEntrega]',
    '[empresaId+fechaEntrega]',
  ].join(', '),

  // ── Detalle de cada EPP en una entrega ──────────────────────────────────────
  detalleEntrega: [
    '++id',
    'entregaId',
    'eppId',
    'fechaVencimiento',
    '[entregaId+eppId]',
    // índice para alertas de vencimiento: buscar todos los detalles por trabajador
    '[eppId+fechaVencimiento]',
  ].join(', '),

  // ── Firmas digitales ─────────────────────────────────────────────────────────
  firma: [
    '++id',
    '&entregaId',    // una firma por entrega
    'fechaCaptura',
  ].join(', '),

  // ── Alertas del sistema ───────────────────────────────────────────────────────
  alerta: [
    '++id',
    'tipo',
    'nivel',         // INFO | WARNING | CRITICO
    'leida',
    'sedeId',
    'trabajadorId',
    'referenciaId',
    'fechaGeneracion',
    '[leida+nivel]',
    '[sedeId+leida]',
    '[tipo+referenciaId]', // evita alertas duplicadas
  ].join(', '),

  // ── Gestión del Cambio documental ────────────────────────────────────────────
  gestionCambio: [
    '++id',
    'modulo',
    'codigoDocumento',
    'versionNueva',
    'fecha',
  ].join(', '),

  // ── Log de auditoría (inmutable) ─────────────────────────────────────────────
  auditoria: [
    '++id',
    'modulo',
    'accion',
    'usuarioId',
    'referenciaId',
    'fecha',
    '[modulo+fecha]',
  ].join(', '),

  // ── Usuarios del sistema ──────────────────────────────────────────────────────
  usuario: [
    '++id',
    '&correo',       // correo único como login
    'rol',
    'empresaId',
    'estado',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 2 — Checklist preoperacional de vehículos
// ─────────────────────────────────────────────────────────────────────────────
db.version(2).stores({

  // ── Vehículos ────────────────────────────────────────────────────────────────
  vehiculo: [
    '++id',
    '&placa',        // placa única
    'empresaId',
    'estado',
    '[empresaId+estado]',
  ].join(', '),

  // ── Checklist preoperacional diario ─────────────────────────────────────────
  checklistPreoperacional: [
    '++id',
    'vehiculoId',
    'empresaId',
    'conductorCedula',
    'fecha',
    '[empresaId+fecha]',
    '[vehiculoId+fecha]',
    '[conductorCedula+fecha]',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 3 — Plan Anual de Trabajo SST
// ─────────────────────────────────────────────────────────────────────────────
db.version(3).stores({
  planTrabajo: [
    '++id',
    'empresa',
    'estado',
    'mesEjecucion',
    'año',
    '[empresa+año]',
    '[mesEjecucion+año]',
    '[estado+año]',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 4 — Condiciones inseguras · Exámenes médicos · Configuración alertas
// ─────────────────────────────────────────────────────────────────────────────
db.version(4).stores({
  condicionInsegura: [
    '++id',
    'empresaId',
    'tipo',
    'estado',
    'prioridad',
    'fechaIdentificacion',
    '[empresaId+estado]',
    '[empresaId+tipo]',
  ].join(', '),

  examenMedico: [
    '++id',
    'trabajadorId',
    'empresaId',
    'tipo',
    'fechaVencimiento',
    'aptitudLaboral',
    '[trabajadorId+tipo]',
    '[empresaId+tipo]',
  ].join(', '),

  configuracionAlerta: [
    '++id',
    '&tipo',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 5 — reservada (tablas eliminadas en v6)
// ─────────────────────────────────────────────────────────────────────────────
db.version(5).stores({
  accidenteIncidente: '++id, empresaId, tipo, estado, fecha, trabajadorId, [empresaId+estado], [empresaId+tipo], [tipo+estado]',
  accionCorrectiva:   '++id, atItId, estado, responsable, fechaLimite, [atItId+estado]',
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 6 — Hallazgos AT/IT (MT-SST-013 Acciones Prev./Correc./Mejora)
// ─────────────────────────────────────────────────────────────────────────────
db.version(6).stores({
  accidenteIncidente: null,
  accionCorrectiva:   null,
  hallazgo: [
    '++id',
    'empresaId',
    'tipoAccion',    // AT | IT | AC | AM | AP
    'estado',        // ABIERTO | CERRADO
    'fechaEmision',
    '[empresaId+estado]',
    '[empresaId+tipoAccion]',
    '[tipoAccion+estado]',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 7 — Indicadores de Cumplimiento (Fichas Técnicas)
// ─────────────────────────────────────────────────────────────────────────────
db.version(7).stores({
  indicador: [
    '++id',
    'empresaId',
    'numero',
    '[empresaId+numero]',
  ].join(', '),

  datoIndicador: [
    '++id',
    'indicadorId',
    'mes',
    'año',
    '[indicadorId+año]',
  ].join(', '),

  planAccionIndicador: [
    '++id',
    'indicadorId',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 8 — Evaluación SG-SST Res. 0312 / 2019
// ─────────────────────────────────────────────────────────────────────────────
db.version(8).stores({
  evaluacionSGSST: [
    '++id',
    'empresaId',
    'año',
    '[empresaId+año]',
  ].join(', '),

  itemEvaluacion: [
    '++id',
    'evaluacionId',
    'codigo',
    '[evaluacionId+codigo]',
  ].join(', '),
})

// ─────────────────────────────────────────────────────────────────────────────
//  VERSIÓN 9 — Token de aceptación QR por trabajador
// ─────────────────────────────────────────────────────────────────────────────
db.version(9).stores({
  entrega: [
    '++id',
    'trabajadorId',
    'cargoId',
    'sedeId',
    'empresaId',
    'fechaEntrega',
    'estado',
    'tokenAceptacion',
    '[trabajadorId+estado]',
    '[sedeId+fechaEntrega]',
    '[empresaId+fechaEntrega]',
  ].join(', '),
})

export default db
