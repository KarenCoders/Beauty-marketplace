-- Actualización V7: Redes Sociales

ALTER TABLE negocios ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS tiktok TEXT;
