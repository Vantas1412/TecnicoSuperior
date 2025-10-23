-- ================================================
-- DATOS FICTICIOS: Áreas Comunes y Reservas
-- Fecha: 2025-10-23
-- Propósito: Poblar el sistema con datos de prueba
-- ================================================

-- ================================================
-- 1. COMPLETAR ÁREAS EXISTENTES
-- ================================================
UPDATE area_comun 
SET 
  descripcion = 'Amplio salón para eventos sociales, cumpleaños y reuniones familiares. Incluye mesas, sillas y sistema de audio.',
  ubicacion = 'Planta Baja',
  tiempo_limpieza_horas = 1,
  hora_apertura = '08:00',
  hora_cierre = '22:00',
  minimo_horas_reserva = 2,
  activo = TRUE
WHERE id_area = 'ARC001' AND nombre = 'Salón de Eventos';

UPDATE area_comun 
SET 
  descripcion = 'Piscina temperada de 15x8 metros con área de descanso, duchas y vestidores.',
  ubicacion = 'Terraza - Piso 5',
  tiempo_limpieza_horas = 1,
  hora_apertura = '08:00',
  hora_cierre = '20:00',
  minimo_horas_reserva = 1,
  activo = TRUE
WHERE id_area = 'ARC002' AND nombre LIKE '%Piscina%';

-- ================================================
-- 2. AGREGAR NUEVAS ÁREAS (si no existen)
-- ================================================
INSERT INTO area_comun (id_area, nombre, capacidad, tipo, estado, descripcion, ubicacion, tiempo_limpieza_horas, hora_apertura, hora_cierre, minimo_horas_reserva, activo)
SELECT * FROM (VALUES
  ('ARC003', 'Gimnasio', 15, 'Deportivo', 'Disponible', 'Gimnasio equipado con máquinas de cardio, pesas y colchonetas. Incluye baño y duchas.', 'Sótano - Piso -1', 1, '06:00'::TIME, '22:00'::TIME, 1, TRUE),
  ('ARC004', 'Cancha Deportiva', 20, 'Deportivo', 'Disponible', 'Cancha multifuncional para fútbol, vóley y básquet. Incluye malla perimetral e iluminación.', 'Terraza - Piso 6', 1, '08:00'::TIME, '21:00'::TIME, 1, TRUE),
  ('ARC005', 'Sala de Reuniones', 12, 'Sala', 'Disponible', 'Sala equipada con mesa de juntas, proyector, pizarra y aire acondicionado.', 'Piso 2', 1, '08:00'::TIME, '20:00'::TIME, 1, TRUE),
  ('ARC006', 'Parrillero', 30, 'Recreación', 'Disponible', 'Área de parrillas con mesas, bancos y lavaderos. Ideal para asados familiares.', 'Jardín Trasero', 2, '10:00'::TIME, '22:00'::TIME, 2, TRUE),
  ('ARC007', 'Sala de Juegos', 15, 'Recreación', 'Disponible', 'Sala con mesa de pool, ping-pong, futbolín y juegos de mesa.', 'Piso 1', 1, '09:00'::TIME, '21:00'::TIME, 1, TRUE)
) AS v(id_area, nombre, capacidad, tipo, estado, descripcion, ubicacion, tiempo_limpieza_horas, hora_apertura, hora_cierre, minimo_horas_reserva, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM area_comun WHERE id_area = v.id_area
);

-- ================================================
-- 3. GENERAR IDs PARA RESERVAS FICTICIAS
-- ================================================
-- Usaremos RSV_TEST_001, RSV_TEST_002, etc.

-- ================================================
-- 4. CREAR RESERVAS FICTICIAS PARA PRÓXIMOS 7 DÍAS
-- ================================================

-- Fecha base: hoy + 1 día (2025-10-24)
-- Vamos a crear reservas variadas para diferentes áreas

-- RESERVA 1: Salón de Eventos - Mañana - Aprobada
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_001',
  'ARC001',
  (SELECT id_persona FROM persona LIMIT 1),
  '2025-10-24'::DATE,
  CURRENT_DATE,
  '14:00'::TIME,
  '18:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_001');

-- RESERVA 2: Piscina - Mañana - Aprobada
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_002',
  'ARC002',
  (SELECT id_persona FROM persona OFFSET 1 LIMIT 1),
  '2025-10-24'::DATE,
  CURRENT_DATE,
  '10:00'::TIME,
  '12:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_002');

-- RESERVA 3: Gimnasio - Pasado mañana - Completada con entrega
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado,
  estado_entrega,
  descripcion_entrega,
  fecha_entrega,
  entregado_a
)
SELECT 
  'RSV_TEST_003',
  'ARC003',
  (SELECT id_persona FROM persona OFFSET 2 LIMIT 1),
  '2025-10-25'::DATE,
  CURRENT_DATE,
  '07:00'::TIME,
  '09:00'::TIME,
  'Completada',
  'Excelente',
  'Todo en perfecto estado. Equipos limpios y ordenados.',
  '2025-10-25 09:15:00'::TIMESTAMP,
  (SELECT id_empleado FROM empleado LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_003');

-- RESERVA 4: Cancha Deportiva - Hoy (conflicto para probar validación)
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_004',
  'ARC004',
  (SELECT id_persona FROM persona OFFSET 3 LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE,
  '16:00'::TIME,
  '18:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_004');

-- RESERVA 5: Sala de Reuniones - Dentro de 2 días - Pendiente
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_005',
  'ARC005',
  (SELECT id_persona FROM persona OFFSET 4 LIMIT 1),
  (CURRENT_DATE + INTERVAL '2 days')::DATE,
  CURRENT_DATE,
  '09:00'::TIME,
  '11:00'::TIME,
  'Pendiente'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_005');

-- RESERVA 6: Parrillero - Dentro de 3 días - Aprobada
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_006',
  'ARC006',
  (SELECT id_persona FROM persona OFFSET 5 LIMIT 1),
  (CURRENT_DATE + INTERVAL '3 days')::DATE,
  CURRENT_DATE,
  '12:00'::TIME,
  '16:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_006');

-- RESERVA 7: Sala de Juegos - Dentro de 4 días - Completada con DAÑO
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado,
  estado_entrega,
  descripcion_entrega,
  fecha_entrega,
  entregado_a
)
SELECT 
  'RSV_TEST_007',
  'ARC007',
  (SELECT id_persona FROM persona OFFSET 6 LIMIT 1),
  (CURRENT_DATE + INTERVAL '4 days')::DATE,
  CURRENT_DATE,
  '15:00'::TIME,
  '17:00'::TIME,
  'Completada',
  'Malo',
  'Se encontró la mesa de pool rayada y falta un taco. Requiere reparación.',
  (CURRENT_DATE + INTERVAL '4 days' + INTERVAL '2 hours')::TIMESTAMP,
  (SELECT id_empleado FROM empleado OFFSET 1 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_007');

-- RESERVA 8: Piscina - Dentro de 5 días (múltiples reservas mismo día)
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_008',
  'ARC002',
  (SELECT id_persona FROM persona OFFSET 7 LIMIT 1),
  (CURRENT_DATE + INTERVAL '5 days')::DATE,
  CURRENT_DATE,
  '08:00'::TIME,
  '10:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_008');

-- RESERVA 9: Piscina - Dentro de 5 días (debe respetar hora_fin_con_limpieza de RSV_TEST_008)
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_009',
  'ARC002',
  (SELECT id_persona FROM persona LIMIT 1),
  (CURRENT_DATE + INTERVAL '5 days')::DATE,
  CURRENT_DATE,
  '11:00'::TIME,  -- Después de 10:00 + 1 hora limpieza = 11:00
  '13:00'::TIME,
  'Aprobada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_009');

-- RESERVA 10: Gimnasio - Dentro de 6 días - Cancelada
INSERT INTO reserva (
  id_reserva, 
  id_registro_area, 
  id_persona,
  fecha_reservacion,
  fecha_creacion,
  hora_inicio,
  hora_fin,
  estado
)
SELECT 
  'RSV_TEST_010',
  'ARC003',
  (SELECT id_persona FROM persona OFFSET 1 LIMIT 1),
  (CURRENT_DATE + INTERVAL '6 days')::DATE,
  CURRENT_DATE,
  '18:00'::TIME,
  '20:00'::TIME,
  'Cancelada'
WHERE NOT EXISTS (SELECT 1 FROM reserva WHERE id_reserva = 'RSV_TEST_010');

-- ================================================
-- 5. VERIFICACIÓN FINAL
-- ================================================
SELECT 
  'DATOS FICTICIOS CREADOS' AS mensaje,
  (SELECT COUNT(*) FROM area_comun WHERE id_area LIKE 'ARC%') AS total_areas,
  (SELECT COUNT(*) FROM reserva WHERE id_reserva LIKE 'RSV_TEST%') AS reservas_ficticias,
  (SELECT COUNT(*) FROM reserva WHERE hora_inicio IS NOT NULL) AS reservas_con_horario,
  (SELECT COUNT(*) FROM reserva WHERE estado_entrega IS NOT NULL) AS reservas_con_entrega;

-- Ver distribución de reservas por área
SELECT 
  a.nombre AS area,
  COUNT(r.id_reserva) AS total_reservas,
  COUNT(CASE WHEN r.estado = 'Aprobada' THEN 1 END) AS aprobadas,
  COUNT(CASE WHEN r.estado = 'Completada' THEN 1 END) AS completadas
FROM area_comun a
LEFT JOIN reserva r ON a.id_area = r.id_registro_area AND r.id_reserva LIKE 'RSV_TEST%'
GROUP BY a.id_area, a.nombre
ORDER BY a.nombre;

-- Ver reservas con hora_fin_con_limpieza calculada
SELECT 
  id_reserva,
  (SELECT nombre FROM area_comun WHERE id_area = r.id_registro_area) AS area,
  fecha_reservacion,
  hora_inicio,
  hora_fin,
  hora_fin_con_limpieza,
  estado
FROM reserva r
WHERE id_reserva LIKE 'RSV_TEST%'
ORDER BY fecha_reservacion, hora_inicio;
