-- SQL de ejemplo para crear y actualizar las tablas de empresas y servicios
-- de mantenimiento en Supabase.  Está incluido dentro del proyecto para
-- referencia del desarrollador.  Puedes ejecutarlo en la consola SQL
-- de Supabase para crear las tablas `empresa`, `servicio` y `empresa_servicio`
-- y poblarlas con datos de ejemplo.  Si ya existen, el script utilizará
-- ON CONFLICT para evitar duplicados.  Adapta los identificadores de los
-- servicios (`id_servicio`) a los valores que utilice tu base de datos.

-- Crea la tabla de empresas si no existe.  Cada empresa tiene un
-- identificador único (id_empresa) y datos básicos de contacto.
CREATE TABLE IF NOT EXISTS public.empresa (
    id_empresa VARCHAR PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    email TEXT
);

-- Crea la tabla de servicios (tipos de mantenimiento).  Ajusta el
-- tipo de dato del identificador según necesites (varchar, uuid, etc.).
CREATE TABLE IF NOT EXISTS public.servicio (
    id_servicio VARCHAR PRIMARY KEY,
    tipo_servicio VARCHAR NOT NULL
);

-- Crea la tabla intermedia que relaciona empresas con los servicios que
-- ofrecen.  Ambas columnas son claves foráneas y combinadas forman la
-- clave primaria.
CREATE TABLE IF NOT EXISTS public.empresa_servicio (
    id_empresa VARCHAR REFERENCES public.empresa(id_empresa) ON DELETE CASCADE,
    id_servicio VARCHAR REFERENCES public.servicio(id_servicio) ON DELETE CASCADE,
    PRIMARY KEY (id_empresa, id_servicio)
);

-- Inserta datos de ejemplo para las empresas.  Estos valores reflejan
-- las capturas de pantalla proporcionadas.  Usa ON CONFLICT para
-- evitar insertar duplicados si los registros ya existen.
INSERT INTO public.empresa (id_empresa, nombre, telefono, email) VALUES
    ('EMP_AGUA', 'Servicio de Agua', '222-2222', 'agua@ejemplo.com'),
    ('EMP_ELEC', 'Servicio Eléctrico', '111-1111', 'electricidad@ejemplo.com'),
    ('EMP_GAS', 'Servicio de Gas', '333-3333', 'gas@ejemplo.com'),
    ('EMP_MANT', 'Mantenimiento General', '555-5555', 'mantgeneral@ejemplo.com'),
    ('EMP_NET', 'Servicio de Internet', '444-4444', 'internet@ejemplo.com'),
    ('EMP_OTRO', 'Otros Problemas', '666-6666', 'otros@ejemplo.com')
ON CONFLICT (id_empresa) DO NOTHING;

-- Inserta datos de ejemplo para los servicios.  Cambia los códigos
-- (SRV001, SRV002, etc.) por los identificadores reales de tus
-- servicios en la base de datos.  Nuevamente usamos ON CONFLICT para
-- evitar duplicados.
INSERT INTO public.servicio (id_servicio, tipo_servicio) VALUES
    ('SRV001', 'Mantenimiento de Departamento'),
    ('SRV002', 'Limpieza de Departamento'),
    ('SRV003', 'Mantenimiento de Tuberías'),
    ('SRV004', 'Mantenimiento de Instalaciones Eléctrica'),
    ('SRV005', 'Mantenimiento de Jardines'),
    ('SRV006', 'Mantenimiento de Muebles de Madera')
ON CONFLICT (id_servicio) DO NOTHING;

-- Inserta las relaciones empresa/servicio.  Ajusta según corresponda
-- a tu organización.  Utiliza ON CONFLICT para evitar duplicados.
INSERT INTO public.empresa_servicio (id_empresa, id_servicio) VALUES
    ('EMP_AGUA', 'SRV003'),   -- Agua → Mantenimiento de Tuberías
    ('EMP_ELEC', 'SRV004'),   -- Eléctrico → Instalaciones Eléctricas
    ('EMP_GAS', 'SRV003'),    -- Gas → Tuberías
    ('EMP_MANT', 'SRV001'),   -- General → Mantenimiento de Departamento
    ('EMP_NET', 'SRV004'),    -- Internet → Instalaciones eléctricas (redes)
    ('EMP_OTRO', 'SRV006')    -- Otros → Muebles de madera
ON CONFLICT (id_empresa, id_servicio) DO NOTHING;

-- Si tus servicios tienen otros identificadores (por ejemplo,
-- 'srv_mant_depto', 'srv_limpieza_depto', etc.), actualiza las
-- filas correspondientes.  Los siguientes ejemplos están comentados
-- y muestran cómo realizar el cambio:
-- UPDATE public.servicio SET id_servicio = 'srv_mant_depto'
--   WHERE id_servicio = 'SRV001';
-- UPDATE public.servicio SET id_servicio = 'srv_limpieza_depto'
--   WHERE id_servicio = 'SRV002';
-- UPDATE public.servicio SET id_servicio = 'srv_mant_tuberias'
--   WHERE id_servicio = 'SRV003';
-- UPDATE public.servicio SET id_servicio = 'srv_mant_instalaciones'
--   WHERE id_servicio = 'SRV004';
-- UPDATE public.servicio SET id_servicio = 'srv_mant_jardines'
--   WHERE id_servicio = 'SRV005';
-- UPDATE public.servicio SET id_servicio = 'srv_mant_muebles'
--   WHERE id_servicio = 'SRV006';

-- No olvides actualizar también la tabla de relaciones `empresa_servicio` si
-- cambias los códigos de los servicios para mantener la coherencia.