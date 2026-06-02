-- ============================================
-- Migración: Añadir servicio_id a lookbook
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================

-- 1. Añadir columna servicio_id a la tabla lookbook si no existe
ALTER TABLE lookbook ADD COLUMN IF NOT EXISTS servicio_id TEXT;

-- 2. Actualizar lookbook existente enlazando con servicios correspondientes por título
UPDATE lookbook SET servicio_id = 'Trenzado' WHERE categoria = 'trenzas' AND servicio_id IS NULL;
UPDATE lookbook SET servicio_id = 'Pelucas Oncológicas' WHERE categoria = 'pelucas' AND servicio_id IS NULL;
UPDATE lookbook SET servicio_id = 'Sistema Capilar para Hombres' WHERE categoria = 'protesis' AND servicio_id IS NULL;
UPDATE lookbook SET servicio_id = 'Peinados para Eventos' WHERE categoria = 'especiales' AND servicio_id IS NULL;
