-- ===========================================
-- Roots by Stella — Supabase Database Schema
-- ===========================================
-- Ejecuta este SQL en tu proyecto de Supabase:
-- Dashboard > SQL Editor > New Query > Pega y ejecuta

-- 1. Tabla Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  duracion TEXT,
  precio TEXT,
  imagenes TEXT[] DEFAULT '{}',
  incluye TEXT[] DEFAULT '{}',
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla Lookbook
CREATE TABLE IF NOT EXISTS lookbook (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imagen TEXT NOT NULL,
  categoria TEXT,
  alt TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla Mensajes
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  asunto TEXT DEFAULT 'Consulta general',
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  respondido BOOLEAN DEFAULT false,
  respuesta TEXT,
  respondido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabla Citas
CREATE TABLE IF NOT EXISTS citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_cliente TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  servicio TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  notas TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Row Level Security (RLS) — Modo público
-- ==========================================
-- Para el MVP, deshabilitamos RLS para acceso público
-- IMPORTANTE: Cuando añadas autenticación, activa RLS

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas temporales (acceso público)
CREATE POLICY "Acceso público servicios" ON servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público lookbook" ON lookbook FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público mensajes" ON mensajes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público citas" ON citas FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Habilitar Realtime para mensajes
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE mensajes;
