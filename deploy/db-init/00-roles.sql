-- GEEPI en el AWS de Fombisol: base de datos propia con los mismos roles que usa Supabase,
-- para que la aplicación (supabase-js) funcione sin cambios contra PostgREST, GoTrue y Storage.
-- Se ejecuta una sola vez, al crear el contenedor de la base de datos.
-- Las contraseñas llegan por variables de entorno (ver docker-compose.yml), nunca en este archivo.

\set pgpass `echo "$GEEPI_SERVICIOS_PASSWORD"`

-- Roles que PostgREST asume según el JWT de cada petición
CREATE ROLE anon NOLOGIN NOINHERIT;
CREATE ROLE authenticated NOLOGIN NOINHERIT;
CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;

-- PostgREST entra como authenticator y cambia al rol del token
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD :'pgpass';
GRANT anon, authenticated, service_role TO authenticator;

-- Dueños de los esquemas de usuarios (GoTrue) y de archivos (Storage); cada servicio crea sus tablas
CREATE ROLE supabase_auth_admin LOGIN NOINHERIT CREATEROLE PASSWORD :'pgpass';
CREATE ROLE supabase_storage_admin LOGIN NOINHERIT CREATEROLE PASSWORD :'pgpass';
GRANT anon, authenticated, service_role TO supabase_storage_admin;

-- Storage y GoTrue crean sus propios objetos al arrancar
GRANT CREATE, CONNECT, TEMPORARY ON DATABASE postgres TO supabase_auth_admin, supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
CREATE SCHEMA IF NOT EXISTS storage AUTHORIZATION supabase_storage_admin;
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO PUBLIC;
ALTER ROLE supabase_auth_admin SET search_path = auth;
ALTER ROLE supabase_storage_admin SET search_path = storage;

GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

-- Igual que en Supabase: los permisos de tabla son amplios y la seguridad real la dan las políticas RLS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Storage crea sus tablas al arrancar: deben quedar visibles para los roles de la aplicación
-- (las políticas RLS de storage.objects son las que deciden qué puede hacer cada uno)
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_storage_admin IN SCHEMA storage GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- Límite de tiempo por consulta, para que una petición pesada no tumbe el servicio
ALTER ROLE anon SET statement_timeout = '15s';
ALTER ROLE authenticated SET statement_timeout = '30s';
