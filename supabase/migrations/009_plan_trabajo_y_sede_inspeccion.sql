-- Migración 009
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Plan Anual de Trabajo: el modal captura "objetivo" y "metas" por
-- actividad desde siempre, pero esas columnas nunca se crearon en la base
-- real. Junto con el campo "empresa" (texto, en vez de empresa_id) esto
-- hacía que crear una actividad fallara con "column does not exist".
ALTER TABLE public.plan_trabajo
  ADD COLUMN IF NOT EXISTS objetivo text,
  ADD COLUMN IF NOT EXISTS metas    text;

-- Inspecciones (Extintores): la migración 006 del repo agregaba la columna
-- "sede" a inspeccion, pero nunca se llegó a ejecutar en la base real.
-- Sin ella, toda inspección de Extintores fallaba al guardar.
ALTER TABLE public.inspeccion
  ADD COLUMN IF NOT EXISTS sede text;
