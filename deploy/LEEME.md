# GEEPI en el AWS de Fombisol

GEEPI deja Vercel y Supabase y pasa al servidor de ATLAS (Lightsail `atlas-prod`, cuenta
empresarial). La aplicación no cambia: se montan las mismas piezas de código abierto que usa
Supabase, en contenedores propios y con una base de datos aparte de la de ATLAS.

| Pieza | Qué hace | Ruta pública |
|---|---|---|
| `db` | PostgreSQL de GEEPI | (solo interna) |
| `auth` | GoTrue: usuarios e inicio de sesión | `/auth/v1` |
| `rest` | PostgREST: tablas | `/rest/v1` |
| `storage` | Storage API: evidencias en disco | `/storage/v1` |
| `gateway` | Caddy: pantallas + rutas | `/` |

El Caddy de ATLAS publica la dirección con HTTPS y le pasa el tráfico a `geepi-gateway`
por la red `atlas_default`. Todo junto usa menos de 1 GB de memoria (con límites por contenedor).

## Instalación en el servidor (una sola vez)

```bash
cd /opt/geepi
docker run --rm -v "$PWD:/app" -w /app node:20-alpine node deploy/generar-claves.mjs https://geepi.fombisol.com.co
cd deploy && docker compose -p geepi up -d
```

`deploy/.env` queda solo en el servidor (permisos 600) y no se sube a Git. Si se borra, cambian
las claves y nadie podría volver a entrar: está incluido en el respaldo del servidor.

## Pantallas

Se compilan con la API en la misma dirección de la página y la llave `anon` del servidor:

```bash
VITE_SUPABASE_URL=mismo-origen VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY de deploy/.env> npx vite build
```

y se copia `dist/` a `/opt/geepi/dist`. No hace falta reiniciar nada.

## Traslado desde Supabase (una sola vez, con la base de destino vacía)

```bash
ORIGEN_DB_URL='postgresql://postgres:...@db.<proyecto>.supabase.co:5432/postgres' \
ORIGEN_URL=https://<proyecto>.supabase.co ORIGEN_SERVICE_KEY=<service_role> \
./deploy/trasladar-desde-supabase.sh
```

Copia usuarios con sus mismas contraseñas, tablas y datos, disparadores, reglas de acceso de
los archivos, buckets y cada archivo; al final compara las cantidades tabla por tabla. Supabase
solo se lee. Si algo falla: `docker compose -p geepi down -v`, `up -d` y repetir.

## Respaldo

`deploy/backup-geepi.sh` (cron diario, 14 días): base completa y archivos de evidencias en
`deploy/respaldos/`.
