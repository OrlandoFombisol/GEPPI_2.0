# Duvan esto es todo lo que necesitas saber de GEPPI antes de arrancar

Duvan, te dejo esto porque entrego el proyecto y quiero que lo recibas sabiendo exactamente en qué terreno pisas, ni mejor ni peor de lo que es. Llevo un buen rato metido revisando módulo por módulo, probando cosas, arreglando lo que se podía arreglar en el tiempo que tenía, y este documento es el resumen honesto de todo eso. No es un manual de usuario ni una presentación bonita para mostrarle a un cliente. Es lo que a mí me hubiera gustado que alguien me dejara escrito antes de meterme a un proyecto que no empecé yo.

Va todo en un solo archivo a propósito: reglas de negocio, deuda técnica, pendientes, y mis notas personales. No quiero que tengas que andar abriendo cinco documentos distintos para entender una cosa.

Una cosa importante antes de que sigas: el acceso que te di al repo es hasta el viernes, ese día te lo quito. No tiene mucho sentido dejarlo abierto más tiempo porque de ahí en adelante esto queda en manos tuyas y de tu equipo, ustedes van a tomar su propio rumbo con su propia arquitectura, y de paso el repo sigue conectado en vivo al deploy de Vercel y a la base de datos real de Supabase, así que tampoco tiene sentido dejar acceso de escritura abierto ahí una vez ya tengas lo que necesitas. Nada personal, es solo orden. Clona todo o descárgalo ya, el código completo y este documento incluido, y revisa cualquier duda antes del viernes, porque después de eso el repo queda cerrado de mi lado.

---

## Cómo levantar esto en tu máquina

Esta parte te la dejo como referencia, no como algo que tengas que dominar. Si vas a construir el backend nuevo para integrarlo a la arquitectura de la ERP de ustedes, no vas a seguir operando este mismo Vercel ni esta misma base de Supabase a largo plazo, así que no necesitas memorizar sus mañas. De hecho, por eso mismo frené el camino hacia .NET y AWS que había arrancado al principio: no conocía la arquitectura real de la ERP de ustedes, y no tenía sentido construir a ciegas hacia una infraestructura que a lo mejor no iba a encajar con la de ustedes. Preferí dejarte algo liviano y bien documentado para que tú decidas el backend real ya sabiendo lo que de verdad necesitas, en vez de que heredaras una decisión de infraestructura mía que pudiera no servirte.

Dicho eso, si en algún momento quieres ver el sistema corriendo con datos reales para contrastarlo contra lo que lees en las reglas de negocio, puedes hacerlo. Es un proyecto React (Vite) que habla directo contra Supabase, sin backend propio, ya te cuento más abajo por qué eso importa. Para correrlo local:

1. Clona el repo (`GEPPI_2.0`).
2. `npm install`.
3. Te voy a pasar las variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`) por un canal aparte, no las voy a dejar escritas en este documento ni en el repo. Van en un archivo `.env.local` en la raíz del repo (no hay carpetas separadas de frontend/backend, todo está plano). Revisa el `.env.example` que sí está en el repo para ver el formato exacto.
4. `npm run dev` y listo, te debería abrir en `localhost:5173` o el puerto que Vite tenga libre.

El deploy en vivo está en Vercel (`geppi-2-0.vercel.app`), conectado por GitHub al repo. Cada push a `main` dispara un build automático. A veces ese auto-deploy no se dispara solo, me pasó varias veces sin razón clara, así que si ves que un push no se refleja en el sitio, no te vuelvas loco buscando el error. Simplemente corre `vercel --prod` manual desde tu máquina y ya. No es un bug tuyo, es algo raro de la integración que nunca terminé de diagnosticar.

## El stack técnico, pieza por pieza

Antes de que llegues a cualquier conclusión, te quiero dejar exactamente qué hay por debajo de esto: lenguaje, herramientas, base de datos, todo. Sin ambigüedad.

**Lenguaje:** JavaScript (ES2023+) con JSX, no TypeScript. Sí tiene instalados los tipos de React (`@types/react`, `@types/react-dom`) como dependencia de desarrollo, pero solo para que el editor autocomplete mejor. El proyecto no compila con `tsc`, no hay ni un solo archivo `.ts`/`.tsx`.

**Frontend:**
- **React 19.2** como librería de interfaz.
- **Vite 8** como herramienta de build y servidor de desarrollo.
- **React Router DOM 7** para el enrutamiento entre pantallas.
- **Tailwind CSS 3.4** para todos los estilos (sin CSS-in-JS, sin componentes de UI de terceros tipo Material o Ant; los componentes de interfaz reutilizables, como botones, modales o badges, están hechos a mano en `src/components/ui`).
- **Framer Motion 12** para las animaciones y transiciones.
- **react-hook-form 7** para el manejo de formularios (validaciones, estado de campos).
- **Recharts 3** para las gráficas (cumplimiento mensual, indicadores).
- **lucide-react** para los íconos.

**Herramientas específicas de negocio, no genéricas de cualquier app:**
- **xlsx (SheetJS)**, para importar y exportar todos los Excel del sistema (matriz de EPP, trabajadores, exámenes médicos, reportes, etc.).
- **jsPDF + jspdf-autotable**, para generar los PDF (actas de entrega, informes).
- **qrcode**, para generar los códigos QR (firma remota de entregas, acceso al checklist de vehículos).
- **jsQR**, para leer y escanear códigos QR desde la cámara (el lector de carné del trabajador en el flujo de Entregas).
- **date-fns**, para todo el manejo de fechas y cálculo de vencimientos.
- **html2canvas**, usado en la generación de algunos PDF que necesitan capturar una vista como imagen.

Un detalle honesto que encontré revisando esto para ti: **`zod` está instalado como dependencia pero no encontré ningún lugar del código que lo esté usando de verdad**, ni una sola validación con `zod` ni ningún `zodResolver` conectado a los formularios. Alguien probablemente lo instaló pensando en usarlo para validaciones y terminó resolviendo todo con las validaciones propias de `react-hook-form` y funciones sueltas en `src/utils/validators.js`. No es nada grave, solo una dependencia que no cumple ninguna función hoy. Lo menciono para que no la busques pensando que hay una capa de validación con `zod` en algún lado.

**Backend:** acá está lo importante. **No hay backend propio, en el sentido tradicional de un servidor con su propia API que tú programaste.** Lo que hace ese papel es **Supabase**, un servicio administrado (lo que se conoce como *Backend-as-a-Service*) que te da tres cosas ya armadas: una base de datos **PostgreSQL** real, un sistema de autenticación de usuarios, y almacenamiento de archivos (Supabase Storage, ahí se guardan los PDF de fichas técnicas y las evidencias adjuntas). Supabase expone automáticamente cada tabla de la base como un endpoint REST, eso se llama PostgREST y es una pieza del propio Supabase, así que el frontend nunca le habla a "una API que alguien programó a mano". Le habla directo a la base de datos a través de esa capa autogenerada, usando el cliente `@supabase/supabase-js` desde React.

**Base de datos:** PostgreSQL, administrado por Supabase. No es una base que tú tengas que instalar, mantener ni respaldar manualmente, eso lo hace Supabase.

**Despliegue y hosting:** **Vercel**, conectado directo al repositorio de GitHub. Cada push a la rama `main` dispara un build y despliegue automático, con la salvedad que ya te conté de que a veces ese disparo automático no ocurre solo.

**Control de versiones:** Git, repositorio en GitHub.

## ¿Se usó arquitectura hexagonal? No, y te explico por qué, no solo que no

Te adelanto la respuesta porque sé que es una de las primeras preguntas que te vas a hacer al mirar la carpeta `src`: **no, este proyecto no está armado con arquitectura hexagonal (puertos y adaptadores)**. Y quiero que entiendas la razón, no que asumas que fue por no saber qué es.

La arquitectura hexagonal existe para resolver un problema específico: que tu lógica de negocio no dependa directamente de la tecnología que uses por fuera, sea la base de datos, el framework de UI, o el proveedor de correo. Para lograrlo, defines "puertos" (interfaces) de los que depende tu dominio, y "adaptadores" que implementan esos puertos para una tecnología concreta. La ventaja es que puedes cambiar de Postgres a otra base, o de Supabase a un backend propio, sin tocar una sola línea de la lógica de negocio, porque esa lógica nunca conoció a Supabase directamente, solo conoció una interfaz abstracta.

Eso no está aplicado acá. Lo que sí hay es algo más simple, y más común en proyectos de este tamaño: una **arquitectura por features/carpetas**, con una capa de acceso a datos centralizada pero no abstraída.

- `src/pages/<Módulo>/`: una carpeta por cada módulo de negocio (Empresas, Trabajadores, Entregas, etc.), con su página principal, sus modales y sus componentes propios.
- `src/db/index.js`: un archivo único que concentra casi todas las llamadas a Supabase, organizado en objetos por entidad (`cargoDB`, `trabajadorDB`, `entregaDB`...). Es una capa de acceso a datos, sí, pero **llama a Supabase directamente adentro de cada función**. No hay una interfaz intermedia que un adaptador distinto pudiera implementar sin tocar esas funciones.
- `src/services/`: lógica más específica que no encaja como CRUD simple (generadores de alertas, parseadores de Excel).
- `src/utils/`: funciones puras de cálculo y formato (fechas, validadores, formateadores). Estas sí bastante desacopladas de Supabase, que es donde vive gran parte de la lógica de negocio "limpia" del sistema.
- `src/contexts/`: estado global de React (sesión de usuario, tema visual).
- `src/lib/`: el cliente de Supabase inicializado, y los conversores de nombres entre `snake_case` (Postgres) y `camelCase` (JavaScript).

¿Por qué no se hizo hexagonal desde el principio? Por la misma razón que ya te expliqué con lo de no montar AWS. Hexagonal tiene sentido cuando sabes que vas a necesitar cambiar de infraestructura, o cuando necesitas probar la lógica de negocio de forma aislada con pruebas automatizadas serias. Acá ninguna de las dos cosas era el objetivo en ese momento. El objetivo era validar rápido si la idea de negocio funcionaba, con una sola persona usándolo. Meterle la ceremonia de definir puertos e interfaces para una eventual migración que en ese momento ni siquiera estaba confirmada hubiera sido, otra vez, sobre-ingeniería adelantada.

Ahora bien, te tengo una buena noticia dentro de esto. Aunque no es hexagonal de verdad, el hecho de que casi **todas** las llamadas a Supabase estén concentradas en un solo archivo (`src/db/index.js`) te da, sin haberlo planeado así formalmente, casi el mismo beneficio práctico que buscarías con un puerto: **es un solo lugar por donde tienes que pasar para cambiar de dónde vienen los datos.** Si mantienes las mismas firmas de función que usa hoy ese archivo (`cargoDB.create()`, `trabajadorDB.getAll()`, etc.) mientras conectas tu propio backend por dentro de cada una, no tienes que tocar ni una sola pantalla del resto de la aplicación. No es arquitectura hexagonal por diseño, pero te sirve casi igual de bien para lo que necesitas hacer ahora, y eso sí te lo puedo asegurar porque fue deliberado, aunque el nombre técnico no sea el correcto.

## El acceso que te voy a pasar

- Acceso al repositorio de GitHub, con todo el historial de commits.
- La URL del sitio en producción, con un par de usuarios de prueba para que entres y camines la app tú mismo antes de leer nada más.
- Acceso (al menos de lectura) al proyecto de Supabase, para que puedas explorar tú mismo si algo de lo que te dejo acá te queda corto.

---

## El modelo de datos real, verificado tabla por tabla

Esto te lo dejo para que no tengas que ir a Supabase a reconstruirlo tú mismo el primer día. No lo saqué de los archivos de migración del repo, ya te expliqué que esos no son confiables. Lo verifiqué **columna por columna, contra la base de datos real en producción**, probando cada una directamente contra la API. Es lo más cerca que vas a estar de un diccionario de datos confiable sin tener acceso directo a Postgres.

Son 31 tablas. Te las dejo agrupadas como piensas en ellas por negocio, no en el orden en que las creé.

**Organización:** `empresa` (id, nit, razon_social, representante_legal, direccion, ciudad, departamento, sector, estado, fecha_creacion). `sede` (id, empresa_id, nombre, direccion, municipio, departamento, responsable_sst, telefono, estado, fecha_creacion, correo, email; sí, las dos). `cargo` (id, nombre, estado, nivel, descripcion). `trabajador` (id, cedula, nombres, apellidos, cargo_id, sede_id, empresa_id, tipo_contrato, fecha_ingreso, correo, telefono, estado, fecha_creacion, genero).

**EPP y entregas:** `epp` (id, item, nombre, descripcion_ficha_tecnica, riesgo_asociado, partes_cuerpo, tiempo_uso_recomendado, vida_util, vida_util_dias, vida_util_meses, disposicion_final, norma_aplicable, imagen_base64, es_dotacion, estado, version, categoria, marca_sugerida, ficha_storage_path, ficha_nombre). `asignacion_cargo_epp` (id, cargo_id, epp_id, vigente). `inventario` (id, epp_id, sede_id, cantidad, stock_minimo). `movimiento_inventario` (id, inventario_id, epp_id, sede_id, tipo, cantidad, fecha, referencia_entrega_id, observacion, usuario_id). `entrega` (id, trabajador_id, cargo_id, sede_id, empresa_id, fecha_entrega, estado, token_aceptacion, fecha_aceptacion, observaciones, usuario_id). `detalle_entrega` (id, entrega_id, epp_id, cantidad, fecha_vencimiento, observacion). `firma` (id, entrega_id, firma_base64, fecha_captura, dispositivo, origen_qr).

**Monitoreo:** `alerta` (id, tipo, nivel, mensaje, leida, sede_id, trabajador_id, referencia_id, fecha_generacion, gestionada, accion_tomada, fecha_gestion). `configuracion_alerta` (id, tipo, activa, dias_anticipacion, configuracion).

**Inspecciones:** `vehiculo` (id, placa, empresa_id, marca, modelo, linea, tipo, estado). `checklist_preoperacional` (id, vehiculo_id, empresa_id, conductor_cedula, conductor_nombre, fecha, respuestas, observaciones, firma_base64, usuario_id, foto_base64, foto_fecha, vehiculo_placa, items, observacion_general, vehiculo_tipo). `inspeccion` (id, tipo, empresa_id, fecha, inspector, items, foto_base64, observacion_general, plan_trabajo_id, usuario_id, sede; esta es la tabla que ni siquiera aparece creada en el archivo de migración base, la reconstruí completa a partir de lo que el código realmente usa).

**Una que te tengo que marcar en rojo:** la tabla `extintor` **no existe en la base real**. El código de Inspecciones de Extintores la necesita para guardar el catálogo por sede, y el SQL para crearla está completo en la migración 006 del repo, simplemente nunca se ejecutó. Como el código que la consulta solo hace un `console.error` en vez de mostrar algo en pantalla, el síntoma que ve cualquiera que use esa pantalla es "el catálogo de extintores siempre está vacío", sin ningún mensaje de error visible. Sospecho que esta es una de las causas reales detrás del reporte de "en las inspecciones no están los ítems" que me llegó. No alcancé a confirmarlo del todo, pero encaja. Te dejo el SQL exacto para crearla, por si decides aplicarlo tú:

```sql
CREATE TABLE IF NOT EXISTS public.extintor (
  id          bigserial primary key,
  empresa_id  bigint not null references public.empresa(id),
  sede        text   not null,
  numero      int    not null,
  tipo        text,
  ubicacion   text,
  estado      text   not null default 'ACTIVO',
  created_at  timestamptz default now()
);

ALTER TABLE public.extintor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extintor_auth" ON public.extintor
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**SG-SST:** `plan_trabajo` (id, empresa_id, estado, mes_ejecucion, año, actividad, responsable, recurso, indicador, observacion, fecha_creacion, objetivo, metas). `condicion_insegura` (id, empresa_id, tipo, estado, prioridad, descripcion, area, fecha_identificacion, fecha_cierre, responsable, accion_correctiva, usuario_id, fecha_seguimiento, fecha_intervencion). `examen_medico` (id, trabajador_id, empresa_id, tipo, fecha_realizacion, fecha_vencimiento, aptitud_laboral, observaciones, entidad_realizadora, restricciones). `hallazgo` (id, empresa_id, tipo_accion, estado, descripcion, fecha_emision, responsable, fecha_cierre, usuario_id, centro_de_trabajo, area, correccion, fecha_ejecucion, observaciones, fecha_seguimiento). `indicador` (id, empresa_id, numero, nombre, formula, meta, tipo_indicador, definicion, nombre_numerador, nombre_denominador, periodicidad). `dato_indicador` (id, indicador_id, mes, año, valor, observacion). `plan_accion_indicador` (id, indicador_id, descripcion, responsable, fecha_limite, estado). `evaluacion_sgsst` (id, empresa_id, año, puntaje_total, fecha_evaluacion, usuario_id). `item_evaluacion` (id, evaluacion_id, codigo, cumple, observacion, estado, responsable, fecha_verificacion, observaciones; nota que `cumple`/`observacion` son las originales del schema base, y `estado`/`responsable`/`fecha_verificacion`/`observaciones` son las que agregué yo cuando encontré que el checklist 0312 nunca guardaba nada).

**Evidencias y archivos** (todas apuntan al mismo bucket de Supabase Storage llamado `evidencias`, cada una con su propio prefijo de carpeta): `evidencia_plan` (id, plan_id, empresa_id, nombre, tipo, storage_path, tamaño_bytes, fecha_subida, usuario_id). `evidencia_item_sgsst` (id, evaluacion_id, codigo, empresa_id, nombre, tipo, storage_path, tamaño_bytes, fecha_subida, usuario_id).

**Sistema:** `usuario` (id, nombre, correo, rol, empresa_id, estado, fecha_creacion). `gestion_cambio` (id, modulo, codigo_documento, version_nueva, descripcion_cambio, responsable, fecha, usuario_id). `auditoria` (id, modulo, accion, usuario_id, referencia_id, detalle, fecha).

Una nota de estilo que te va a servir para leer cualquiera de estas tablas: en la base todo está en `snake_case` (`fecha_creacion`, `empresa_id`), pero el código de React lo convierte automáticamente a `camelCase` (`fechaCreacion`, `empresaId`) apenas lo trae de Supabase, y lo devuelve a `snake_case` apenas lo manda a guardar. Esa conversión vive en `src/lib/mappers.js`. Si buscas un campo en el código y no lo encuentras escrito exactamente como está acá arriba, es por eso, no porque no exista.

---

## Las reglas de negocio, módulo por módulo

Esto es lo que el sistema realmente hace hoy, explicado en términos de negocio de SST (Seguridad y Salud en el Trabajo), no de componentes de React. Donde algo me pareció raro o inconsistente, te lo digo directamente en vez de maquillarlo.

### Empresas y Sedes

Una Empresa es la organización cliente para la que se administra el SG-SST. Una Sede es un centro de trabajo físico de esa empresa; en la práctica también se usa para modelar Uniones Temporales o subcontratistas, por eso en la interfaz aparece como "Sede / UT". GEPPI está pensado para llevar varias empresas cliente a la vez, cada una con sus propias sedes.

De Empresa se guarda: NIT (único, se limpia de puntos y guiones antes de guardar), razón social, representante legal, dirección, departamento, ciudad, sector económico, y un estado activo/inactivo. De Sede: a qué empresa pertenece, nombre, ubicación, teléfono, correo (ojo, en la base hay dos columnas para correo, `correo` y `email`, que probablemente haya que unificar en el rediseño), responsable SST, y su propio estado.

Algo que me parece importante que sepas: **en este sistema nunca se borra una empresa ni una sede de verdad**. El botón "Eliminar" en realidad solo cambia el estado a inactivo, así se conserva todo el historial. La función de borrado físico existe en el código pero deliberadamente no se usa desde ninguna pantalla. Me parece una decisión correcta y creo que vale la pena mantenerla en lo que construyas: en un sistema de SST, perder el historial de una empresa que canceló contrato es un problema legal, no solo técnico.

### Trabajadores

Es el registro de las personas a las que se les entrega EPP y se les hace seguimiento. Cada trabajador tiene cédula (esta sí es inmutable una vez creado el registro; si alguien la digita mal, toca crear un trabajador nuevo, no hay forma de corregirla desde la interfaz), nombres, apellidos, a qué cargo pertenece (esto es lo que determina qué EPP le corresponden), empresa, sede (opcional), fecha de ingreso, tipo de contrato, y estado.

Igual que con empresas, dar de baja a un trabajador no lo borra. Lo desaparece de los conteos activos (por sede, por empresa, por cargo) pero su historial de entregas queda intacto y consultable en su perfil. Me parece coherente con la misma filosofía de todo el sistema.

Hay una función que calcula, para cada trabajador, un semáforo de cuáles EPP tiene vigentes, cuáles próximos a vencer, cuáles vencidos, y cuáles nunca se le han entregado, cruzando lo que le corresponde según su cargo contra lo que realmente se le ha entregado y firmado. Esa lógica es el corazón de varios reportes, así que si la vas a reimplementar, dedícale tiempo a entenderla bien. Está en `src/utils/dates.js`.

También hay un importador de trabajadores desde Excel bastante permisivo. Reconoce columnas por coincidencia de nombre (no exige que se llamen exactamente igual), y si el cargo o la empresa de una fila no se encuentra en el sistema, no bota el archivo entero: deja esa fila con esos campos vacíos para que la persona decida qué hacer. Me pareció un buen criterio de diseño para no perder tiempo del usuario por un error menor en el Excel.

### Cargos

Un cargo es un puesto de trabajo genérico, "CONDUCTOR", "ALMACENISTA", al que se le asignan los EPP obligatorios según la matriz de riesgo. Algo que te va a llamar la atención: **el cargo es global, no pertenece a ninguna empresa específica**. Esto es intencional, permite reutilizar el mismo cargo entre distintas empresas cliente sin duplicar la matriz de EPP para cada una.

Acá tengo que confesarte algo que me costó bastante encontrar: el nombre del cargo se normaliza siempre a mayúsculas antes de guardar, tanto si lo creas manualmente como si lo importas de Excel. Pero esa normalización no siempre estuvo así. Antes había una inconsistencia entre la creación manual y la importación, y eso generó cargos duplicados con distinta capitalización ("ALMACENISTA" vs "Almacenista"), cada uno con su propia matriz de EPP separada. Ya corregí el código para que esto no vuelva a pasar, pero si encuentras cargos con nombres casi idénticos en la base real, probablemente son restos de ese bug. Vale la pena que los revises y fusiones a mano antes de construir nada nuevo sobre esos datos.

Y otra cosa rara que encontré: a diferencia de todo lo demás (que se desactiva, nunca se borra), **el Cargo sí se elimina físicamente** cuando le das a "Eliminar". Antes de borrarlo, el código limpia sus asignaciones de EPP a mano. Si tiene trabajadores asignados, la interfaz avisa que "quedarán sin cargo", pero honestamente no estoy seguro de que eso sea cierto en la práctica, porque la base de datos podría estar bloqueando ese borrado por la relación con trabajadores. No tuve tiempo de probarlo a fondo, así que te lo dejo como algo a verificar, no como un hecho confirmado.

### Matriz Técnica de EPP

Es el catálogo maestro de los Elementos de Protección Personal que la empresa puede entregar, con su ficha técnica. El documento oficial que sustenta todo esto se llama MT-SST-005. Cada EPP tiene un número de ítem, nombre, categoría o parte del cuerpo que protege, norma técnica aplicable, marca sugerida, un indicador de si es "dotación" (la dotación de ley, que se renueva cada 4 meses según el Artículo 230 del Código Sustantivo del Trabajo, es distinta de un EPP de protección normal y genera un tipo de alerta diferente), descripción técnica, riesgo asociado, y el dato que en mi opinión es el más importante de toda esta tabla: los días de vida útil, porque de ahí se calcula cuándo vence un EPP entregado.

Esta parte me tocó arreglarla esta sesión: el formulario ya permitía subir el PDF de la ficha técnica del fabricante, pero el archivo se descartaba en silencio al guardar, nunca llegaba a ningún lado. Ya lo dejé funcionando de verdad, el PDF se sube a Supabase Storage y queda accesible después.

### Matriz por Cargos

Es la relación que define qué EPP le corresponde a cada cargo según su nivel de riesgo. Es una tabla intermedia sencilla (cargo, EPP, si está vigente o no) pero es la pieza más importante de todo el sistema en términos prácticos: de aquí sale qué EPP se ofrecen al hacer una entrega, cómo se calcula el cumplimiento SST en los reportes, y el estado de cada trabajador. Si algo falla acá, falla en cascada por todo el sistema, y de hecho así fue como encontré el bug de los cargos duplicados que te mencioné arriba.

### Inventario

Control de stock de EPP, por sede. Cada movimiento, sea una compra, una entrega a un trabajador, o un ajuste manual, pasa por una sola función central que ajusta el stock y deja un registro en un kardex con saldo anterior y posterior. Me parece un buen patrón, ojalá lo conserves: tener un solo punto de entrada para mover inventario evita que se generen inconsistencias por distintos caminos.

### Entregas

Este es probablemente el flujo más importante de todo el sistema desde la perspectiva legal, porque es literalmente el acto de entregar EPP a alguien y dejar constancia firmada, como lo exige el Decreto 1072 de 2015. Son cuatro pasos: se busca al trabajador (o se escanea su carné con QR), se eligen los EPP que le corresponden según su cargo (con la cantidad limitada por lo que hay en stock), se firma, y se confirma.

Lo de la firma tiene dos caminos: presencial, en pantalla, o por QR. En este segundo caso se genera un enlace único que el trabajador escanea con su propio celular y firma desde ahí, mientras la pantalla original va revisando cada pocos segundos si ya firmó. Este flujo por QR ya existe y funciona, aunque un usuario de SST me hizo la observación de que no era obvio dónde encontrarlo. Está en el paso de firma, no en el paso inicial, así que si te lo piden más visible, es un tema de ubicarlo mejor en la interfaz, no de construirlo desde cero.

Una cosa que te tengo que decir con toda honestidad porque no quiero que la descubras tú solo y pienses que es un bug: el responsable que aparece firmando cada entrega **es un nombre fijo escrito directamente en el código**, no es un dato real ni configurable hoy. Está ahí como un placeholder que alguien dejó con la intención de resolverlo después y nunca se resolvió. Si vas a integrar esto en serio, ese campo debería ser dinámico, probablemente el usuario que tiene la sesión abierta, o un catálogo de responsables autorizados.

### Historial

Es simplemente la consulta de todas las entregas ya hechas, con la posibilidad de ver el detalle completo de cada una y anularla si hace falta (pidiendo un motivo, sin borrar nada).

### Reportes

Genera cuatro Excel distintos, todo armado en el navegador sin pasar por ningún servidor: historial de entregas, estado de EPP por trabajador, inventario, y un reporte de cumplimiento SST que clasifica a cada trabajador en "cumple", "pendiente" (nunca se le ha entregado algún EPP que le corresponde) o "no cumple" (tiene algo vencido), en ese orden de prioridad. El porcentaje de cumplimiento legal que se muestra sale de ahí.

### Consolidado EPP

Es parecido al reporte de "Estado EPP por Trabajador", pero con una diferencia conceptual que vale la pena que entiendas: este módulo mira lo que **realmente se entregó**, mientras que el reporte mira lo que el trabajador **debería tener** según la matriz de su cargo. Son dos preguntas distintas y por eso pueden no coincidir exactamente.

Te confieso que encontré algo que no me gustó nada mientras revisaba esto: hay **dos fórmulas distintas** en el código para calcular cuántos días faltan para que venza un EPP. Una la usa este módulo, otra la usa el resto del sistema (Alertas, Reportes). Son casi iguales pero difieren en el límite exacto de un día por cómo manejan la hora. No alcancé a unificarlas, te lo dejo anotado como algo que hay que resolver antes de confiar ciegamente en cualquiera de los dos números si alguna vez no cuadran.

### Alertas

El centro de notificaciones del sistema. Algo importante de entender: **no hay ningún proceso automático corriendo en segundo plano** que genere alertas solo. Casi todas se generan cuando alguien entra al módulo y le da clic al botón de "Generar alertas". La única excepción real es la alerta que se dispara cuando un checklist de vehículo sale con algo mal, esa sí es automática de verdad, porque está implementada como un disparador directo en la base de datos, no en el código de React, así que corre incluso cuando alguien llena el formulario público desde su celular sin haber iniciado sesión.

Genera alertas por vencimiento de EPP (y un tipo aparte para dotación, por la diferencia legal que te expliqué arriba), por stock agotado o bajo, por actos inseguros que llevan mucho tiempo sin intervenirse o que son de prioridad alta y nadie los ha tomado, y por exámenes médicos vencidos o próximos a vencer. Hay dos tipos definidos en el sistema, "entrega pendiente" y "firma pendiente", que existen como categoría pero que no encontré ningún código que realmente los genere. Parecen ideas que alguien tuvo y no alcanzó a construir.

### Checklist Preoperacional e Inspecciones SST

El checklist preoperacional es la inspección diaria que debe hacer un conductor antes de operar un vehículo, con 30 ítems fijos. Tiene dos formularios que hacen exactamente lo mismo: uno para cuando alguien de SST lo llena desde adentro de la app, y otro público, pensado para que el conductor lo llene desde su celular escaneando un código QR sin necesidad de iniciar sesión. Un detalle que te menciono porque me parece frágil: el sistema reconoce quién es "conductor" por el número interno del cargo, no por su nombre. Si en algún momento se reorganiza el catálogo de cargos, esto se puede romper sin que sea evidente por qué.

Las inspecciones SST son distintas: cubren cinco tipos (extintores, botiquín, EPP, seguridad general, orden y aseo), cada uno con su propia lista de ítems fijos. Extintores es un caso especial: en vez de una inspección puntual, mantiene un catálogo real de extintores por sede que se va llenando con el tiempo, y cada inspección evalúa todos los extintores activos de esa sede a la vez.

### Plan Anual de Trabajo, AT/IT, Actos Inseguros, Exámenes Médicos, Indicadores, y SG-SST 0312

Todos estos módulos comparten algo que me tocó descubrir de la manera difícil: en varios de ellos, el formulario llevaba tiempo mandando campos que **sencillamente no existían como columnas en la base de datos real**. No es que hubiera una validación fallando ni un mensaje de error visible, el guardado fallaba en silencio y la persona que lo usaba solo veía que "no pasaba nada" al darle a guardar. Encontré y corregí esto módulo por módulo, agregando las columnas que hacían falta, pero quiero que sepas la causa de fondo: en algún momento alguien alteró la base de datos real directamente desde el panel de Supabase, sin nunca generar el archivo de migración correspondiente en el repositorio. El repositorio y la base real se fueron desalineando poco a poco, y probablemente no encontré todos los casos, solo los que alguien alcanzó a reportar y probar.

El Plan Anual de Trabajo es el cronograma de actividades SST del año, con seguimiento mes a mes. AT/IT registra accidentes e incidentes de trabajo. Actos y Condiciones Inseguras hace seguimiento de situaciones de riesgo identificadas hasta que se resuelven, tiene un campo de "acción correctiva" que existe en la base de datos pero al que no le encontré ningún espacio en el formulario para llenarlo, así que hoy es un campo muerto. Exámenes Médicos controla los exámenes ocupacionales por trabajador con sus fechas de vigencia. Indicadores de Cumplimiento maneja los indicadores de gestión que exige el Decreto 1072, con seguimiento mensual; acá encontré que el cálculo del porcentaje de cumplimiento estaba deshabilitado, simplificado a un guion en pantalla, y que la vista de detalle siempre muestra doce columnas mensuales sin importar si el indicador es mensual, trimestral o anual, cosa que debería ajustarse.

Y por último, SG-SST 0312 es la autoevaluación oficial de los 60 estándares mínimos que exige la Resolución 0312 de 2019, organizados en el ciclo de Planear-Hacer-Verificar-Actuar, calificados sobre 100 puntos. La estructura de esos 60 ítems está escrita directamente en el código porque es el estándar legal, no cambia, así que no hace falta que sea editable desde la interfaz. Acá también encontré, sin que nadie lo hubiera reportado todavía, que el checklist completo (estado, responsable, fecha, observaciones de cada ítem) nunca se estaba guardando por el mismo problema de columnas faltantes que te mencioné arriba. Ya quedó corregido, y de paso dejé armada la función de adjuntar evidencias por cada ítem, organizadas por empresa, que era algo que pedían explícitamente.

### Gestión del Cambio y Auditoría

Son dos cosas distintas que se pueden confundir por el nombre. Gestión del Cambio es una bitácora documental, un registro de cada vez que se modifica la Matriz de EPP, exigido también por la normativa, con la versión, quién autorizó el cambio y por qué. Auditoría es el rastro técnico de quién hizo qué en el sistema y cuándo.

De Auditoría te tengo que decir algo importante: **si el registro de auditoría falla por cualquier razón, la operación original que se estaba auditando no se revierte**. El sistema simplemente deja pasar el error en silencio. Y más allá de eso, ninguna de las funciones centrales que crean o modifican datos llama automáticamente al registro de auditoría, depende de que cada pantalla, una por una, se acuerde de invocarlo. No hay ninguna garantía de que todo lo que pasa en el sistema quede realmente auditado. Si la trazabilidad es un requisito serio para la ERP, esto hay que rediseñarlo desde la base, no parchar lo que hay.

### Usuarios y Roles

Existen cinco roles pensados: Administrador, profesional SST, Almacén, Supervisor, y Trabajador (este último está definido en el modelo pero nunca se implementó, ni siquiera aparece como opción al crear un usuario). Cada uno tiene una descripción de qué debería poder hacer.

Y acá llego a lo que para mí es el hallazgo más importante de todo este documento, y te pido que lo leas con calma porque es la base de cualquier decisión de seguridad que tomes de aquí en adelante: **hoy, en la práctica, esos roles no restringen nada de verdad**. Lo único que hace el rol es esconder un botón del menú lateral si no eres administrador. Pero si esa misma persona escribe la dirección de la pantalla directamente en el navegador, entra igual. Y a nivel de base de datos, cualquier usuario que haya iniciado sesión, sin importar su rol, sin importar de qué empresa sea, tiene permiso total para leer, crear, modificar y borrar absolutamente cualquier dato del sistema, incluyendo los datos de otras empresas cliente y la tabla de usuarios. No es un descuido menor, es una decisión de seguridad que nunca se tomó. Si van a integrar esto a una ERP donde de verdad importa quién puede ver qué, este es el punto que más atención necesita, y no es algo que se hereda: hay que construirlo de cero.

### Configuración

Y por último, algo que descubrí casi de casualidad revisando este módulo: las funciones de "Respaldar y restaurar datos" y "Reiniciar a datos de muestra" no están hablando con Supabase en absoluto. Están escritas contra una tecnología de una versión anterior del sistema (una base de datos local en el navegador, de cuando el proyecto todavía no usaba un servidor real). Es altamente probable que estas funciones simplemente no funcionen hoy, o que hagan algo distinto a lo que dicen hacer. No alcancé a probarlas a fondo ni a arreglarlas, te lo dejo como una bandera roja para que no las prometas como funcionales sin antes probarlas tú mismo. La parte de importar la Matriz de EPP desde Excel, que está en este mismo módulo, sí es real y sí funciona.

---

## La deuda técnica, sin endulzarla

Te resumo acá, todo junto, lo que ya te fui mencionando disperso arriba más algunas cosas adicionales, para que tengas una sola lista de referencia.

**Lo más grave, en mi opinión:**

- No hay ninguna autorización real por rol ni por empresa. Cualquier usuario autenticado puede hacer cualquier cosa sobre cualquier dato. Esto lo repito porque de verdad creo que es lo primero que hay que resolver si esto se convierte en algo serio dentro de la ERP.
- El archivo de migraciones del repositorio no refleja la base de datos real. Alguien fue cambiando el esquema directo en Supabase sin dejar registro en el código. Yo corregí lo que encontré probando módulo por módulo, pero es muy probable que queden cosas sin descubrir en los módulos que nadie ha probado todavía.
- No hay ninguna prueba automatizada en todo el proyecto. Ni una. Todo lo que se sabe de si algo funciona o no viene de haberlo probado a mano.

**Cosas puntuales que ya identifiqué:**

- El módulo de Configuración (respaldo, restauración, reinicio a datos de muestra) probablemente está roto, es código de una arquitectura anterior que nunca se actualizó.
- El campo "acción correctiva" en Actos y Condiciones Inseguras existe en la base pero no tiene dónde llenarse en el formulario.
- Hay dos fórmulas distintas para calcular días hasta el vencimiento de un EPP, en dos módulos distintos, que no siempre dan el mismo resultado.
- El responsable de entrega de EPP es un nombre fijo escrito en el código, no un dato real.
- Los conductores se identifican por un número de cargo escrito directamente en el código, no por nombre ni por ninguna marca explícita de "este cargo es de conducción".
- El checklist preoperacional tiene su lista de 30 ítems escrita por duplicado en dos archivos distintos, en vez de un solo lugar compartido.
- Los tipos de alerta "entrega pendiente" y "firma pendiente" existen en el modelo pero nunca se implementó el código que los genera.
- El registro de auditoría puede fallar en silencio sin que nadie se entere, y no hay garantía de que todas las acciones importantes queden realmente registradas.
- El cálculo del porcentaje de cumplimiento en Indicadores está simplificado y no refleja datos reales todavía.
- La vista de un indicador siempre muestra los doce meses del año aunque su periodicidad sea distinta (trimestral, semestral, anual).
- El auto-deploy de Vercel a veces no se dispara solo con el push, toca correrlo manual.
- La tabla `extintor` no existe en la base real, aunque el código la necesita y aunque el SQL para crearla está completo en el repo (migración 006), nunca se ejecutó. El catálogo de extintores por sede siempre aparece vacío, sin ningún error visible para quien lo usa. Te dejo el SQL exacto en la sección del modelo de datos, más arriba.

**Lo que no alcancé a probar:**

Los módulos que corregí fueron los que alguien reportó como rotos: Matriz por Cargo, AT/IT, Actos Inseguros, Exámenes Médicos, Plan Anual de Trabajo, Inspecciones de Extintores, SG-SST 0312. Dado el patrón tan repetido de columnas faltantes que encontré en todos esos, mi sospecha honesta es que otros módulos que nadie ha probado todavía (Gestión del Cambio, Auditoría, Consolidado, Reportes, Usuarios y Roles, Vehículos) podrían tener el mismo problema. No lo digo para asustarte, lo digo para que no asumas que "si no está en esta lista, funciona".

---

## Notas finales: lo que de verdad quiero que sepas

Duvan, más allá de lo técnico, quiero dejarte por escrito cómo veo yo este proyecto, porque creo que eso también es información útil para ti.

Este sistema nació resolviendo un problema real y concreto: la gestión de entrega de EPP y el cumplimiento del SG-SST para una empresa cliente específica. Eso se nota en el código, las reglas de negocio que sí están bien pensadas (el semáforo de vencimiento de EPP, la lógica de cumplimiento, la estructura de la autoevaluación 0312) tienen ese nivel de detalle que solo sale de haberse sentado con alguien que conoce la normativa de verdad, no de haber adivinado. Eso vale, y creo que es lo más valioso que te estoy entregando: no el código en sí, sino el conocimiento de negocio que ya quedó traducido a reglas concretas.

Al mismo tiempo, es un proyecto que creció rápido y sin frenos de seguridad. Se nota que en algún momento el ritmo de agregar funcionalidades le ganó al ritmo de mantener la base de datos, la seguridad y las pruebas al día. No te lo digo para que juzgues el trabajo anterior, yo mismo encontré varios de estos problemas mientras lo iba usando, no porque los estuviera buscando activamente desde el principio. Es lo que pasa cuando uno construye rápido para que algo funcione ya: se acumulan atajos que después hay que pagar. Ese pago te toca a ti ahora, y quiero que sepas que no es porque nadie se haya esforzado, es simplemente el costo normal de haber priorizado tener algo funcionando rápido sobre tenerlo perfecto desde el día uno.

También te quiero contar algo con toda franqueza, porque prefiero que lo sepas por mí y no que lo asumas mal: el plan original **sí era .NET, con despliegue en AWS**, así lo definimos al principio. Antes de invertir tiempo real construyendo esa infraestructura, decidí cambiar de rumbo. En esa etapa el sistema lo iba a manejar una sola persona (el SISO), y el objetivo no era todavía tener algo listo para producción a escala, era validar si la lógica de negocio de SST que te documenté arriba de verdad servía como estaba pensada. Meterle semanas a levantar un backend en .NET y una arquitectura en AWS para que la usara un solo usuario de prueba no tenía sentido en ese momento, primero había que confirmar que el negocio detrás funcionara. Por eso pivoté a un stack más liviano (React + Supabase, con Vercel de hosting), que me permitió construir y validar rápido sin comprometer la calidad del dato ni de la lógica.

Ese cambio de arquitectura pasó **antes** de que hubiera código .NET sustancial que migrar. No es que abandoné un proyecto a medias y dejé código huérfano en algún lado, es que corté por lo sano antes de construir en la dirección equivocada. Tomé lo que necesitaba y creé este nuevo repositorio


Ahora que esto se integra a la ERP con usuarios reales, tiene todo el sentido moverlo a algo como AWS con un backend propio, pero esa decisión le correspondía a esta etapa, la de ustedes, no a la de validar si la idea funcionaba con un solo usuario probándola.

Si me preguntas mi opinión honesta sobre qué hacer con esto: no lo tires. La lógica de negocio que está documentada arriba te ahorra semanas de reuniones con la gente de SST tratando de entender qué necesitan. Pero tampoco lo trates como algo terminado que solo hay que "conectar" a la ERP. Trátalo como una especificación funcional muy detallada, escrita en código en vez de en Word, con la seguridad de acceso pendiente de construir desde cero y con varias costuras internas (las que te listé en deuda técnica) que van a necesitar tu criterio para decidir si las arreglas, las rediseñas, o las descartas.

Una cosa que aprendí haciendo esta revisión y que te quiero pasar como consejo, no como regla: cada vez que encontré un módulo "roto", la causa casi siempre fue la misma, un campo que el formulario mandaba pero que la base de datos real no tenía. Si te encuentras con algo que "no guarda nada" y no hay ningún error visible en pantalla, sospecha primero de eso antes de perder tiempo revisando la lógica del componente. Te va a ahorrar horas, a mí me las ahorró después de la tercera vez que me pasó.

Sé que entregarte esto en el estado en el que está no es lo ideal, yo hubiera preferido tener más tiempo para dejarte algo más redondo, con todos los módulos probados y no solo los que alguien reportó. Pero también creo genuinamente que empezar de este punto, con la lógica de negocio ya pensada y escrita, es una ventaja enorme comparado con arrancar de una hoja en blanco, que es la alternativa real que tenían ustedes antes de esto. Si te sirve de algo saberlo: preferí dedicar el tiempo que tenía a entender bien y dejarte escrito por qué las cosas fallan, en vez de parchar rápido todo lo que encontrara sin explicarte el porqué. Me pareció que eso te iba a servir más a ti a mediano plazo.

Cualquier cosa que no te cuadre leyendo esto, o que quieras que te explique con más calma en persona, ya sabes que puedes escribirme. Y para lo que sea puntual de la normativa SST o de cómo debería comportarse alguna regla de negocio en la práctica, mejor pregúntale directo al SISO, él conoce el detalle operativo mejor que yo. Prefiero que pregunten antes de asumir algo que no está claro, sobre todo en lo de permisos y roles, ahí es donde más me preocupa que alguien construya sobre un supuesto equivocado.

Gracias por recibir esto, y suerte con lo que sigue.
