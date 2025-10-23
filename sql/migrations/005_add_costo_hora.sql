-- =====================================================
-- Migración 005: Agregar columna costo_hora a area_comun
-- Fecha: 2025-01-23
-- Descripción: Agrega el campo costo_hora para calcular
--              el precio de reservas por hora
-- =====================================================

-- Agregar columna costo_hora
ALTER TABLE area_comun 
ADD COLUMN IF NOT EXISTS costo_hora NUMERIC(10,2) DEFAULT 50.00;

-- Actualizar áreas existentes con costos diferenciados
UPDATE area_comun 
SET costo_hora = CASE 
    WHEN nombre ILIKE '%salón%' OR nombre ILIKE '%salon%' THEN 100.00
    WHEN nombre ILIKE '%piscina%' THEN 75.00
    WHEN nombre ILIKE '%gimnasio%' THEN 30.00
    WHEN nombre ILIKE '%cancha%' THEN 60.00
    WHEN nombre ILIKE '%parrillero%' OR nombre ILIKE '%parrilla%' THEN 80.00
    WHEN nombre ILIKE '%sala%' THEN 50.00
    ELSE 50.00
END
WHERE costo_hora = 50.00 OR costo_hora IS NULL;

-- Comentario de la columna
COMMENT ON COLUMN area_comun.costo_hora IS 'Costo por hora de reserva del área común en bolivianos (Bs)';

-- Verificación
SELECT 
    id_area,
    nombre,
    costo_hora,
    CONCAT('Bs. ', costo_hora, ' por hora') as precio_texto
FROM area_comun
ORDER BY costo_hora DESC;
