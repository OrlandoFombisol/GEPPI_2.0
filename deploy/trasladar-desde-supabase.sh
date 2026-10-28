#!/usr/bin/env bash
# Copia GEEPI desde Supabase al servidor de la empresa: usuarios (con sus mismas contraseñas),
# tablas y datos, reglas de acceso (RLS) y archivos de evidencias.
# Se corre UNA vez, con la base de destino recién creada (docker compose up -d) y sin datos.
#
#   ORIGEN_DB_URL=postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres \
#   ORIGEN_URL=https://xxxx.supabase.co ORIGEN_SERVICE_KEY=eyJ... \
#   ./deploy/trasladar-desde-supabase.sh
#
# Supabase no se modifica: solo se lee. Si algo falla, se borra el destino y se repite.
set -euo pipefail
cd "$(dirname "$0")"

: "${ORIGEN_DB_URL:?Falta ORIGEN_DB_URL (Supabase → Project Settings → Database → Connection string → URI)}"
: "${ORIGEN_URL:?Falta ORIGEN_URL (https://<proyecto>.supabase.co)}"
: "${ORIGEN_SERVICE_KEY:?Falta ORIGEN_SERVICE_KEY (Supabase → Project Settings → API → service_role)}"
# ARCHIVO_ENV, PROYECTO y RED solo cambian para ensayar el traslado entre dos copias locales
ARCHIVO_ENV="${ARCHIVO_ENV:-.env}"
set -a; source "$ARCHIVO_ENV"; set +a
PROYECTO="${PROYECTO:-geepi}"
RED="${RED:-host}"
DESTINO_URL="${DESTINO_URL:-http://127.0.0.1:${PUERTO_LOCAL##*:}}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# pg_dump 17 lee cualquier versión de Supabase; psql de destino corre dentro del contenedor
origen() { docker run --rm -i --network "$RED" -e PGCONNECT_TIMEOUT=20 postgres:17-alpine "$@"; }
destino() { docker compose -p "$PROYECTO" --env-file "$ARCHIVO_ENV" exec -T db psql -U postgres -v ON_ERROR_STOP=1 -q "$@"; }

echo "1/6 Verificando que el destino esté vacío…"
if [ "$(destino -At -c "select count(*) from information_schema.tables where table_schema='public'")" != "0" ]; then
  echo "El destino ya tiene tablas en public. Bórralo (docker compose down -v) antes de trasladar." >&2; exit 1
fi

echo "2/6 Usuarios (auth.users e identities, con sus contraseñas cifradas)…"
for tabla in users identities; do
  # Solo las columnas que existen en ambos lados y que no son calculadas
  cols_destino=$(destino -At -c "select string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema='auth' and table_name='$tabla' and is_generated='NEVER'")
  cols_origen=$(origen psql "$ORIGEN_DB_URL" -At -c "select string_agg(column_name, ',') from information_schema.columns where table_schema='auth' and table_name='$tabla'")
  cols=$(comm -12 <(tr ',' '\n' <<<"$cols_destino" | sort) <(tr ',' '\n' <<<"$cols_origen" | sort) | paste -sd, -)
  origen psql "$ORIGEN_DB_URL" -c "\\copy (select $cols from auth.$tabla) to stdout" > "$TMP/$tabla.copy"
  destino -c "\\copy auth.$tabla ($cols) from stdin" < "$TMP/$tabla.copy"
  echo "   auth.$tabla: $(wc -l < "$TMP/$tabla.copy") filas"
done
# GoTrue no acepta NULL en estos campos (Supabase antiguo sí los dejaba)
destino -c "update auth.users set confirmation_token=coalesce(confirmation_token,''), recovery_token=coalesce(recovery_token,''),
  email_change_token_new=coalesce(email_change_token_new,''), email_change=coalesce(email_change,''),
  email_change_token_current=coalesce(email_change_token_current,''), phone_change=coalesce(phone_change,''),
  phone_change_token=coalesce(phone_change_token,''), reauthentication_token=coalesce(reauthentication_token,'')"

echo "3/6 Tablas, datos, funciones y políticas de GEEPI (esquema public)…"
origen pg_dump "$ORIGEN_DB_URL" --schema=public --no-owner --no-privileges --no-publications --no-subscriptions --no-comments \
  | sed -e '/^SET transaction_timeout/d' -e '/^[\]restrict /d' -e '/^[\]unrestrict /d' -e '/^CREATE SCHEMA public;/d' > "$TMP/public.sql"
destino < "$TMP/public.sql"

echo "4/6 Disparadores sobre auth.users y reglas de acceso de los archivos…"
origen psql "$ORIGEN_DB_URL" -At -c "
  select pg_get_triggerdef(t.oid) || ';' from pg_trigger t
  where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal" > "$TMP/disparadores.sql"
origen psql "$ORIGEN_DB_URL" -At -c "
  select format('create policy %I on %I.%I as %s for %s to %s%s%s;', policyname, schemaname, tablename, permissive, cmd,
         array_to_string(roles, ', '),
         coalesce(' using (' || qual || ')', ''), coalesce(' with check (' || with_check || ')', ''))
  from pg_policies where schemaname = 'storage'" > "$TMP/politicas.sql"
origen psql "$ORIGEN_DB_URL" -c "\\copy (select id, name, public, file_size_limit, allowed_mime_types from storage.buckets) to stdout" > "$TMP/buckets.copy"
destino < "$TMP/disparadores.sql"
destino < "$TMP/politicas.sql"
destino -c "\\copy storage.buckets (id, name, public, file_size_limit, allowed_mime_types) from stdin" < "$TMP/buckets.copy"
echo "   $(wc -l < "$TMP/disparadores.sql") disparador(es), $(wc -l < "$TMP/politicas.sql") política(s), $(wc -l < "$TMP/buckets.copy") bucket(s)"
destino -c "notify pgrst, 'reload schema'"

echo "5/6 Archivos de evidencias…"
origen psql "$ORIGEN_DB_URL" -At -c "
  select coalesce(json_agg(json_build_object('bucket', bucket_id, 'nombre', name, 'tipo', metadata->>'mimetype', 'dueno', owner)), '[]')
  from storage.objects" > "$TMP/archivos.json"
# (pwd -W solo existe en Git Bash de Windows, donde se ensaya; en el servidor se usa pwd)
AQUI="$(pwd -W 2>/dev/null || pwd)"
docker run --rm --network "$RED" -v "$TMP:/datos" -v "$AQUI/copiar-archivos.mjs:/copiar.mjs:ro" \
  -e ORIGEN_URL -e ORIGEN_SERVICE_KEY -e DESTINO_URL="$DESTINO_URL" -e DESTINO_SERVICE_KEY="$SERVICE_KEY" \
  node:20-alpine node /copiar.mjs /datos/archivos.json
# Conserva quién subió cada archivo, como estaba en Supabase (copiar-archivos.mjs deja el SQL)
destino < "$TMP/duenos.sql"

echo "6/6 Comparando cantidades origen vs destino…"
origen psql "$ORIGEN_DB_URL" -At -c "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1" > "$TMP/tablas.txt"
diferencias=0
while read -r t; do
  a=$(origen psql "$ORIGEN_DB_URL" -At -c "select count(*) from public.\"$t\"")
  b=$(destino -At -c "select count(*) from public.\"$t\"")
  [ "$a" = "$b" ] || { echo "   DIFERENCIA en $t: Supabase $a, destino $b"; diferencias=1; }
done < "$TMP/tablas.txt"
u_a=$(origen psql "$ORIGEN_DB_URL" -At -c "select count(*) from auth.users"); u_b=$(destino -At -c "select count(*) from auth.users")
o_a=$(origen psql "$ORIGEN_DB_URL" -At -c "select count(*) from storage.objects"); o_b=$(destino -At -c "select count(*) from storage.objects")
echo "   $(wc -l < "$TMP/tablas.txt") tablas · usuarios $u_a→$u_b · archivos $o_a→$o_b"
[ "$u_a" = "$u_b" ] && [ "$o_a" = "$o_b" ] && [ "$diferencias" = "0" ] && echo "Traslado completo y verificado." || { echo "Revisar las diferencias antes de cambiar la dirección." >&2; exit 1; }
