-- Actualización de esquema: Agregar descripción a los servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
