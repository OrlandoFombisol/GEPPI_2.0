-- Migración 003: Políticas públicas para checklist preoperacional QR
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Permite que conductores sin sesión (anon) envíen checklists desde el QR
CREATE POLICY "public_insert_checklist" ON public.checklist_preoperacional
  FOR INSERT WITH CHECK (true);

-- Permite que el panel admin (y el propio select de confirmación) lea todos
CREATE POLICY "public_read_checklist" ON public.checklist_preoperacional
  FOR SELECT USING (true);
