-- ============================================
-- Migración: Añadir duracion_minutos a servicios
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Añadir columna duracion_minutos (minutos enteros)
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 120;

-- Actualizar servicios existentes con duraciones máximas
UPDATE servicios SET duracion_minutos = 360 WHERE titulo ILIKE '%trenzado%';
UPDATE servicios SET duracion_minutos = 120 WHERE titulo ILIKE '%peluca%' OR titulo ILIKE '%oncológic%';
UPDATE servicios SET duracion_minutos = 150 WHERE titulo ILIKE '%capilar%';
UPDATE servicios SET duracion_minutos = 120 WHERE titulo ILIKE '%evento%' OR titulo ILIKE '%peinado%';
