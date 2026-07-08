-- Migración 006: Catálogo de extintores e inspección mensual por sede
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Tabla catálogo de extintores por empresa y sede
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

-- Columna sede en tabla inspeccion (necesaria para las inspecciones de extintores)
ALTER TABLE public.inspeccion
  ADD COLUMN IF NOT EXISTS sede text;
