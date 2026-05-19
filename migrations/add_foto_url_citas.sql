-- ============================================
-- Migración: Añadir foto_url a citas
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Añadir columna foto_url (TEXT) a la tabla citas
ALTER TABLE citas ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Nota: Asegúrate de que el bucket 'imagenes' tiene políticas (RLS)
-- que permiten la inserción anónima a la carpeta 'citas' si quieres
-- que cualquier usuario web pueda subir fotos.
