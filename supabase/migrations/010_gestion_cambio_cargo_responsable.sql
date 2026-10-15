-- La UI de Gestión del Cambio pide el cargo del responsable, pero la tabla
-- real nunca tuvo esa columna (solo quedó en la migración 001 el campo
-- "responsable", sin su cargo). Sin esto, cada intento de crear un registro
-- fallaba porque el insert mandaba una columna que no existía.
alter table public.gestion_cambio
  add column if not exists cargo_responsable text;
