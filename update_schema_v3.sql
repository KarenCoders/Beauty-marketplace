-- Actualización V3: Añadir descripción corta al negocio
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS descripcion_corta TEXT;
