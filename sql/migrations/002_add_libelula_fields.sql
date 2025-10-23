-- Tabla pago: agregar campos para Libélula
ALTER TABLE pago ADD COLUMN IF NOT EXISTS id_transaccion_externa VARCHAR(100);
ALTER TABLE pago ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Pendiente';
ALTER TABLE pago ADD COLUMN IF NOT EXISTS datos_respuesta JSONB;

CREATE INDEX IF NOT EXISTS idx_pago_transaccion ON pago(id_transaccion_externa);

-- Tabla deuda: vincular con pago
ALTER TABLE deuda ADD COLUMN IF NOT EXISTS id_pago INTEGER REFERENCES pago(id_pago);
ALTER TABLE deuda ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP;

-- Nueva tabla para logs de transacciones
CREATE TABLE IF NOT EXISTS transacciones_libelula (
  id SERIAL PRIMARY KEY,
  orden_id VARCHAR(100) UNIQUE NOT NULL,
  id_deuda INTEGER REFERENCES deuda(id_deuda),
  id_pago INTEGER REFERENCES pago(id_pago),
  estado VARCHAR(50) NOT NULL,
  metodo VARCHAR(50),
  monto DECIMAL(10,2),
  appkey_usado VARCHAR(100),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trans_orden ON transacciones_libelula(orden_id);
CREATE INDEX IF NOT EXISTS idx_trans_deuda ON transacciones_libelula(id_deuda);
