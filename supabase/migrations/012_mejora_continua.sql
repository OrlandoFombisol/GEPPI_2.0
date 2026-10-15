-- Migración 012: Mejora continua
-- Notas de trabajo que no queda registrado en el código (análisis, soporte,
-- gestión de datos, servidores, seguridad, capacitación, etc). Se combinan
-- con el historial de git (generado aparte, vía `npm run mejora`) para armar
-- la página de Mejora Continua.
-- Ejecutar en Supabase Dashboard → SQL Editor

create table if not exists public.nota_mejora (
  id          bigserial primary key,
  fecha       date not null,
  tipo        text not null check (tipo in
                ('ANALISIS', 'SOPORTE', 'DATOS', 'SERVIDORES', 'SEGURIDAD', 'CAPACITACION', 'OTRO')),
  titulo      text not null check (char_length(titulo) between 3 and 140),
  detalle     text check (detalle is null or char_length(detalle) <= 1000),
  usuario_id  uuid references auth.users(id),
  creado_en   timestamptz not null default now()
);

alter table public.nota_mejora enable row level security;

-- Esta tabla expone cifras de rendición de cuentas a gerencia, así que a
-- diferencia del resto del sistema (donde basta con "cualquier autenticado"),
-- aquí se exige además que el usuario tenga rol ADMINISTRADOR en la tabla
-- `usuario`.
create policy "solo_administrador" on public.nota_mejora
  for all
  using (
    exists (
      select 1 from public.usuario u
      where u.id = auth.uid() and u.rol = 'ADMINISTRADOR'
    )
  )
  with check (
    exists (
      select 1 from public.usuario u
      where u.id = auth.uid() and u.rol = 'ADMINISTRADOR'
    )
  );
