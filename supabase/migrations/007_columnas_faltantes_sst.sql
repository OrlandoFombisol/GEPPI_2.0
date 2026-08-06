-- Migración 007: columnas que los formularios de AT-IT, Actos/Condiciones Inseguras,
-- Exámenes Médicos e Indicadores ya enviaban pero que nunca se crearon en la base real,
-- causando error "column does not exist" en cada intento de guardar.
-- Ejecutar en Supabase Dashboard → SQL Editor

-- AT-IT (tabla hallazgo)
ALTER TABLE public.hallazgo
  ADD COLUMN IF NOT EXISTS centro_de_trabajo text,
  ADD COLUMN IF NOT EXISTS area              text,
  ADD COLUMN IF NOT EXISTS correccion        text,
  ADD COLUMN IF NOT EXISTS fecha_ejecucion   date,
  ADD COLUMN IF NOT EXISTS observaciones     text,
  ADD COLUMN IF NOT EXISTS fecha_seguimiento date;

-- Actos y Condiciones Inseguras (tabla condicion_insegura)
ALTER TABLE public.condicion_insegura
  ADD COLUMN IF NOT EXISTS fecha_intervencion date;

-- Exámenes Médicos (tabla examen_medico)
ALTER TABLE public.examen_medico
  ADD COLUMN IF NOT EXISTS restricciones text;

-- Indicadores de Cumplimiento (tabla indicador)
ALTER TABLE public.indicador
  ADD COLUMN IF NOT EXISTS tipo_indicador      text,
  ADD COLUMN IF NOT EXISTS definicion          text,
  ADD COLUMN IF NOT EXISTS nombre_numerador    text,
  ADD COLUMN IF NOT EXISTS nombre_denominador  text,
  ADD COLUMN IF NOT EXISTS periodicidad        text;
