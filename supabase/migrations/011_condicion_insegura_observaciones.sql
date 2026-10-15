-- El formulario de Actos y Condiciones Inseguras manda "observaciones",
-- pero la tabla nunca tuvo esa columna, por eso todo intento de crear
-- o editar un registro fallaba con un error de columna inexistente.
alter table public.condicion_insegura
  add column if not exists observaciones text;
