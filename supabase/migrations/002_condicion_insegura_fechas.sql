-- Migración 002: Nuevas columnas en condicion_insegura
-- Ejecutar en Supabase Dashboard → SQL Editor

ALTER TABLE condicion_insegura
  ADD COLUMN IF NOT EXISTS fecha_seguimiento DATE,
  ADD COLUMN IF NOT EXISTS fecha_cierre      DATE;
