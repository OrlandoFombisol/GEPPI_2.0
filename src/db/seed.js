import { db } from './index'
import { TIPO_MOVIMIENTO, SISTEMA } from '@/constants'
import { addDays } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
//  DATOS SEMILLA — Basados en MT-SST-005 Versión 007
//  Solo se insertan si la DB está completamente vacía.
// ─────────────────────────────────────────────────────────────────────────────

const SEED_EMPRESA = {
  nit:               '900123456',
  razonSocial:       'Corporación para el Fomento del Bienestar Social',
  representanteLegal: 'LILIAN LUCIA ORDÓÑEZ VERGARA',
  direccion:         'Calle 10 # 15-30',
  ciudad:            'Bogotá',
  departamento:      'Bogotá D.C.',
  sector:            'Servicios de alimentación',
  estado:            'ACTIVO',
  fechaCreacion:     new Date().toISOString(),
}

const SEED_SEDES = [
  {
    nombre:         'Sede Principal Bogotá',
    direccion:      'Calle 10 # 15-30, Bogotá',
    municipio:      'Bogotá',
    departamento:   'Bogotá D.C.',
    responsableSst: 'Profesional SST',
    telefono:       '3001234567',
    estado:         'ACTIVO',
    fechaCreacion:  new Date().toISOString(),
  },
  {
    nombre:         'Sede Medellín',
    direccion:      'Carrera 45 # 30-10, Medellín',
    municipio:      'Medellín',
    departamento:   'Antioquia',
    responsableSst: 'Analista SST',
    telefono:       '3109876543',
    estado:         'ACTIVO',
    fechaCreacion:  new Date().toISOString(),
  },
]

// ── 5 EPP reales del archivo MT-SST-005 v007 ────────────────────────────────
const SEED_EPP = [
  {
    item:                  1,
    nombre:                'Mascarilla tapaboca en antifluido',
    descripcionFichaTecnica:
      'Material: malla fina de fibras de polímeros sintéticos. ' +
      'Resistente a fluidos y material particulado. Ajuste nasal metálico.',
    riesgoAsociado:        'Gases y vapores, material particulado, virus, bacterias.',
    partesCuerpo:          'Mucosas, vía aérea.',
    tiempoUsoRecomendado:  'Mientras se tenga contacto con sustancias químicas o material contaminado.',
    vidaUtil:              'Uso y desecho diario o cambio cuando el trabajador sienta dificultad al respirar.',
    vidaUtilDias:          1,
    disposicionFinal:      'Depositar en la caneca RESIDUOS NO APROVECHABLES.',
    normaAplicable:        '42 CFR 84 NIOSH (N95) y la Norma NTC 2561 (Tipo B)',
    imagenBase64:          null,
    estado:                'ACTIVO',
    version:               7,
    fechaCreacion:         new Date().toISOString(),
  },
  {
    item:                  2,
    nombre:                'Pantalón de drill',
    descripcionFichaTecnica:
      'Material: tela 100% algodón y poliéster. Resistente a rasgaduras. Color institucional.',
    riesgoAsociado:        'No aplica (dotación institucional).',
    partesCuerpo:          'Extremidades inferiores.',
    tiempoUsoRecomendado:  'Permanente durante la jornada laboral.',
    vidaUtil:              'Cada 3 meses serán dotados.',
    vidaUtilDias:          90,
    disposicionFinal:      'N.A.',
    normaAplicable:        'N.A.',
    imagenBase64:          null,
    estado:                'ACTIVO',
    version:               7,
    fechaCreacion:         new Date().toISOString(),
  },
  {
    item:                  5,
    nombre:                'Calzado de seguridad',
    descripcionFichaTecnica:
      'Materiales: Cuero, suela 100% PVC antideslizante, caña alta. ' +
      'Puntero de acero. Resistente a impactos y compresión.',
    riesgoAsociado:        'Riesgo locativo por tropezones, pisones, caídas, golpes.',
    partesCuerpo:          'Pies, falanges.',
    tiempoUsoRecomendado:
      '1. Mientras se permanezca en bodegas o zonas de operación. ' +
      '2. Al manipular cargas o maquinaria.',
    vidaUtil:              'Cada 4 meses será cambiada la dotación.',
    vidaUtilDias:          120,
    disposicionFinal:      'N.A.',
    normaAplicable:        'N.A.',
    imagenBase64:          null,
    estado:                'ACTIVO',
    version:               7,
    fechaCreacion:         new Date().toISOString(),
  },
  {
    item:                  6,
    nombre:                'Guantes de nitrilo',
    descripcionFichaTecnica:
      'Material: Nitrilo, neopreno, Nitrilite. ' +
      'Protección contra sustancias químicas, grasas y aceites.',
    riesgoAsociado:        'Dermatitis o quemaduras graves hasta intoxicaciones sistémicas.',
    partesCuerpo:          'Manos, falanges.',
    tiempoUsoRecomendado:
      '1. Mientras se tenga contacto con sustancias químicas. ' +
      '2. Mientras se manipulen desinfectantes.',
    vidaUtil:              'Solicitar cambio cuando el guante se dañe; se entregará de inmediato.',
    vidaUtilDias:          30,
    disposicionFinal:      'Depositar en la caneca residuos ordinario no utilizable.',
    normaAplicable:        'EN:388 4121',
    imagenBase64:          null,
    estado:                'ACTIVO',
    version:               7,
    fechaCreacion:         new Date().toISOString(),
  },
  {
    item:                  15,
    nombre:                'Casco de seguridad dieléctrico Tipo I Clase E y G',
    descripcionFichaTecnica:
      'Casco dieléctrico de polietileno de alta densidad. ' +
      'Clase E y G: protege contra riesgos eléctricos de alta y baja tensión.',
    riesgoAsociado:        'Golpes, impactos, riesgos eléctricos.',
    partesCuerpo:          'Cabeza, cráneo.',
    tiempoUsoRecomendado:  'Permanente en zonas de operación, bodegas y áreas de riesgo.',
    vidaUtil:              'Será cambiado por deterioro, impacto o pérdida.',
    vidaUtilDias:          1825,
    disposicionFinal:      'Entregar al supervisor HSEQ para disposición final.',
    normaAplicable:        'ANSI Z.89.1-2014 Tipo I Clase E y G',
    imagenBase64:          null,
    estado:                'ACTIVO',
    version:               7,
    fechaCreacion:         new Date().toISOString(),
  },
]

// ── 3 cargos con sus asignaciones reales de la Matriz por Cargos ─────────────
const SEED_CARGOS = [
  { nombre: 'ALMACENISTA',        descripcion: 'Responsable del control y despacho de mercancía en bodega.', nivel: 'Operativo',  estado: 'ACTIVO' },
  { nombre: 'AUXILIAR DE COCINA', descripcion: 'Apoya la preparación y servicio de alimentos.',             nivel: 'Operativo',  estado: 'ACTIVO' },
  { nombre: 'CONDUCTOR I',        descripcion: 'Conduce vehículos de carga y distribución.',                nivel: 'Operativo',  estado: 'ACTIVO' },
]

// Asignaciones según la Matriz por Cargos real del MT-SST-005 v007
// (EPP por nombre, se cruzan con los IDs reales al insertar)
const SEED_ASIGNACIONES_POR_CARGO = {
  'ALMACENISTA':        ['Mascarilla tapaboca en antifluido', 'Calzado de seguridad', 'Casco de seguridad dieléctrico Tipo I Clase E y G'],
  'AUXILIAR DE COCINA': ['Mascarilla tapaboca en antifluido', 'Pantalón de drill', 'Guantes de nitrilo'],
  'CONDUCTOR I':        ['Mascarilla tapaboca en antifluido', 'Pantalón de drill', 'Calzado de seguridad', 'Casco de seguridad dieléctrico Tipo I Clase E y G'],
}

// ── 4 trabajadores de prueba ──────────────────────────────────────────────────
const SEED_TRABAJADORES_BASE = [
  {
    cedula:        '12345678',
    nombres:       'Juan Carlos',
    apellidos:     'Martínez Gómez',
    cargoNombre:   'ALMACENISTA',
    sedeIndex:     0,
    fechaIngreso:  '2023-03-15',
    tipoContrato:  'INDEFINIDO',
    correo:        'j.martinez@empresa.com',
    telefono:      '3001234567',
    estado:        'ACTIVO',
  },
  {
    cedula:        '98765432',
    nombres:       'María Fernanda',
    apellidos:     'López García',
    cargoNombre:   'AUXILIAR DE COCINA',
    sedeIndex:     0,
    fechaIngreso:  '2024-01-10',
    tipoContrato:  'FIJO',
    correo:        'mf.lopez@empresa.com',
    telefono:      '3109876543',
    estado:        'ACTIVO',
  },
  {
    cedula:        '55566677',
    nombres:       'Pedro Antonio',
    apellidos:     'Rodríguez Silva',
    cargoNombre:   'CONDUCTOR I',
    sedeIndex:     1,
    fechaIngreso:  '2022-07-20',
    tipoContrato:  'INDEFINIDO',
    correo:        'p.rodriguez@empresa.com',
    telefono:      '3205551234',
    estado:        'ACTIVO',
  },
  {
    cedula:        '1006789123',
    nombres:       'Orlando',
    apellidos:     'Mármol',
    cargoNombre:   'ALMACENISTA',
    sedeIndex:     0,
    fechaIngreso:  '2024-03-01',
    tipoContrato:  'INDEFINIDO',
    correo:        'orlando.marmol@empresa.com',
    telefono:      '3001234568',
    estado:        'ACTIVO',
  },
]

// Token fijo para pruebas — URL: /aceptar/demo-orlando-2026
const TOKEN_PRUEBA_ORLANDO = 'demo-orlando-2026'

// ── Historial de gestión del cambio (hoja "GESTION DEL CAMBIO" del Excel) ────
const SEED_GESTION_CAMBIO = [
  { descripcionCambio: 'Se estableció documento SIME-001. Matriz de EPP',                                                          codigoDocumento: 'SIME-001',   versionNueva: '001', fecha: '2023-06-19T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Se estableció documento SG-ME-002. Matriz de EPP',                                                         codigoDocumento: 'SG-ME-002',  versionNueva: '002', fecha: '2023-01-19T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Se estableció documento MT-SST-005 versión 003. Matriz de EPP',                                            codigoDocumento: 'MT-SST-005', versionNueva: '003', fecha: '2024-08-27T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Se actualizó matriz de EPP por accidente de la señora Erika. Se revisan elementos y procedimientos.',      codigoDocumento: 'MT-SST-005', versionNueva: '004', fecha: '2025-01-10T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Según los cambios realizados en la empresa y la nueva infraestructura se actualizaron los EPP requeridos.', codigoDocumento: 'MT-SST-005', versionNueva: '005', fecha: '2025-07-22T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Se establece la matriz de EPP con los cargos actualizados de la organización.',                            codigoDocumento: 'MT-SST-005', versionNueva: '006', fecha: '2025-01-26T00:00:00.000Z', responsable: 'SST' },
  { descripcionCambio: 'Se incluyó la columna RIESGO, LUGAR DEL PARTE DEL CUERPO A PROTEGER, TIEMPO DE USO RECOMENDADO y NORMA.', codigoDocumento: 'MT-SST-005', versionNueva: '007', fecha: '2026-05-15T00:00:00.000Z', responsable: 'LILIAN LUCIA ORDÓÑEZ VERGARA' },
]

// ─────────────────────────────────────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export async function initAdminUser() {
  try {
    const existe = await db.usuario.where('correo').equals('admin@geppi.co').count()
    if (existe > 0) return
    await db.usuario.add({
      nombre:        'Administrador',
      correo:        'admin@geppi.co',
      password:      'admin123',
      rol:           'ADMINISTRADOR',
      estado:        'ACTIVO',
      ultimoAcceso:  null,
      fechaCreacion: new Date().toISOString(),
    })
    console.log('[GEPPI Seed] Usuario admin creado — correo: admin@geppi.co, clave: admin123')
  } catch (e) {
    console.warn('[GEPPI Seed] No se pudo crear usuario admin:', e)
  }
}

export async function initSeedData() {
  try {
    // Garantizar que exista al menos un usuario administrador
    await initAdminUser()

    // Solo ejecutar si la DB está vacía
    const totalEmpresas = await db.empresa.count()
    if (totalEmpresas > 0) {
      console.log('[GEPPI Seed] Base de datos ya tiene datos. Seed omitido.')
      return { omitido: true }
    }

    console.log('[GEPPI Seed] Inicializando datos de prueba...')

    return await db.transaction(
      'rw',
      db.empresa,
      db.sede,
      db.cargo,
      db.epp,
      db.asignacionCargoEpp,
      db.trabajador,
      db.inventario,
      db.movimientoInventario,
      db.gestionCambio,
      db.entrega,
      db.detalleEntrega,
      async () => {
        // 1. Empresa
        const empresaId = await db.empresa.add(SEED_EMPRESA)

        // 2. Sedes
        const sedeIds = []
        for (const sede of SEED_SEDES) {
          const id = await db.sede.add({ ...sede, empresaId })
          sedeIds.push(id)
        }

        // 3. EPP
        const eppMap = {} // nombre → id
        for (const epp of SEED_EPP) {
          const id = await db.epp.add(epp)
          eppMap[epp.nombre] = id
        }

        // 4. Cargos + Asignaciones
        const cargoMap = {} // nombre → id
        for (const cargo of SEED_CARGOS) {
          const id = await db.cargo.add({ ...cargo, fechaCreacion: new Date().toISOString() })
          cargoMap[cargo.nombre] = id

          const eppNombres = SEED_ASIGNACIONES_POR_CARGO[cargo.nombre] || []
          for (const eppNombre of eppNombres) {
            const eppId = eppMap[eppNombre]
            if (eppId) {
              await db.asignacionCargoEpp.add({
                cargoId:         id,
                eppId,
                vigente:         true,
                obligatorio:     true,
                cantidadEntrega: 1,
                fechaCreacion:   new Date().toISOString(),
              })
            }
          }
        }

        // 5. Trabajadores
        const trabajadorIds = {}
        for (const t of SEED_TRABAJADORES_BASE) {
          const { cargoNombre, sedeIndex, ...resto } = t
          const tid = await db.trabajador.add({
            ...resto,
            cargoId:       cargoMap[cargoNombre],
            sedeId:        sedeIds[sedeIndex],
            empresaId,
            fechaCreacion: new Date().toISOString(),
          })
          trabajadorIds[t.cedula] = tid
        }

        // 5b. Entrega PENDIENTE_FIRMA para Orlando (demo QR)
        const orlandoId  = trabajadorIds['1006789123']
        const cargoAlmId = cargoMap['ALMACENISTA']
        if (orlandoId && cargoAlmId) {
          const entregaId = await db.entrega.add({
            trabajadorId:      orlandoId,
            cargoId:           cargoAlmId,
            sedeId:            sedeIds[0],
            empresaId,
            fechaEntrega:      new Date().toISOString(),
            estado:            'PENDIENTE_FIRMA',
            observaciones:     'Dotación inicial — generada automáticamente para prueba QR',
            responsableNombre: 'Administrador GEPPI',
            usuarioEntregaId:  null,
            pdfGenerado:       false,
            tokenAceptacion:   TOKEN_PRUEBA_ORLANDO,
          })
          const eppNombres = SEED_ASIGNACIONES_POR_CARGO['ALMACENISTA']
          for (const eppNombre of eppNombres) {
            const eppId  = eppMap[eppNombre]
            const epp    = SEED_EPP.find(e => e.nombre === eppNombre)
            if (!eppId) continue
            const fv = new Date()
            fv.setDate(fv.getDate() + (epp?.vidaUtilDias || 365))
            await db.detalleEntrega.add({
              entregaId,
              eppId,
              cantidad:         1,
              vidaUtilDias:     epp?.vidaUtilDias || 365,
              fechaVencimiento: fv.toISOString(),
              disposicionFinal: epp?.disposicionFinal || null,
              observaciones:    null,
            })
          }
        }

        // 6. Inventario inicial — 50 unidades por EPP en cada sede
        for (const eppNombre of Object.keys(eppMap)) {
          const eppId = eppMap[eppNombre]
          for (const sedeId of sedeIds) {
            const invId = await db.inventario.add({
              eppId,
              sedeId,
              stockActual:              50,
              stockMinimo:              10,
              unidadMedida:             'Unidad',
              fechaUltimaActualizacion: new Date().toISOString(),
            })
            await db.movimientoInventario.add({
              inventarioId:  invId,
              eppId,
              sedeId,
              tipo:          TIPO_MOVIMIENTO.ENTRADA,
              cantidad:      50,
              saldoAnterior: 0,
              saldoPosterior: 50,
              proveedor:     'Stock inicial de prueba',
              costoUnitario: null,
              fecha:         new Date().toISOString(),
            })
          }
        }

        // 7. Gestión del cambio histórica
        for (const cambio of SEED_GESTION_CAMBIO) {
          await db.gestionCambio.add({
            ...cambio,
            modulo:         'MATRIZ_EPP',
            versionAnterior: cambio.versionNueva === '001' ? null :
              String(parseInt(cambio.versionNueva) - 1).padStart(3, '0'),
          })
        }

        console.log('[GEPPI Seed] ✓ Datos de prueba insertados correctamente.')
        return {
          empresaId,
          sedes:          sedeIds.length,
          epps:           Object.keys(eppMap).length,
          cargos:         Object.keys(cargoMap).length,
          trabajadores:   SEED_TRABAJADORES_BASE.length,
          cambiosDocumentales: SEED_GESTION_CAMBIO.length,
        }
      }
    )
  } catch (error) {
    console.error('[GEPPI Seed] Error al inicializar datos:', error)
    throw error
  }
}

export default initSeedData
