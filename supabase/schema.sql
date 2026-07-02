-- Intercoop FECORN - Schema Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de sesión (una por evento)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase TEXT NOT NULL DEFAULT 'REGISTRO',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar sesión del evento con ID fijo para facilitar referencias
INSERT INTO sessions (id, phase)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'REGISTRO')
ON CONFLICT DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cooperativas registradas
CREATE TABLE IF NOT EXISTS cooperativas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  nombre_contacto TEXT NOT NULL,
  telefono TEXT NOT NULL,
  nombre_cooperativa TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  direccion TEXT NOT NULL,
  rubro TEXT NOT NULL CHECK (rubro IN ('trabajo', 'consumo', 'servicios', 'vivienda', 'produccion')),
  actividad_especifica TEXT NOT NULL,
  selfie_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas del cuestionario
CREATE TABLE IF NOT EXISTS cuestionarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE UNIQUE,
  semaforo TEXT NOT NULL CHECK (semaforo IN ('critico', 'dificultades', 'estable', 'crecimiento')),
  desafios_colectivos TEXT,
  desafios_interpersonales TEXT,
  desafios_trabajo TEXT,
  desafios_precios TEXT,
  desafios_otros TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ofertas (lo que cada cooperativa ofrece)
CREATE TABLE IF NOT EXISTS ofertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  palabra TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooperativa_id, palabra)
);

-- Necesidades (lo que cada cooperativa elige de la nube)
CREATE TABLE IF NOT EXISTS necesidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cooperativa_id UUID REFERENCES cooperativas(id) ON DELETE CASCADE,
  palabra TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cooperativa_id, palabra)
);

-- Resumen IA
CREATE TABLE IF NOT EXISTS resumenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: habilitar pero permisivo para el evento (ajustar según necesidad)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuestionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumenes ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon (los participantes no están autenticados)
CREATE POLICY "allow_all_sessions" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cooperativas" ON cooperativas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cuestionarios" ON cuestionarios FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ofertas" ON ofertas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_necesidades" ON necesidades FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_resumenes" ON resumenes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Realtime: habilitar para sync en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE ofertas;
ALTER PUBLICATION supabase_realtime ADD TABLE necesidades;
