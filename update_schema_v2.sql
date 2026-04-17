-- Actualización V2: Accesos, Mapas e Imágenes

-- 1. Añadir campos a negocios
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS mapa_enlace TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS mapa_embed TEXT;

-- Establecer un email y contraseña por defecto al negocio existente (para que no te quedes fuera)
UPDATE negocios SET admin_email = 'admin@demo.com', admin_password = 'demo' WHERE admin_email IS NULL;

-- 2. Añadir campos a empleados
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS password TEXT;

-- 3. Añadir imagen a servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS imagen_url TEXT;
