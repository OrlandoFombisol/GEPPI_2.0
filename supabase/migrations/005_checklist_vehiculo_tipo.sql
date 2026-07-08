-- Migración 005: Columna tipo de vehículo en checklist_preoperacional
-- Ejecutar en Supabase Dashboard → SQL Editor

ALTER TABLE public.checklist_preoperacional
  ADD COLUMN IF NOT EXISTS vehiculo_tipo text;
