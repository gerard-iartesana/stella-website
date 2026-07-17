-- ========================================================
-- Migración: Agrupación de Servicios y Categorías
-- Ejecutar en Supabase SQL Editor
-- ========================================================

-- 1. Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir columna categoria a la tabla servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'General';

-- 3. Insertar categorías por defecto basadas en los servicios actuales
INSERT INTO categorias (nombre, orden)
VALUES 
  ('Trenzas', 0),
  ('Sistemas Capilares', 1),
  ('Peinados', 2)
ON CONFLICT (nombre) DO NOTHING;

-- 4. Actualizar servicios existentes con categorías por defecto adecuadas
UPDATE servicios SET categoria = 'Trenzas' WHERE titulo ILIKE '%trenza%' OR titulo ILIKE '%braid%' OR titulo ILIKE '%twist%';
UPDATE servicios SET categoria = 'Sistemas Capilares' WHERE titulo ILIKE '%capilar%' OR titulo ILIKE '%prótesis%' OR titulo ILIKE '%protesis%';
UPDATE servicios SET categoria = 'Peinados' WHERE titulo ILIKE '%evento%' OR titulo ILIKE '%peinado%';
UPDATE servicios SET categoria = 'General' WHERE categoria IS NULL OR categoria = '';
