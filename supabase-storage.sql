-- ===========================================
-- Roots by Stella — Supabase Storage Setup
-- ===========================================
-- Ejecuta este SQL en tu proyecto de Supabase:
-- Dashboard > SQL Editor > New Query > Pega y ejecuta

-- 1. Crear bucket público para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes', 'imagenes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acceso al bucket
CREATE POLICY "Lectura pública imagenes" ON storage.objects
  FOR SELECT USING (bucket_id = 'imagenes');

CREATE POLICY "Subida imagenes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'imagenes');

CREATE POLICY "Actualizar imagenes" ON storage.objects
  FOR UPDATE USING (bucket_id = 'imagenes');

CREATE POLICY "Eliminar imagenes" ON storage.objects
  FOR DELETE USING (bucket_id = 'imagenes');
