-- Actualización V8: Programa de Fidelidad Dinámico

ALTER TABLE negocios ADD COLUMN IF NOT EXISTS fidelidad_puntos_meta INTEGER DEFAULT 10;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS fidelidad_recompensa TEXT DEFAULT 'Premio sorpresa al completar tu tarjeta';
