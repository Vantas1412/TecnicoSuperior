-- Seed de datos ficticios para facturación de servicios básicos
-- Seguro de re-ejecutar: usa INSERT ... ON CONFLICT DO NOTHING cuando es posible

-- Personas y usuarios (2 residentes)
INSERT INTO persona (id_persona, nombre, apellido, telefono)
VALUES
  ('PER001','Ana','Pérez','70000001'),
  ('PER002','Luis','García','70000002')
ON CONFLICT DO NOTHING;

INSERT INTO usuario (id_usuario, id_persona, username, rol, estado, correo_electronico, fecha_registro)
VALUES
  ('USR001','PER001','ana.perez','residente','activo','ana@example.com', NOW()),
  ('USR002','PER002','luis.garcia','residente','activo','luis@example.com', NOW())
ON CONFLICT DO NOTHING;

-- Departamentos
INSERT INTO departamento (id_departamento, tipo, piso, nro_cuartos, precio, tamanio, banio)
VALUES
  ('DEP001','A','1',2,650,75,1),
  ('DEP002','B','2',3,850,95,2)
ON CONFLICT DO NOTHING;

-- Crear residentes y relación de residencia (tu tabla VIVE usa id_residente)
INSERT INTO residente (id_residente, id_persona)
VALUES
  ('RES001','PER001'),
  ('RES002','PER002')
ON CONFLICT DO NOTHING;

INSERT INTO vive (id_vive, id_residente, id_departamento, fecha_ini)
VALUES
  ('VIV001','RES001','DEP001', CURRENT_DATE - INTERVAL '200 days'),
  ('VIV002','RES002','DEP002', CURRENT_DATE - INTERVAL '200 days')
ON CONFLICT DO NOTHING;

-- Medidores por servicio (uno por dpto y servicio)
INSERT INTO medidor (id_medidor, tipo, nro_serie, id_departamento, estado)
VALUES
  ('MED_AGUA_DEP001','agua','AGUA-001','DEP001','activo'),
  ('MED_LUZ_DEP001','luz','LUZ-001','DEP001','activo'),
  ('MED_GAS_DEP001','gas','GAS-001','DEP001','activo'),
  ('MED_NET_DEP001','internet','NET-001','DEP001','activo'),
  ('MED_AGUA_DEP002','agua','AGUA-002','DEP002','activo'),
  ('MED_LUZ_DEP002','luz','LUZ-002','DEP002','activo'),
  ('MED_GAS_DEP002','gas','GAS-002','DEP002','activo'),
  ('MED_NET_DEP002','internet','NET-002','DEP002','activo')
ON CONFLICT DO NOTHING;

-- Tarifas vigentes (unitarias)
INSERT INTO tarifa_servicio (servicio, tipo, valor_unitario, vigencia_desde)
VALUES
  ('agua','unitario',5.00, CURRENT_DATE - INTERVAL '1 year'),
  ('luz','unitario',1.20, CURRENT_DATE - INTERVAL '1 year'),
  ('gas','unitario',0.80, CURRENT_DATE - INTERVAL '1 year'),
  ('internet','unitario',0.10, CURRENT_DATE - INTERVAL '1 year') -- por GB, simulación
ON CONFLICT DO NOTHING;

-- Registros de medidor (lecturas mensuales acumuladas)
-- Generamos lecturas al cierre de agosto, septiembre y octubre para simular consumos por mes
-- Ajusta fechas según tu mes objetivo

-- DEP001
INSERT INTO registro_medidor (id_registro_medidor, id_medidor, fecha, hora, lectura, unidad)
VALUES
  ('REG1','MED_AGUA_DEP001','2025-08-31','23:59','120','m3'),
  ('REG2','MED_AGUA_DEP001','2025-09-30','23:59','140','m3'),
  ('REG3','MED_AGUA_DEP001','2025-10-31','23:59','165','m3'),
  ('REG4','MED_LUZ_DEP001','2025-08-31','23:59','1800','kWh'),
  ('REG5','MED_LUZ_DEP001','2025-09-30','23:59','1940','kWh'),
  ('REG6','MED_LUZ_DEP001','2025-10-31','23:59','2105','kWh'),
  ('REG7','MED_GAS_DEP001','2025-08-31','23:59','500','m3'),
  ('REG8','MED_GAS_DEP001','2025-09-30','23:59','515','m3'),
  ('REG9','MED_GAS_DEP001','2025-10-31','23:59','532','m3'),
  ('REG10','MED_NET_DEP001','2025-08-31','23:59','900','GB'),
  ('REG11','MED_NET_DEP001','2025-09-30','23:59','1000','GB'),
  ('REG12','MED_NET_DEP001','2025-10-31','23:59','1125','GB')
ON CONFLICT DO NOTHING;

-- DEP002
INSERT INTO registro_medidor (id_registro_medidor, id_medidor, fecha, hora, lectura, unidad)
VALUES
  ('REG13','MED_AGUA_DEP002','2025-08-31','23:59','200','m3'),
  ('REG14','MED_AGUA_DEP002','2025-09-30','23:59','222','m3'),
  ('REG15','MED_AGUA_DEP002','2025-10-31','23:59','246','m3'),
  ('REG16','MED_LUZ_DEP002','2025-08-31','23:59','2500','kWh'),
  ('REG17','MED_LUZ_DEP002','2025-09-30','23:59','2700','kWh'),
  ('REG18','MED_LUZ_DEP002','2025-10-31','23:59','2920','kWh'),
  ('REG19','MED_GAS_DEP002','2025-08-31','23:59','800','m3'),
  ('REG20','MED_GAS_DEP002','2025-09-30','23:59','820','m3'),
  ('REG21','MED_GAS_DEP002','2025-10-31','23:59','844','m3'),
  ('REG22','MED_NET_DEP002','2025-08-31','23:59','1200','GB'),
  ('REG23','MED_NET_DEP002','2025-09-30','23:59','1340','GB'),
  ('REG24','MED_NET_DEP002','2025-10-31','23:59','1510','GB')
ON CONFLICT DO NOTHING;

-- Nota: Ejecuta este script en el editor SQL de Supabase para cargar datos demo.
