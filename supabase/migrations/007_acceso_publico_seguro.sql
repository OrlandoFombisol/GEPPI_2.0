-- Acceso sin sesión seguro (2026-10-31).
-- La firma por QR y el checklist de conductores no piden usuario, pero antes la base dejaba que
-- cualquiera sin sesión listara todos los trabajadores (nombre y cédula), todas las entregas y los
-- checklists, y marcara entregas como firmadas. Ahora el acceso sin sesión pasa solo por estas
-- funciones, que devuelven únicamente lo de esa entrega o ese conductor (Ley 1581 de 2012).

-- ─── Firma del acta por QR ─────────────────────────────────────────────────────
create or replace function public.acta_por_token(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'entrega',    to_jsonb(e) - 'token_aceptacion' - 'usuario_id',
    'trabajador', jsonb_build_object('nombres', t.nombres, 'apellidos', t.apellidos, 'cedula', t.cedula),
    'cargo',      jsonb_build_object('nombre', c.nombre),
    'sede',       jsonb_build_object('nombre', s.nombre),
    'empresa',    jsonb_build_object('razon_social', em.razon_social, 'nit', em.nit),
    'detalles',   coalesce((
      select jsonb_agg(to_jsonb(d) || jsonb_build_object('epp_nombre', p.nombre, 'es_dotacion', p.es_dotacion) order by d.id)
      from detalle_entrega d left join epp p on p.id = d.epp_id where d.entrega_id = e.id), '[]'::jsonb)
  )
  from entrega e
  left join trabajador t on t.id = e.trabajador_id
  left join cargo c      on c.id = e.cargo_id
  left join sede s       on s.id = e.sede_id
  left join empresa em   on em.id = e.empresa_id
  where length(coalesce(p_token, '')) >= 30 and e.token_aceptacion = p_token
$$;

create or replace function public.firmar_acta(p_token text, p_firma text, p_dispositivo text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if length(coalesce(p_token, '')) < 30 or length(coalesce(p_firma, '')) < 100 then
    raise exception 'Datos de firma incompletos';
  end if;
  update entrega set estado = 'FIRMADA', fecha_aceptacion = now()
   where token_aceptacion = p_token and estado <> 'FIRMADA'
  returning id into v_id;
  if v_id is null then
    raise exception 'El enlace no es válido o el acta ya fue firmada';
  end if;
  insert into firma (entrega_id, firma_base64, fecha_captura, dispositivo, origen_qr)
  values (v_id, p_firma, now(), left(coalesce(p_dispositivo, 'Desconocido'), 300), true);
  return v_id;
end $$;

-- ─── Checklist preoperacional de conductores ───────────────────────────────────
create or replace function public.conductores_de_empresa(p_empresa bigint)
returns table (id bigint, nombres text, apellidos text)
language sql stable security definer set search_path = public as $$
  select t.id, t.nombres, t.apellidos
  from trabajador t join cargo c on c.id = t.cargo_id
  where t.empresa_id = p_empresa and t.estado = 'ACTIVO' and upper(c.nombre) like 'CONDUCTOR%'
  order by t.apellidos, t.nombres
$$;

create or replace function public.validar_conductor(p_trabajador bigint, p_empresa bigint, p_cedula text)
returns table (id bigint, nombres text, apellidos text, cargo_id bigint)
language sql stable security definer set search_path = public as $$
  select t.id, t.nombres, t.apellidos, t.cargo_id
  from trabajador t join cargo c on c.id = t.cargo_id
  where t.id = p_trabajador and t.empresa_id = p_empresa and t.cedula = trim(p_cedula)
    and t.estado = 'ACTIVO' and upper(c.nombre) like 'CONDUCTOR%'
$$;

revoke all on function public.acta_por_token(text), public.firmar_acta(text, text, text),
  public.conductores_de_empresa(bigint), public.validar_conductor(bigint, bigint, text) from public;
grant execute on function public.acta_por_token(text), public.firmar_acta(text, text, text),
  public.conductores_de_empresa(bigint), public.validar_conductor(bigint, bigint, text) to anon, authenticated;

-- ─── Se cierra la lectura y escritura directa sin sesión ───────────────────────
drop policy if exists public_read on trabajador;
drop policy if exists anon_read_trabajador on trabajador;
drop policy if exists public_read_entrega_by_token on entrega;
drop policy if exists public_update_entrega_by_token on entrega;
drop policy if exists public_insert_firma on firma;
drop policy if exists public_read on detalle_entrega;
drop policy if exists public_read on sede;
drop policy if exists public_read on cargo;
drop policy if exists public_read on epp;
drop policy if exists public_read_checklist on checklist_preoperacional;

-- Empresas: sin sesión solo se ve el nombre de las activas (lista del checklist), no NIT ni representante
drop policy if exists public_read on empresa;
revoke select on empresa from anon;
grant select (id, razon_social, estado) on empresa to anon;
