-- Actualización V5: Galería de negocios y sistema de comentarios

-- 1. Añadir galería de imágenes al negocio
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS galeria_urls JSONB DEFAULT '[]'::jsonb;

-- 2. Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  texto TEXT NOT NULL,
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS para comentarios
ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para comentarios
CREATE POLICY "Permitir lectura pública de comentarios" ON comentarios FOR SELECT USING (true);
CREATE POLICY "Permitir creación pública de comentarios" ON comentarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir delete de comentarios" ON comentarios FOR DELETE USING (true);
CREATE POLICY "Permitir update de comentarios" ON comentarios FOR UPDATE USING (true);
