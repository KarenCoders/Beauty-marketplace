-- Actualización V10: Intervalo de Recompensas
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS fidelidad_intervalo_premio INTEGER DEFAULT 0;
