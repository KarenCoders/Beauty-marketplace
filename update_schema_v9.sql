-- Actualización V9: Historial de Sellos (Fechas) en Tarjetas de Fidelidad

ALTER TABLE tarjetas_fidelidad ADD COLUMN IF NOT EXISTS historial_sellos JSONB DEFAULT '[]'::jsonb;
