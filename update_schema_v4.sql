-- Actualización V4: Añadir galería de imágenes a servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS galeria_urls JSONB DEFAULT '[]'::jsonb;
