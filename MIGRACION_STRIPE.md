# 🚀 MIGRACIÓN COMPLETADA: STRIPE PAYMENT GATEWAY

## ✅ Archivos Migrados

### Frontend
- ✅ `src/services/StripeService.js` - Servicio para comunicación con API Stripe
- ✅ `src/components/shared/CheckoutStripe.jsx` - Modal de checkout integrado
- ✅ `src/components/ResidenteSecciones/ReservasSeccion_v2.jsx` - Actualizado para usar Stripe

### Backend
- ✅ `stripe-server/server.js` - Servidor Express con endpoints Stripe
- ✅ `stripe-server/package.json` - Dependencias del servidor
- ✅ `stripe-server/.env` - Variables de entorno (configura tus claves)
- ✅ `stripe-server/iniciar-servidor.bat` - Script para iniciar servidor

### Configuración
- ✅ `.env` actualizado con variables VITE_STRIPE_*
- ✅ `@stripe/stripe-js` instalado en el frontend
- ✅ Dependencias instaladas en stripe-server

---

## ⚙️ CONFIGURACIÓN REQUERIDA

### 1. Obtener Claves de Stripe

1. Ve a https://dashboard.stripe.com/register
2. Crea una cuenta (o inicia sesión)
3. En el dashboard, ve a **Developers > API Keys**
4. Copia las claves:
   - **Publishable key** (comienza con `pk_test_...`)
   - **Secret key** (comienza con `sk_test_...`)

### 2. Configurar Frontend (.env principal)

Edita `C:\Users\Desktop\Documents\proyectos\TecnicoSuperior\.env`:

```env
# Stripe (agrega estas líneas al final)
VITE_STRIPE_SERVER_URL=http://localhost:4242
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI  # <-- REEMPLAZAR
```

### 3. Configurar Backend (stripe-server/.env)

Edita `C:\Users\Desktop\Documents\proyectos\TecnicoSuperior\stripe-server\.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI  # <-- REEMPLAZAR
STRIPE_CURRENCY=usd
PORT=4242

# CORS (permitir origen del frontend)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

---

## 🚀 INICIAR SERVIDORES

### Opción 1: Con Scripts .bat

#### Terminal 1 - Aplicación Frontend
```cmd
cd C:\Users\Desktop\Documents\proyectos\TecnicoSuperior
npm run dev
```
- App: http://localhost:5174

#### Terminal 2 - Servidor Stripe
```cmd
cd C:\Users\Desktop\Documents\proyectos\TecnicoSuperior\stripe-server
iniciar-servidor.bat
```
- API: http://localhost:4242

### Opción 2: Comandos Manuales

```powershell
# Terminal 1 - Frontend
cd C:\Users\Desktop\Documents\proyectos\TecnicoSuperior
npm run dev

# Terminal 2 - Stripe Server (otra terminal)
cd C:\Users\Desktop\Documents\proyectos\TecnicoSuperior\stripe-server
node server.js
```

---

## 🗄️ BASE DE DATOS

### IMPORTANTE: Ejecutar en Supabase SQL Editor

```sql
-- Permitir reservas sin id_horario (sistema nuevo usa hora_inicio/hora_fin)
ALTER TABLE reserva ALTER COLUMN id_horario DROP NOT NULL;
```

**URL Supabase:** https://wjngomnzgfaiddtytxah.supabase.co

---

## 🔄 FLUJO DE PAGO CON STRIPE

### 1. Usuario crea reserva
- Selecciona área, fecha, horario
- Calcula costo automáticamente
- Click en "Crear Reserva con Pago"

### 2. Modal Checkout Stripe
- Muestra resumen de pago
- Botón "Proceder al Pago"
- Se crea sesión en backend

### 3. Redirección a Stripe Checkout
- Usuario ingresa datos de tarjeta
- Stripe procesa el pago (seguro)
- Stripe redirige de vuelta con `session_id`

### 4. Confirmación y Creación
- Frontend detecta `?session_id=` en URL
- Verifica estado del pago en backend
- Si exitoso: crea reserva en Supabase
- Muestra comprobante de pago

---

## 🧪 PRUEBAS

### Tarjetas de Prueba Stripe

Usa estas tarjetas en modo TEST:

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0000 0000 0002` | ❌ Tarjeta rechazada |
| `4000 0025 0000 3155` | 🔐 Requiere autenticación 3D |

- **CVV:** Cualquier 3 dígitos (ej: 123)
- **Fecha:** Cualquier fecha futura (ej: 12/25)
- **ZIP:** Cualquier código (ej: 12345)

### Verificar Pagos

1. Ve a https://dashboard.stripe.com/test/payments
2. Verás todos los pagos de prueba
3. Puedes ver detalles, metadata, webhooks

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Claves de Stripe configuradas en `.env`
- [ ] Claves de Stripe configuradas en `stripe-server/.env`
- [ ] Servidor frontend corriendo en puerto 5174
- [ ] Servidor Stripe corriendo en puerto 4242
- [ ] SQL ejecutado en Supabase (id_horario nullable)
- [ ] Login como residente funciona
- [ ] Crear reserva abre modal Stripe
- [ ] Redirección a Stripe funciona
- [ ] Pago con tarjeta de prueba exitoso
- [ ] Reserva se crea en base de datos
- [ ] Comprobante de pago se muestra

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Stripe no se pudo cargar"
**Causa:** VITE_STRIPE_PUBLISHABLE_KEY no configurado o incorrecto
**Solución:** 
1. Verifica que la clave comience con `pk_test_`
2. Reinicia el servidor frontend (`npm run dev`)

### Error: "Stripe no está configurado en el servidor"
**Causa:** STRIPE_SECRET_KEY no configurado en stripe-server/.env
**Solución:**
1. Edita `stripe-server/.env`
2. Agrega tu secret key (comienza con `sk_test_`)
3. Reinicia el servidor Stripe

### Error: CORS
**Causa:** Puerto del frontend no permitido en CORS
**Solución:**
```env
# En stripe-server/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### Error: "session_id is required"
**Causa:** URL de callback mal configurada
**Solución:** Verifica que `successUrl` y `cancelUrl` en CheckoutStripe.jsx apunten a rutas correctas

### Reserva no se crea después de pago
**Causa:** id_horario NOT NULL constraint
**Solución:** Ejecuta SQL en Supabase:
```sql
ALTER TABLE reserva ALTER COLUMN id_horario DROP NOT NULL;
```

---

## 📚 RECURSOS

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Checkout Guide:** https://stripe.com/docs/payments/checkout
- **Test Cards:** https://stripe.com/docs/testing

---

## 🎯 DIFERENCIAS VS LIBÉLULA

| Aspecto | Libélula (Anterior) | Stripe (Actual) |
|---------|---------------------|-----------------|
| **Setup** | Servidor email-server | Servidor stripe-server dedicado |
| **Puerto** | 3001 | 4242 |
| **Flujo** | Modal interno complejo | Redirección a Stripe Checkout |
| **Seguridad** | PCI compliance manual | PCI compliance automático |
| **Tarjetas** | Limitado a Bolivia | Internacional |
| **Webhook** | Manual | Nativo Stripe |
| **UI** | Custom con reCAPTCHA | Stripe hosted |
| **Testing** | Mock manual | Test mode nativo |
| **Logs** | Console básico | Dashboard completo |

---

## ✨ VENTAJAS DE STRIPE

1. **Seguridad PCI Nivel 1** - No manejas datos sensibles
2. **UI Profesional** - Checkout hospedado por Stripe
3. **Testing Robusto** - Tarjetas de prueba y webhooks
4. **Dashboard Completo** - Ver todos los pagos, reembolsos, analytics
5. **Internacional** - Soporta 135+ monedas
6. **Webhooks** - Notificaciones automáticas de eventos
7. **Sin Loops** - No hay re-renders infinitos
8. **Documentación** - Docs de clase mundial

---

## 🔜 PRÓXIMOS PASOS

1. ✅ **Configurar claves de Stripe** (seguir guía arriba)
2. ✅ **Iniciar ambos servidores** (frontend + stripe-server)
3. ✅ **Ejecutar SQL en Supabase** (quitar NOT NULL)
4. 🔄 **Probar flujo completo** (crear reserva → pago → confirmación)
5. 📊 **Ver pagos en dashboard Stripe**
6. 🎨 **Personalizar email de confirmación** (opcional)
7. 🔔 **Implementar webhooks** para pagos asíncronos (opcional)

---

**¡La migración está completa! Solo falta configurar las claves de Stripe y probar.** 🎉
