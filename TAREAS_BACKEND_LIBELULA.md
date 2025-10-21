# 🔧 TAREAS PARA BACKEND DEVELOPER - INTEGRACIÓN LIBÉLULA

## ✅ LO QUE YA ESTÁ HECHO (FRONTEND)

1. ✅ Modal de pasarela completo con UI (`PasarelaPagos.jsx`)
2. ✅ Componente de comprobante (`ComprobantePago.jsx`)
3. ✅ Integración en PagosSeccion
4. ✅ LibelulaService con funciones MOCK
5. ✅ Variables de entorno configuradas
6. ✅ Dependencias instaladas (axios, qrcode.react, jspdf)

---

## 🚧 TU TRABAJO: IMPLEMENTAR LÓGICA REAL DE LIBÉLULA

### 📦 **TAREA 1: LibelulaService.js - REEMPLAZAR MOCKS**

**Archivo:** `src/services/LibelulaService.js`

Buscar comentarios: `// TODO: Tu amigo`

#### Funciones a implementar:

1. **`iniciarPago(deuda, pagador, metodoPago)`**
   - Endpoint: `POST https://sandbox.libelula.bo/api/v1/payment/new`
   - Body:
     ```javascript
     {
       appkey: "11bb10ce-68ba-4af1-8eb7-4e6624fed729",
       concepto: deuda.concepto,
       monto: deuda.monto,
       moneda: "BOB",
       descripcion: deuda.descripcion,
       email: pagador.email,
       telefono: pagador.telefono,
       nombre: pagador.nombre,
       ci: pagador.ci,
       metodo: metodoPago, // "QR" o "CARD"
       url_callback: window.location.origin + "/pagos/callback"
     }
     ```
   - Retorna: `{ success: true, data: { orden_id, qr_data, url_checkout, estado } }`

2. **`verificarEstadoPago(ordenId)`**
   - Endpoint: `GET https://sandbox.libelula.bo/api/v1/payment/status/{ordenId}`
   - Headers: `{ 'X-App-Key': '11bb10ce-68ba-4af1-8eb7-4e6624fed729' }`
   - Retorna: `{ success: true, data: { estado: "PENDING"|"APPROVED"|"REJECTED", transaccion_id, fecha, monto, metodo } }`

3. **`procesarPagoTarjeta(ordenId, datosTarjeta)`**
   - Endpoint: `POST https://sandbox.libelula.bo/api/v1/payment/process`
   - Body:
     ```javascript
     {
       orden_id: ordenId,
       numero_tarjeta: datosTarjeta.numero,
       mes_vencimiento: datosTarjeta.mes,
       anio_vencimiento: datosTarjeta.anio,
       cvv: datosTarjeta.cvv,
       nombre_titular: datosTarjeta.titular
     }
     ```

4. **`generarQR(ordenId)`** (si Libélula lo provee)
   - Endpoint: `GET https://sandbox.libelula.bo/api/v1/payment/qr/{ordenId}`

**Usar axios para las llamadas:**
```javascript
import axios from 'axios'

const response = await axios.post(url, body, { headers })
```

---

### 💾 **TAREA 2: Actualizar PagoService.js**

**Archivo:** `src/services/PagoService.js`

#### Métodos a agregar:

1. **`registrarPagoLibelula(deuda, ordenLibelula, estadoPago, usuario)`**
   ```javascript
   async registrarPagoLibelula(deuda, ordenLibelula, estadoPago, usuario) {
     const nuevoPago = {
       concepto: deuda.concepto,
       descripcion: deuda.descripcion,
       monto: deuda.monto,
       metodo_pago: ordenLibelula.metodo === 'QR' ? 'Código QR' : 'Tarjeta',
       id_pagador: usuario.id_persona,
       id_beneficiario: 1, // o el ID del admin
       id_transaccion_externa: ordenLibelula.orden_id,
       estado: estadoPago.estado,
       datos_respuesta: JSON.stringify(estadoPago),
       fecha: new Date()
     }
     
     const { data, error } = await this.supabase
       .from('pago')
       .insert([nuevoPago])
       .select()
       .single()
     
     if (error) throw error
     return { success: true, data }
   }
   ```

2. **`vincularPagoADeuda(idDeuda, idPago)`**
   ```javascript
   async vincularPagoADeuda(idDeuda, idPago) {
     const { data, error } = await this.supabase
       .from('deuda')
       .update({ 
         estado: 'Pagado',
         id_pago: idPago,
         fecha_pago: new Date()
       })
       .eq('id_deuda', idDeuda)
     
     if (error) throw error
     return { success: true, data }
   }
   ```

3. **`obtenerPagoPorOrdenLibelula(ordenId)`**

4. **`generarDatosComprobante(idPago)`**

---

### 📊 **TAREA 3: Actualizar DeudaService.js**

**Archivo:** `src/services/DeudaService.js`

#### Métodos a agregar:

1. **`marcarComoPagada(idDeuda, idPago)`**

2. **`verificarEstadoDeuda(idDeuda)`**

3. **`obtenerDeudasConPagos(idPersona)`**

---

### 🗄️ **TAREA 4: Migraciones de Base de Datos**

**Archivo:** `sql/migrations/002_add_libelula_fields.sql`

Ejecutar en Supabase SQL Editor:

```sql
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
```

---

### 📄 **TAREA 5: ComprobanteService.js**

**Archivo nuevo:** `src/services/ComprobanteService.js`

```javascript
import jsPDF from 'jspdf'
import emailService from './EmailService'

class ComprobanteService {
  async generarPDFComprobante(pago) {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' })
    
    // Contenido
    doc.setFontSize(12)
    doc.text(`N° Transacción: ${pago.id_transaccion}`, 20, 40)
    doc.text(`Fecha: ${new Date(pago.fecha).toLocaleString('es-BO')}`, 20, 50)
    doc.text(`Concepto: ${pago.concepto}`, 20, 60)
    doc.text(`Monto: Bs ${pago.monto.toFixed(2)}`, 20, 70)
    doc.text(`Método: ${pago.metodo}`, 20, 80)
    doc.text(`Pagador: ${pago.pagador}`, 20, 90)
    doc.text(`CI: ${pago.ci}`, 20, 100)
    
    // Generar
    return doc.output('blob')
  }

  async enviarComprobantePorEmail(idPago, emailDestino) {
    // Obtener datos del pago
    const pago = await obtenerDatosPago(idPago)
    
    // Generar PDF
    const pdfBlob = await this.generarPDFComprobante(pago)
    
    // Enviar email
    await emailService.enviarComprobante(emailDestino, pdfBlob, pago)
    
    return { success: true }
  }
}

export default new ComprobanteService()
```

---

### 🔗 **TAREA 6: Integrar en PagosSeccion.jsx**

**Archivo:** `src/components/ResidenteSecciones/PagosSeccion.jsx`

En la función `handlePagoExitoso` (línea ~84), reemplazar el comentario TODO:

```javascript
const handlePagoExitoso = async (resultado) => {
  console.log('[PagosSeccion] Pago exitoso:', resultado);
  
  try {
    // 1. Registrar pago en BD
    const registroPago = await PagoService.registrarPagoLibelula(
      deudaSeleccionada,
      { orden_id: resultado.ordenId, metodo: resultado.metodo },
      { estado: resultado.estado, transaccion_id: resultado.transaccionId },
      profile || user
    );
    
    if (!registroPago.success) {
      throw new Error('Error al registrar pago');
    }
    
    // 2. Vincular pago a deuda
    await PagoService.vincularPagoADeuda(
      deudaSeleccionada.id_deuda,
      registroPago.data.id_pago
    );
    
    // 3. Marcar deuda como pagada
    await DeudaService.marcarComoPagada(
      deudaSeleccionada.id_deuda,
      registroPago.data.id_pago
    );
    
    toast.success('¡Pago realizado con éxito!');
    setShowPasarela(false);
    
    // Resto del código...
  } catch (error) {
    console.error('Error registrando pago:', error);
    toast.error('Pago procesado pero hubo error al registrar');
  }
}
```

---

### 🔐 **TAREA 7: Seguridad**

- ✅ Verificar que AppKey NO esté en el código (solo en .env)
- ✅ Validar montos en backend antes de enviar a Libélula
- ✅ No exponer datos sensibles en console.log
- ✅ Sanitizar inputs de usuario

---

### 🧪 **TAREA 8: Testing**

Probar con datos de prueba:
- **AppKey:** `11bb10ce-68ba-4af1-8eb7-4e6624fed729`
- **Tarjetas de prueba:** Ver manual PDF de Libélula
- **QR:** Usar sandbox de Libélula

---

## 📞 **DUDAS O PROBLEMAS**

Si algo no funciona:
1. Revisar console.log en navegador
2. Verificar llamadas a API en Network tab
3. Revisar manual de Libélula (PDF)
4. Todos los TODOs están marcados en el código

---

## ✅ **CHECKLIST DE IMPLEMENTACIÓN**

- [ ] LibelulaService.iniciarPago() con API real
- [ ] LibelulaService.verificarEstadoPago() con API real
- [ ] LibelulaService.procesarPagoTarjeta() con API real
- [ ] PagoService.registrarPagoLibelula()
- [ ] PagoService.vincularPagoADeuda()
- [ ] DeudaService.marcarComoPagada()
- [ ] Migraciones SQL ejecutadas en Supabase
- [ ] ComprobanteService.generarPDFComprobante()
- [ ] ComprobanteService.enviarComprobantePorEmail()
- [ ] Integración en PagosSeccion.handlePagoExitoso()
- [ ] Testing completo del flujo

---

**¡Éxito con la implementación!** 🚀
