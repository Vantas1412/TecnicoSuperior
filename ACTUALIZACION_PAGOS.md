# Actualización del Sistema de Pagos

## Resumen
Se ha actualizado el sistema de pagos para residentes eliminando la dependencia de Libelula y manteniendo solo dos métodos de pago:
1. **Código QR** - Simulación para demostración
2. **Tarjeta** - Integración con Stripe

---

## Cambios Realizados

### 1. PasarelaPagos.jsx
**Ubicación:** `src/components/shared/PasarelaPagos.jsx`

#### Cambios principales:
- ✅ **Eliminado:** Dependencia de `LibelulaService`
- ✅ **Agregado:** Importación de `StripeService` y librería `qrcode`
- ✅ **QR Simulado:** 
  - Genera un código QR usando la librería `qrcode`
  - Aprueba automáticamente después de 10 segundos
  - No requiere backend
- ✅ **Tarjeta con Stripe:**
  - Eliminado formulario manual de tarjeta
  - Redirige directamente a Stripe Checkout
  - Interfaz simplificada y clara
  - Muestra métodos de pago aceptados (Visa, Mastercard, Amex)

#### Flujo del método QR:
```javascript
1. Usuario selecciona "Código QR"
2. Se genera un QR code con datos de la transacción
3. Muestra instrucciones visuales
4. Después de 10 segundos, se simula aprobación automática
5. Muestra pantalla de éxito
```

#### Flujo del método Tarjeta:
```javascript
1. Usuario selecciona "Tarjeta"
2. Se muestra resumen y botón "Pagar con Stripe"
3. Click en el botón crea sesión de Stripe
4. Redirige a Stripe Checkout
5. Usuario completa pago en Stripe
6. Stripe redirige de vuelta con session_id
7. El sistema detecta el éxito y actualiza
```

---

### 2. PagosSeccion.jsx
**Ubicación:** `src/components/ResidenteSecciones/PagosSeccion.jsx`

#### Cambios principales:
- ✅ **Agregado:** Hook `useEffect` para detectar retorno desde Stripe
- ✅ **Detección de parámetros URL:**
  - `?payment=success&deuda=XXX` → Muestra mensaje de éxito
  - `?payment=cancelled` → Muestra mensaje de cancelación
- ✅ **Limpieza automática de URL** después de procesar parámetros

---

### 3. Servidor de Stripe
**Ubicación:** `stripe-server/server.js`

#### Cambios principales:
- ✅ **Soporte dual:** Ahora maneja tanto pagos de deudas como reservas de áreas
- ✅ **Detección automática del tipo de pago**
  - Si tiene `idDeuda` → Pago de deuda
  - Si tiene `areaId` → Reserva de área
- ✅ **Metadata mejorada:**
  ```javascript
  // Para deudas:
  {
    tipo: 'deuda',
    id_persona: '123',
    id_deuda: '456',
    concepto: 'Multa',
    ...
  }
  
  // Para reservas:
  {
    tipo: 'reserva',
    id_persona: '123',
    id_area: '789',
    fecha: '2024-10-23',
    horarios: [...],
    ...
  }
  ```

---

### 4. Dependencias
**Agregado al proyecto:**
```bash
npm install qrcode
```

**Librería:** `qrcode` - Para generar códigos QR simulados en el cliente

---

## Funcionamiento Actual

### Método QR (Simulación)
1. **No requiere backend** - Todo es clientside
2. **Genera QR visual** con datos de la transacción
3. **Timer de 5 minutos** (300 segundos)
4. **Aprobación automática** después de 10 segundos
5. **Ideal para demostraciones** sin infraestructura de pago real

### Método Tarjeta (Stripe)
1. **Redirige a Stripe Checkout** - Formulario seguro de Stripe
2. **Acepta todas las tarjetas principales** (Visa, MC, Amex)
3. **Maneja 3D Secure automáticamente**
4. **Retorna al sistema** después del pago
5. **100% seguro** - Stripe maneja toda la información sensible

---

## URLs de Retorno

### Para Deudas:
- **Éxito:** `http://localhost:5173/residente/pagos?payment=success&deuda={id_deuda}&session_id={CHECKOUT_SESSION_ID}`
- **Cancelado:** `http://localhost:5173/residente/pagos?payment=cancelled`

### Para Reservas:
- **Éxito:** `http://localhost:5173/residente/reservas?payment=success&session_id={CHECKOUT_SESSION_ID}`
- **Cancelado:** `http://localhost:5173/residente/reservas?payment=cancelled`

---

## Configuración Requerida

### Variables de Entorno (.env)
```env
# Frontend
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SERVER_URL=http://localhost:4242

# Stripe Server (stripe-server/.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
ALLOWED_ORIGINS=http://localhost:5173
PORT=4242
```

---

## Testing

### Tarjetas de Prueba de Stripe (modo test)
- **Éxito:** `4242 4242 4242 4242`
- **Requiere autenticación:** `4000 0025 0000 3155`
- **Rechazo:** `4000 0000 0000 9995`
- **CVV:** Cualquier 3 dígitos
- **Fecha:** Cualquier fecha futura
- **Nombre:** Cualquier nombre

### Flujo de Prueba QR
1. Ir a Pagos → Deuda pendiente → Pagar
2. Seleccionar "Código QR"
3. Esperar 10 segundos
4. Verificar aprobación automática

### Flujo de Prueba Stripe
1. Ir a Pagos → Deuda pendiente → Pagar
2. Seleccionar "Tarjeta"
3. Click en "Pagar con Stripe"
4. Usar tarjeta de prueba: `4242 4242 4242 4242`
5. Completar checkout
6. Verificar redirección y mensaje de éxito

---

## Archivos Modificados

```
src/
  components/
    shared/
      PasarelaPagos.jsx          [MODIFICADO]
    ResidenteSecciones/
      PagosSeccion.jsx           [MODIFICADO]
  services/
    StripeService.js             [SIN CAMBIOS - ya existía]

stripe-server/
  server.js                      [MODIFICADO]

package.json                     [MODIFICADO - agregado qrcode]
```

---

## Próximos Pasos

1. ✅ **Completado:** Integración básica de QR y Stripe
2. ⏳ **Pendiente:** Webhook de Stripe para confirmar pagos automáticamente
3. ⏳ **Pendiente:** Registro automático en BD cuando Stripe confirme
4. ⏳ **Pendiente:** Testing exhaustivo en ambiente de pruebas
5. ⏳ **Pendiente:** Configuración de Stripe en producción

---

## Notas Importantes

- 🔴 **QR es solo simulación** - No procesa pagos reales
- 🟢 **Stripe es producción-ready** - Requiere configuración correcta
- 🔵 **Modo test activo** - Usar tarjetas de prueba de Stripe
- 🟡 **URLs hardcoded** - Actualizar para producción

---

## Soporte

Para dudas o problemas:
1. Verificar configuración de variables de entorno
2. Revisar logs del servidor Stripe (`stripe-server`)
3. Verificar que el servidor de Stripe esté corriendo en puerto 4242
4. Consultar documentación de Stripe: https://stripe.com/docs

---

**Última actualización:** 23 de octubre, 2025
**Versión:** 1.0.0
