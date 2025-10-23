-- ================================================
-- MIGRACIÓN: Sistema de Reservas y Entrega v1.0 FINAL
-- Fecha: 2025-01-23
-- Adaptada 100% a la estructura real de la BD
-- ================================================

-- ================================================
-- 1. ACTUALIZAR TABLA: area_comun
-- ================================================
ALTER TABLE area_comun 
  ADD COLUMN IF NOT EXISTS tiempo_limpieza_horas INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS hora_apertura TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS hora_cierre TIME DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS minimo_horas_reserva INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

UPDATE area_comun 
SET 
  tiempo_limpieza_horas = COALESCE(tiempo_limpieza_horas, 1),
  hora_apertura = COALESCE(hora_apertura, '08:00'::TIME),
  hora_cierre = COALESCE(hora_cierre, '22:00'::TIME),
  minimo_horas_reserva = COALESCE(minimo_horas_reserva, 1),
  activo = COALESCE(activo, TRUE);

-- ================================================
-- 2. ACTUALIZAR TABLA: reserva
-- ================================================
ALTER TABLE reserva
  ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Pendiente',
  ADD COLUMN IF NOT EXISTS hora_inicio TIME,
  ADD COLUMN IF NOT EXISTS hora_fin TIME,
  ADD COLUMN IF NOT EXISTS hora_fin_con_limpieza TIME,
  ADD COLUMN IF NOT EXISTS estado_entrega VARCHAR(50),
  ADD COLUMN IF NOT EXISTS descripcion_entrega TEXT,
  ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMP,
  ADD COLUMN IF NOT EXISTS entregado_a VARCHAR(50),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_estado_entrega') THEN
    ALTER TABLE reserva
      ADD CONSTRAINT check_estado_entrega 
      CHECK (estado_entrega IS NULL OR estado_entrega IN ('Excelente', 'Bueno', 'Regular', 'Malo', 'Dañado'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_estado_reserva') THEN
    ALTER TABLE reserva
      ADD CONSTRAINT check_estado_reserva 
      CHECK (estado IS NULL OR estado IN ('Pendiente', 'Aprobada', 'Rechazada', 'Cancelada', 'Completada', 'En Uso'));
  END IF;
END $$;

-- ================================================
-- 3. FUNCIÓN: Calcular hora_fin_con_limpieza
-- ================================================
CREATE OR REPLACE FUNCTION calcular_hora_limpieza()
RETURNS TRIGGER AS $$
DECLARE
  v_tiempo_limpieza INTEGER;
BEGIN
  SELECT COALESCE(tiempo_limpieza_horas, 1) INTO v_tiempo_limpieza
  FROM area_comun
  WHERE id_area = NEW.id_registro_area;
  
  IF NEW.hora_fin IS NOT NULL THEN
    NEW.hora_fin_con_limpieza := NEW.hora_fin + (v_tiempo_limpieza || ' hours')::INTERVAL;
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_limpieza ON reserva;
CREATE TRIGGER trg_calcular_limpieza
  BEFORE INSERT OR UPDATE OF hora_fin, id_registro_area
  ON reserva
  FOR EACH ROW
  EXECUTE FUNCTION calcular_hora_limpieza();

-- ================================================
-- 4. FUNCIÓN: Sincronizar horas desde tabla horario
-- ================================================
CREATE OR REPLACE FUNCTION sincronizar_horas_horario()
RETURNS TRIGGER AS $$
DECLARE
  v_horario RECORD;
BEGIN
  IF NEW.id_horario IS NOT NULL THEN
    SELECT hora_inicio, hora_fin INTO v_horario
    FROM horario
    WHERE id_horario = NEW.id_horario;
    
    IF FOUND THEN
      NEW.hora_inicio := v_horario.hora_inicio;
      NEW.hora_fin := v_horario.hora_fin;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_horario ON reserva;
CREATE TRIGGER trg_sincronizar_horario
  BEFORE INSERT OR UPDATE OF id_horario
  ON reserva
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_horas_horario();

-- ================================================
-- 5. FUNCIÓN: Validar disponibilidad de horario
-- ================================================
CREATE OR REPLACE FUNCTION validar_disponibilidad_horario(
  p_id_area VARCHAR,
  p_fecha DATE,
  p_hora_inicio TIME,
  p_hora_fin TIME,
  p_id_reserva_excluir VARCHAR DEFAULT NULL
) RETURNS TABLE(
  disponible BOOLEAN,
  mensaje TEXT
) AS $$
DECLARE
  v_area RECORD;
  v_duracion_horas DECIMAL;
  v_conflicto INTEGER;
BEGIN
  SELECT * INTO v_area
  FROM area_comun
  WHERE id_area = p_id_area AND COALESCE(activo, TRUE) = TRUE;
  
  IF v_area IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Área no encontrada o inactiva';
    RETURN;
  END IF;
  
  IF p_hora_inicio < COALESCE(v_area.hora_apertura, '08:00'::TIME) THEN
    RETURN QUERY SELECT FALSE, 
      format('El área abre a las %s', COALESCE(v_area.hora_apertura, '08:00'::TIME));
    RETURN;
  END IF;
  
  IF p_hora_fin > COALESCE(v_area.hora_cierre, '22:00'::TIME) THEN
    RETURN QUERY SELECT FALSE,
      format('El área cierre a las %s', COALESCE(v_area.hora_cierre, '22:00'::TIME));
    RETURN;
  END IF;
  
  v_duracion_horas := EXTRACT(EPOCH FROM (p_hora_fin - p_hora_inicio)) / 3600;
  
  IF v_duracion_horas < COALESCE(v_area.minimo_horas_reserva, 1) THEN
    RETURN QUERY SELECT FALSE,
      format('La reserva mínima es de %s hora(s)', COALESCE(v_area.minimo_horas_reserva, 1));
    RETURN;
  END IF;
  
  IF EXTRACT(MINUTE FROM p_hora_inicio) != 0 OR EXTRACT(MINUTE FROM p_hora_fin) != 0 THEN
    RETURN QUERY SELECT FALSE,
      'Las reservas deben ser en horas completas (ej: 8:00, 9:00, 10:00)';
    RETURN;
  END IF;
  
  SELECT COUNT(*) INTO v_conflicto
  FROM reserva
  WHERE id_registro_area = p_id_area
    AND fecha_reservacion = p_fecha
    AND COALESCE(estado, 'Pendiente') NOT IN ('Cancelada', 'Rechazada')
    AND (p_id_reserva_excluir IS NULL OR id_reserva != p_id_reserva_excluir)
    AND hora_inicio IS NOT NULL
    AND hora_fin_con_limpieza IS NOT NULL
    AND (p_hora_inicio < hora_fin_con_limpieza AND p_hora_fin > hora_inicio);
  
  IF v_conflicto > 0 THEN
    RETURN QUERY SELECT FALSE,
      'Horario no disponible. Recuerda que cada reserva incluye 1 hora de limpieza.';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'Horario disponible';
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. FUNCIÓN: Obtener horarios ocupados
-- ================================================
CREATE OR REPLACE FUNCTION obtener_horarios_ocupados(
  p_id_area VARCHAR,
  p_fecha DATE
) RETURNS TABLE(
  hora_inicio TIME,
  hora_fin TIME,
  hora_fin_con_limpieza TIME,
  estado VARCHAR,
  residente_nombre TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.hora_inicio,
    r.hora_fin,
    r.hora_fin_con_limpieza,
    COALESCE(r.estado, 'Pendiente') AS estado,
    p.nombre || ' ' || p.apellido AS residente_nombre
  FROM reserva r
  INNER JOIN persona p ON r.id_persona = p.id_persona
  WHERE r.id_registro_area = p_id_area
    AND r.fecha_reservacion = p_fecha
    AND COALESCE(r.estado, 'Pendiente') NOT IN ('Cancelada', 'Rechazada')
    AND r.hora_inicio IS NOT NULL
  ORDER BY r.hora_inicio;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. VISTA: Reservas con información completa
-- ================================================
CREATE OR REPLACE VIEW v_reservas_completas AS
SELECT 
  r.id_reserva,
  r.fecha_reservacion,
  r.fecha_creacion,
  r.hora_inicio,
  r.hora_fin,
  r.hora_fin_con_limpieza,
  COALESCE(r.estado, 'Pendiente') AS estado,
  r.estado_entrega,
  r.descripcion_entrega,
  r.fecha_entrega,
  
  a.id_area,
  a.nombre AS nombre_area,
  a.tipo AS tipo_area,
  a.capacidad,
  COALESCE(a.ubicacion, '') AS ubicacion,
  a.tiempo_limpieza_horas,
  
  p.id_persona,
  p.nombre || ' ' || p.apellido AS residente_nombre,
  p.telefono AS residente_telefono,
  
  pe.nombre || ' ' || pe.apellido AS entregado_a_nombre,
  
  r.created_at,
  r.updated_at
FROM reserva r
INNER JOIN area_comun a ON r.id_registro_area = a.id_area
INNER JOIN persona p ON r.id_persona = p.id_persona
LEFT JOIN empleado e ON r.entregado_a = e.id_empleado
LEFT JOIN persona pe ON e.id_persona = pe.id_persona;

-- ================================================
-- 8. ÍNDICES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_reserva_fecha_hora 
  ON reserva(fecha_reservacion, hora_inicio, hora_fin);

CREATE INDEX IF NOT EXISTS idx_reserva_area_fecha 
  ON reserva(id_registro_area, fecha_reservacion);

CREATE INDEX IF NOT EXISTS idx_reserva_estado 
  ON reserva(estado);

CREATE INDEX IF NOT EXISTS idx_reserva_estado_entrega 
  ON reserva(estado_entrega);

-- ================================================
-- 9. ACTUALIZAR ÁREAS EXISTENTES
-- ================================================
UPDATE area_comun SET ubicacion = 'Piso 1' WHERE id_area = 'ARC001';
UPDATE area_comun SET ubicacion = 'Terraza' WHERE id_area = 'ARC002';
UPDATE area_comun SET descripcion = 'Salón principal para eventos y celebraciones' WHERE id_area = 'ARC001';
UPDATE area_comun SET descripcion = 'Piscina temperada con área de descanso' WHERE id_area = 'ARC002';

-- ================================================
-- VERIFICACIÓN FINAL
-- ================================================
SELECT 
  'Migración completada exitosamente' AS mensaje,
  (SELECT COUNT(*) FROM area_comun) AS areas_registradas,
  (SELECT COUNT(*) FROM reserva) AS reservas_existentes,
  (SELECT COUNT(*) FROM horario) AS horarios_disponibles;