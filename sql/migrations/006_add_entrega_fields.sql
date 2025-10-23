-- ================================================
-- MIGRACIÓN: Agregar campos de entrega a reserva
-- ================================================
-- Descripción: Agrega columnas para registrar el estado de entrega
--              de las áreas comunes por parte de los empleados
-- Fecha: 2025-10-23
-- ================================================

-- Agregar columna para el nombre de quien recibe el área
ALTER TABLE reserva 
ADD COLUMN IF NOT EXISTS entregado_a_nombre VARCHAR(255);

-- Agregar columna para el nombre del empleado que entrega
ALTER TABLE reserva 
ADD COLUMN IF NOT EXISTS entregado_por VARCHAR(255);

-- Comentarios para documentación
COMMENT ON COLUMN reserva.entregado_a_nombre IS 'Nombre completo de la persona que recibe el área común después de la reserva';
COMMENT ON COLUMN reserva.entregado_por IS 'Nombre completo del empleado que registra la entrega del área';

-- Verificar las columnas existentes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reserva' 
  AND column_name IN ('estado_entrega', 'descripcion_entrega', 'fecha_entrega', 'entregado_a_nombre', 'entregado_por')
ORDER BY column_name;
