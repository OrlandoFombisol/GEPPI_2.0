-- Migración 004: Trigger automático de alertas para checklist preoperacional
-- Ejecutar en Supabase Dashboard → SQL Editor
--
-- PROPÓSITO: Generar alertas automáticamente al insertar un checklist cuando:
--   - Hay ítems con estado MALO (nivel CRITICO)
--   - Hay ítems REGULAR con observación, o hay observación general (nivel WARNING)
--
-- Esto reemplaza la lógica manual en ChecklistForm.jsx y además cubre el
-- formulario QR del operario (anon), que no puede insertar en alerta por RLS.

CREATE OR REPLACE FUNCTION public.fn_checklist_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_rec   jsonb;
  malos      text[] := '{}';
  regulares  text[] := '{}';
  nivel      text;
  msg        text;
  veh        text;
BEGIN
  IF NEW.items IS NULL OR jsonb_array_length(NEW.items) = 0 THEN
    RETURN NEW;
  END IF;

  FOR item_rec IN SELECT jsonb_array_elements(NEW.items)
  LOOP
    IF item_rec->>'estado' = 'MALO' THEN
      malos := malos || (item_rec->>'label')::text;
    ELSIF item_rec->>'estado' = 'REGULAR'
      AND (item_rec->>'observacion') IS NOT NULL
      AND trim(item_rec->>'observacion') <> '' THEN
      regulares := regulares || (item_rec->>'label')::text;
    END IF;
  END LOOP;

  IF array_length(malos, 1) IS NULL
     AND array_length(regulares, 1) IS NULL
     AND (NEW.observacion_general IS NULL OR trim(NEW.observacion_general) = '')
  THEN
    RETURN NEW;
  END IF;

  veh   := COALESCE(NULLIF(trim(NEW.vehiculo_placa), ''), 'Vehículo sin placa');
  nivel := CASE WHEN array_length(malos, 1) > 0 THEN 'CRITICO' ELSE 'WARNING' END;
  msg   := veh || ' | Conductor: ' || COALESCE(NEW.conductor_nombre, '');

  IF array_length(malos, 1) > 0 THEN
    msg := msg || ' | MALO: ' || array_to_string(malos, ', ');
  END IF;
  IF array_length(regulares, 1) > 0 THEN
    msg := msg || ' | REGULAR c/obs: ' || array_to_string(regulares, ', ');
  END IF;
  IF NEW.observacion_general IS NOT NULL AND trim(NEW.observacion_general) <> '' THEN
    msg := msg || ' | Obs. general: ' || left(trim(NEW.observacion_general), 120);
  END IF;

  INSERT INTO public.alerta (tipo, nivel, mensaje, referencia_id, leida, fecha_generacion)
  VALUES ('CHECKLIST_HALLAZGO', nivel, msg, NEW.id::text, false, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_checklist_alert ON public.checklist_preoperacional;

CREATE TRIGGER tg_checklist_alert
  AFTER INSERT ON public.checklist_preoperacional
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_checklist_alert();
