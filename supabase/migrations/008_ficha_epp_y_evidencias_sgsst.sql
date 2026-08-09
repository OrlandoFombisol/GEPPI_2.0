-- Migración 008
-- Ejecutar en Supabase Dashboard → SQL Editor

-- ── Ficha técnica de EPP (Matriz Técnica) ────────────────────────────────────
-- El modal ya permitía adjuntar un PDF, pero se descartaba al guardar porque
-- no había dónde persistirlo. Se sube a Storage (bucket "evidencias") y se
-- guarda la ruta aquí.
ALTER TABLE public.epp
  ADD COLUMN IF NOT EXISTS ficha_storage_path text,
  ADD COLUMN IF NOT EXISTS ficha_nombre        text;

-- ── SG-SST 0312: columnas que el checklist ya enviaba pero no existían ──────
-- (el componente guarda estado/responsable/fecha de verificación/observaciones
-- por ítem; la tabla real solo tenía "cumple" y "observacion").
ALTER TABLE public.item_evaluacion
  ADD COLUMN IF NOT EXISTS estado             text,
  ADD COLUMN IF NOT EXISTS responsable        text,
  ADD COLUMN IF NOT EXISTS fecha_verificacion date,
  ADD COLUMN IF NOT EXISTS observaciones      text;

-- ── SG-SST 0312: evidencias por ítem, separadas por empresa ─────────────────
CREATE TABLE IF NOT EXISTS public.evidencia_item_sgsst (
  id            bigserial primary key,
  evaluacion_id bigint references public.evaluacion_sgsst(id) on delete cascade,
  codigo        text not null,
  empresa_id    bigint references public.empresa(id),
  nombre        text not null,
  tipo          text,
  storage_path  text not null,
  tamaño_bytes  integer,
  fecha_subida  timestamptz default now(),
  usuario_id    uuid references auth.users(id)
);
ALTER TABLE public.evidencia_item_sgsst ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.evidencia_item_sgsst FOR ALL USING (auth.uid() IS NOT NULL);
