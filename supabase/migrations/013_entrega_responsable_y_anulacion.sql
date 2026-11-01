-- Responsable real de la entrega (antes era un nombre fijo en el código) y
-- motivo de anulación aparte, para no borrar las observaciones del acta.
alter table public.entrega
  add column if not exists responsable_nombre text,
  add column if not exists motivo_anulacion   text,
  add column if not exists fecha_anulacion    timestamptz;

notify pgrst, 'reload schema';

-- Solo se puede firmar por QR un acta PENDIENTE (antes también una ANULADA)
create or replace function public.firmar_acta(p_token text, p_firma text, p_dispositivo text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if length(coalesce(p_token, '')) < 30 or length(coalesce(p_firma, '')) < 100 then
    raise exception 'Datos de firma incompletos';
  end if;
  update entrega set estado = 'FIRMADA', fecha_aceptacion = now()
   where token_aceptacion = p_token and estado = 'PENDIENTE'
  returning id into v_id;
  if v_id is null then
    raise exception 'El enlace no es válido, el acta ya fue firmada o fue cancelada';
  end if;
  insert into firma (entrega_id, firma_base64, fecha_captura, dispositivo, origen_qr)
  values (v_id, p_firma, now(), left(coalesce(p_dispositivo, 'Desconocido'), 300), true);
  return v_id;
end $$;

notify pgrst, 'reload schema';
