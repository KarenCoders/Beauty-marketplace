-- Supabase Database Schema para Beauty Marketplace

-- Habilitar la extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Negocios
CREATE TABLE IF NOT EXISTS negocios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  categoria TEXT NOT NULL,
  color_primario TEXT DEFAULT '#000000',
  color_secundario TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  whatsapp TEXT,
  redes_json JSONB DEFAULT '{}'::jsonb,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  duracion_min INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Empleados
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  foto_url TEXT,
  user_id UUID, -- Referencia a auth.users de Supabase (opcional para auth)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Citas
CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES servicios(id) ON DELETE CASCADE,
  empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'confirmada', 'cancelada'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS (Row Level Security) - Básicas para iniciar
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública para catálogos (cualquiera puede ver)
CREATE POLICY "Permitir lectura pública de negocios" ON negocios FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública de servicios" ON servicios FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública de empleados" ON empleados FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública de citas" ON citas FOR SELECT USING (true);

-- Permitir creación pública de citas (clientes agendando)
CREATE POLICY "Permitir creación de citas a cualquiera" ON citas FOR INSERT WITH CHECK (true);

-- Permitir actualización/borrado solo a usuarios autenticados (Para simplificar por ahora permitimos a todos si tienen el id, pero en prod debería ser restringido)
CREATE POLICY "Permitir update de citas" ON citas FOR UPDATE USING (true);
CREATE POLICY "Permitir delete de citas" ON citas FOR DELETE USING (true);

-- Nota: Para un panel de administrador real, aquí se agregarían políticas
-- para que auth.uid() coincida con el dueño del negocio.
