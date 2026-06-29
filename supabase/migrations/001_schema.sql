-- ═══════════════════════════════════════════════════════════════════════════════
--  GEPPI v2.0 — Esquema inicial PostgreSQL / Supabase
--  Ejecutar completo en: Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Empresa ───────────────────────────────────────────────────────────────────
create table public.empresa (
  id             bigserial primary key,
  nit            text unique not null,
  razon_social   text not null,
  representante_legal text,
  direccion      text,
  ciudad         text,
  departamento   text,
  sector         text,
  estado         text default 'ACTIVO',
  fecha_creacion timestamptz default now()
);

-- ─── Sede ──────────────────────────────────────────────────────────────────────
create table public.sede (
  id             bigserial primary key,
  empresa_id     bigint references public.empresa(id) on delete cascade,
  nombre         text not null,
  direccion      text,
  municipio      text,
  departamento   text,
  responsable_sst text,
  telefono       text,
  estado         text default 'ACTIVO',
  fecha_creacion timestamptz default now()
);

-- ─── Cargo ─────────────────────────────────────────────────────────────────────
create table public.cargo (
  id     bigserial primary key,
  nombre text unique not null,
  estado text default 'ACTIVO'
);

-- ─── EPP ───────────────────────────────────────────────────────────────────────
create table public.epp (
  id                       bigserial primary key,
  item                     integer,
  nombre                   text not null,
  descripcion_ficha_tecnica text,
  riesgo_asociado          text,
  partes_cuerpo            text,
  tiempo_uso_recomendado   text,
  vida_util                text,
  vida_util_dias           integer,
  vida_util_meses          integer,
  disposicion_final        text,
  norma_aplicable          text,
  imagen_base64            text,
  es_dotacion              boolean default false,
  estado                   text default 'ACTIVO',
  version                  text
);

-- ─── Asignación Cargo ↔ EPP ────────────────────────────────────────────────────
create table public.asignacion_cargo_epp (
  id       bigserial primary key,
  cargo_id bigint references public.cargo(id) on delete cascade,
  epp_id   bigint references public.epp(id) on delete cascade,
  vigente  boolean default true,
  unique(cargo_id, epp_id)
);

-- ─── Trabajador ────────────────────────────────────────────────────────────────
create table public.trabajador (
  id             bigserial primary key,
  cedula         text unique not null,
  nombres        text not null,
  apellidos      text not null,
  cargo_id       bigint references public.cargo(id),
  sede_id        bigint references public.sede(id),
  empresa_id     bigint references public.empresa(id),
  tipo_contrato  text,
  fecha_ingreso  date,
  correo         text,
  telefono       text,
  estado         text default 'ACTIVO',
  fecha_creacion timestamptz default now()
);

-- ─── Inventario (stock por EPP × Sede) ─────────────────────────────────────────
create table public.inventario (
  id          bigserial primary key,
  epp_id      bigint references public.epp(id) on delete cascade,
  sede_id     bigint references public.sede(id) on delete cascade,
  cantidad    integer default 0,
  stock_minimo integer default 5,
  unique(epp_id, sede_id)
);

-- ─── Movimiento de inventario (kardex) ─────────────────────────────────────────
create table public.movimiento_inventario (
  id                  bigserial primary key,
  inventario_id       bigint references public.inventario(id),
  epp_id              bigint references public.epp(id),
  sede_id             bigint references public.sede(id),
  tipo                text not null,  -- ENTRADA | SALIDA | AJUSTE
  cantidad            integer not null,
  fecha               timestamptz default now(),
  referencia_entrega_id bigint,
  observacion         text,
  usuario_id          uuid references auth.users(id)
);

-- ─── Entrega ───────────────────────────────────────────────────────────────────
create table public.entrega (
  id                bigserial primary key,
  trabajador_id     bigint references public.trabajador(id),
  cargo_id          bigint references public.cargo(id),
  sede_id           bigint references public.sede(id),
  empresa_id        bigint references public.empresa(id),
  fecha_entrega     date default current_date,
  estado            text default 'PENDIENTE',  -- FIRMADA | PENDIENTE | PENDIENTE_FIRMA | ANULADA
  token_aceptacion  text unique,
  fecha_aceptacion  timestamptz,
  observaciones     text,
  usuario_id        uuid references auth.users(id)
);

-- ─── Detalle de entrega (EPP por entrega) ─────────────────────────────────────
create table public.detalle_entrega (
  id               bigserial primary key,
  entrega_id       bigint references public.entrega(id) on delete cascade,
  epp_id           bigint references public.epp(id),
  cantidad         integer default 1,
  fecha_vencimiento date,
  observacion      text
);

-- ─── Firma digital ─────────────────────────────────────────────────────────────
create table public.firma (
  id            bigserial primary key,
  entrega_id    bigint unique references public.entrega(id) on delete cascade,
  firma_base64  text not null,
  fecha_captura timestamptz default now(),
  dispositivo   text,
  origen_qr     boolean default false
);

-- ─── Alerta del sistema ────────────────────────────────────────────────────────
create table public.alerta (
  id               bigserial primary key,
  tipo             text not null,
  nivel            text not null,  -- INFO | WARNING | CRITICO
  mensaje          text,
  leida            boolean default false,
  sede_id          bigint references public.sede(id),
  trabajador_id    bigint references public.trabajador(id),
  referencia_id    bigint,
  fecha_generacion timestamptz default now(),
  unique(tipo, referencia_id)
);

-- ─── Gestión del cambio documental ────────────────────────────────────────────
create table public.gestion_cambio (
  id                 bigserial primary key,
  modulo             text,
  codigo_documento   text,
  version_nueva      text,
  descripcion_cambio text,
  responsable        text,
  fecha              timestamptz default now(),
  usuario_id         uuid references auth.users(id)
);

-- ─── Auditoría (log inmutable) ─────────────────────────────────────────────────
create table public.auditoria (
  id           bigserial primary key,
  modulo       text,
  accion       text,
  usuario_id   uuid references auth.users(id),
  referencia_id bigint,
  detalle      jsonb,
  fecha        timestamptz default now()
);

-- ─── Perfil de usuario (extiende auth.users) ──────────────────────────────────
create table public.usuario (
  id             uuid primary key references auth.users(id) on delete cascade,
  nombre         text,
  correo         text,
  rol            text default 'SST',  -- ADMINISTRADOR | SST | ALMACEN
  empresa_id     bigint references public.empresa(id),
  estado         text default 'ACTIVO',
  fecha_creacion timestamptz default now()
);

-- ─── Vehículo ──────────────────────────────────────────────────────────────────
create table public.vehiculo (
  id         bigserial primary key,
  placa      text unique not null,
  empresa_id bigint references public.empresa(id),
  marca      text,
  modelo     text,
  linea      text,
  tipo       text,
  estado     text default 'ACTIVO'
);

-- ─── Checklist preoperacional ──────────────────────────────────────────────────
create table public.checklist_preoperacional (
  id                bigserial primary key,
  vehiculo_id       bigint references public.vehiculo(id),
  empresa_id        bigint references public.empresa(id),
  conductor_cedula  text,
  conductor_nombre  text,
  fecha             date default current_date,
  respuestas        jsonb,
  observaciones     text,
  firma_base64      text,
  usuario_id        uuid references auth.users(id)
);

-- ─── Plan Anual de Trabajo SST ─────────────────────────────────────────────────
create table public.plan_trabajo (
  id             bigserial primary key,
  empresa_id     bigint references public.empresa(id),
  estado         text,
  mes_ejecucion  integer,
  año            integer,
  actividad      text,
  responsable    text,
  recurso        text,
  indicador      text,
  observacion    text,
  fecha_creacion timestamptz default now()
);

-- ─── Condición insegura ────────────────────────────────────────────────────────
create table public.condicion_insegura (
  id                   bigserial primary key,
  empresa_id           bigint references public.empresa(id),
  tipo                 text,
  estado               text default 'ABIERTA',
  prioridad            text,
  descripcion          text,
  area                 text,
  fecha_identificacion date,
  fecha_cierre         date,
  responsable          text,
  accion_correctiva    text,
  usuario_id           uuid references auth.users(id)
);

-- ─── Examen médico ─────────────────────────────────────────────────────────────
create table public.examen_medico (
  id                  bigserial primary key,
  trabajador_id       bigint references public.trabajador(id),
  empresa_id          bigint references public.empresa(id),
  tipo                text,  -- INGRESO | PERIODICO | EGRESO
  fecha_realizacion   date,
  fecha_vencimiento   date,
  aptitud_laboral     text,
  observaciones       text,
  entidad_realizadora text
);

-- ─── Configuración de alertas ──────────────────────────────────────────────────
create table public.configuracion_alerta (
  id                bigserial primary key,
  tipo              text unique not null,
  activa            boolean default true,
  dias_anticipacion integer default 30,
  configuracion     jsonb
);

-- ─── Hallazgo AT/IT/AC/AM/AP ──────────────────────────────────────────────────
create table public.hallazgo (
  id           bigserial primary key,
  empresa_id   bigint references public.empresa(id),
  tipo_accion  text,  -- AT | IT | AC | AM | AP
  estado       text default 'ABIERTO',
  descripcion  text,
  fecha_emision date default current_date,
  responsable  text,
  fecha_cierre date,
  usuario_id   uuid references auth.users(id)
);

-- ─── Indicador de cumplimiento ─────────────────────────────────────────────────
create table public.indicador (
  id         bigserial primary key,
  empresa_id bigint references public.empresa(id),
  numero     integer,
  nombre     text,
  formula    text,
  meta       numeric,
  unique(empresa_id, numero)
);

create table public.dato_indicador (
  id           bigserial primary key,
  indicador_id bigint references public.indicador(id) on delete cascade,
  mes          integer,
  año          integer,
  valor        numeric,
  observacion  text
);

create table public.plan_accion_indicador (
  id           bigserial primary key,
  indicador_id bigint references public.indicador(id) on delete cascade,
  descripcion  text,
  responsable  text,
  fecha_limite date,
  estado       text
);

-- ─── Evaluación SG-SST Res. 0312/2019 ─────────────────────────────────────────
create table public.evaluacion_sgsst (
  id               bigserial primary key,
  empresa_id       bigint references public.empresa(id),
  año              integer,
  puntaje_total    numeric,
  fecha_evaluacion date default current_date,
  usuario_id       uuid references auth.users(id),
  unique(empresa_id, año)
);

create table public.item_evaluacion (
  id            bigserial primary key,
  evaluacion_id bigint references public.evaluacion_sgsst(id) on delete cascade,
  codigo        text,
  cumple        boolean,
  observacion   text,
  unique(evaluacion_id, codigo)
);


-- ═══════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.empresa               enable row level security;
alter table public.sede                  enable row level security;
alter table public.cargo                 enable row level security;
alter table public.epp                   enable row level security;
alter table public.asignacion_cargo_epp  enable row level security;
alter table public.trabajador            enable row level security;
alter table public.inventario            enable row level security;
alter table public.movimiento_inventario enable row level security;
alter table public.entrega               enable row level security;
alter table public.detalle_entrega       enable row level security;
alter table public.firma                 enable row level security;
alter table public.alerta                enable row level security;
alter table public.gestion_cambio        enable row level security;
alter table public.auditoria             enable row level security;
alter table public.usuario               enable row level security;
alter table public.vehiculo              enable row level security;
alter table public.checklist_preoperacional enable row level security;
alter table public.plan_trabajo          enable row level security;
alter table public.condicion_insegura    enable row level security;
alter table public.examen_medico         enable row level security;
alter table public.configuracion_alerta  enable row level security;
alter table public.hallazgo              enable row level security;
alter table public.indicador             enable row level security;
alter table public.dato_indicador        enable row level security;
alter table public.plan_accion_indicador enable row level security;
alter table public.evaluacion_sgsst      enable row level security;
alter table public.item_evaluacion       enable row level security;

-- ── Política base: usuarios autenticados tienen acceso total ──────────────────
-- (Se refinará con filtros por empresa en versiones futuras)

create policy "auth_all" on public.empresa               for all using (auth.uid() is not null);
create policy "auth_all" on public.sede                  for all using (auth.uid() is not null);
create policy "auth_all" on public.cargo                 for all using (auth.uid() is not null);
create policy "auth_all" on public.epp                   for all using (auth.uid() is not null);
create policy "auth_all" on public.asignacion_cargo_epp  for all using (auth.uid() is not null);
create policy "auth_all" on public.trabajador            for all using (auth.uid() is not null);
create policy "auth_all" on public.inventario            for all using (auth.uid() is not null);
create policy "auth_all" on public.movimiento_inventario for all using (auth.uid() is not null);
create policy "auth_all" on public.alerta                for all using (auth.uid() is not null);
create policy "auth_all" on public.gestion_cambio        for all using (auth.uid() is not null);
create policy "auth_all" on public.auditoria             for all using (auth.uid() is not null);
create policy "auth_all" on public.usuario               for all using (auth.uid() is not null);
create policy "auth_all" on public.vehiculo              for all using (auth.uid() is not null);
create policy "auth_all" on public.checklist_preoperacional for all using (auth.uid() is not null);
create policy "auth_all" on public.plan_trabajo          for all using (auth.uid() is not null);
create policy "auth_all" on public.condicion_insegura    for all using (auth.uid() is not null);
create policy "auth_all" on public.examen_medico         for all using (auth.uid() is not null);
create policy "auth_all" on public.configuracion_alerta  for all using (auth.uid() is not null);
create policy "auth_all" on public.hallazgo              for all using (auth.uid() is not null);
create policy "auth_all" on public.indicador             for all using (auth.uid() is not null);
create policy "auth_all" on public.dato_indicador        for all using (auth.uid() is not null);
create policy "auth_all" on public.plan_accion_indicador for all using (auth.uid() is not null);
create policy "auth_all" on public.evaluacion_sgsst      for all using (auth.uid() is not null);
create policy "auth_all" on public.item_evaluacion       for all using (auth.uid() is not null);

-- ── Políticas públicas para el flujo QR de aceptación (sin login) ─────────────

-- Lectura de entrega por token (anon)
create policy "public_read_entrega_by_token" on public.entrega
  for select using (token_aceptacion is not null);

-- Actualización de entrega por token (anon) — solo si está pendiente
create policy "public_update_entrega_by_token" on public.entrega
  for update using (token_aceptacion is not null and estado != 'FIRMADA')
  with check (true);

-- Lectura de tablas de soporte para la página QR (anon)
create policy "public_read" on public.trabajador      for select using (true);
create policy "public_read" on public.cargo           for select using (true);
create policy "public_read" on public.sede            for select using (true);
create policy "public_read" on public.empresa         for select using (true);
create policy "public_read" on public.epp             for select using (true);
create policy "public_read" on public.detalle_entrega for select using (true);

-- Auth también puede leer/escribir entrega y detalle
create policy "auth_all" on public.entrega       for all using (auth.uid() is not null);
create policy "auth_all" on public.detalle_entrega for all using (auth.uid() is not null);

-- Firma: inserción pública (QR) + acceso total para auth
create policy "public_insert_firma" on public.firma
  for insert with check (true);
create policy "auth_all" on public.firma
  for all using (auth.uid() is not null);


-- ═══════════════════════════════════════════════════════════════════════════════
--  ÍNDICES DE RENDIMIENTO
-- ═══════════════════════════════════════════════════════════════════════════════

create index on public.sede                  (empresa_id, estado);
create index on public.trabajador            (sede_id, estado);
create index on public.trabajador            (empresa_id, estado);
create index on public.trabajador            (cargo_id, estado);
create index on public.entrega               (trabajador_id, estado);
create index on public.entrega               (sede_id, fecha_entrega);
create index on public.entrega               (token_aceptacion);
create index on public.detalle_entrega       (entrega_id);
create index on public.detalle_entrega       (epp_id, fecha_vencimiento);
create index on public.movimiento_inventario (epp_id, sede_id);
create index on public.alerta                (leida, nivel);
create index on public.alerta                (sede_id, leida);


-- ═══════════════════════════════════════════════════════════════════════════════
--  TRIGGER: crear perfil automáticamente al registrar usuario en auth
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.usuario (id, correo, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
