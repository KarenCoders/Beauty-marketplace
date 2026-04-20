-- Actualización V6: Clientes, Cuentas Globales y Fidelidad

-- 1. Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Añadir cliente_id a citas (puede ser nulo si es un invitado)
ALTER TABLE citas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- 3. Crear tabla de fidelidad
CREATE TABLE IF NOT EXISTS tarjetas_fidelidad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  puntos INTEGER DEFAULT 0,
  puntos_totales INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cliente_id, negocio_id)
);

-- 4. Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarjetas_fidelidad ENABLE ROW LEVEL SECURITY;

-- 5. Políticas
-- (Para el prototipo permitimos operaciones abiertas, en un entorno de prod deberíamos filtrar por usuario autenticado)
CREATE POLICY "Permitir lectura y escritura en clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura y escritura en tarjetas_fidelidad" ON tarjetas_fidelidad FOR ALL USING (true) WITH CHECK (true);
