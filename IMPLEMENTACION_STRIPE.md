# 📝 Implementación de Stripe para Pagos con Tarjeta

## 🎯 Objetivo
Reemplazar el sistema MOCK de pagos con tarjeta por la integración real de **Stripe** para procesar pagos con tarjetas de crédito/débito.

---

## 📋 Estado Actual

### ✅ Lo que YA está hecho:
1. **Interfaz de usuario completa** en `PasarelaPagos.jsx`:
   - Formulario de tarjeta con diseño 3D
   - Validaciones de campos
   - Estados de carga y error
   - Animaciones y feedback visual

2. **Datos del usuario desde Supabase**:
   - Los datos se cargan automáticamente desde la tabla `persona`
   - Formulario de solo lectura (campos deshabilitados)
   - Validación de datos completos

3. **Flujo de pago QR** (SIMULACRO):
   - Implementado con LibelulaService (MOCK)
   - Solo para demostración visual
   - No procesa pagos reales

### 🔧 Lo que FALTA implementar:
- Integración con **Stripe** para pagos con tarjeta

---

## 🚀 Pasos para Implementar Stripe

### 1. Instalar Dependencias

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configurar Variables de Entorno

Agregar en `.env`:
```env
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Tu clave pública de Stripe
```

Agregar en `.env.example`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. Crear el Servicio de Stripe

Crear `src/services/StripeService.js`:

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

class StripeService {
  async createPaymentIntent(monto, concepto, pagadorEmail) {
    try {
      // Llamar a tu backend para crear el PaymentIntent
      const response = await fetch('TU_BACKEND_URL/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(monto * 100), // Stripe usa centavos
          currency: 'bob', // Bolivianos (verifica si Stripe soporta BOB)
          description: concepto,
          receipt_email: pagadorEmail,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el intent de pago');
      }

      return {
        success: true,
        data: {
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
        },
      };
    } catch (error) {
      console.error('Error en createPaymentIntent:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async confirmarPago(clientSecret, cardElement) {
    try {
      const stripe = await stripePromise;
      
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        data: {
          paymentIntent: result.paymentIntent,
          transaccionId: result.paymentIntent.id,
          estado: result.paymentIntent.status,
        },
      };
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getStripe() {
    return await stripePromise;
  }
}

export default new StripeService();
```

### 4. Crear Endpoint en el Backend

Necesitas crear un endpoint en tu backend (Node.js/Express ejemplo):

```javascript
// backend/routes/payments.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, description, receipt_email } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd', // Cambiar a 'bob' si está soportado
      description,
      receipt_email,
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 5. Modificar PasarelaPagos.jsx

#### 5.1. Importar Stripe

```javascript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeService from '../../services/StripeService';
```

#### 5.2. Reemplazar el formulario de tarjeta

En lugar del formulario manual de tarjeta, usar **CardElement** de Stripe:

```jsx
// En el PASO 3 cuando metodoPago === 'TARJETA'
<Elements stripe={stripePromise}>
  <FormularioTarjetaStripe 
    deuda={deuda}
    formData={formData}
    onSuccess={(resultado) => {
      setResultado(resultado);
      setPaso(4);
      toast.success('¡Pago exitoso!');
    }}
    onError={(error) => {
      setError(error);
      toast.error(error);
    }}
  />
</Elements>
```

#### 5.3. Crear Componente FormularioTarjetaStripe

```jsx
function FormularioTarjetaStripe({ deuda, formData, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // 1. Crear PaymentIntent en el backend
      const intentResult = await StripeService.createPaymentIntent(
        deuda.monto,
        deuda.concepto,
        formData.email
      );

      if (!intentResult.success) {
        throw new Error(intentResult.error);
      }

      const { clientSecret } = intentResult.data;

      // 2. Confirmar el pago con Stripe
      const cardElement = elements.getElement(CardElement);
      
      const confirmResult = await StripeService.confirmarPago(
        clientSecret,
        cardElement
      );

      if (!confirmResult.success) {
        throw new Error(confirmResult.error);
      }

      // 3. Pago exitoso
      onSuccess({
        transaccionId: confirmResult.data.transaccionId,
        concepto: deuda.concepto,
        monto: deuda.monto,
        metodo: 'TARJETA',
        fecha: new Date().toISOString(),
      });

    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : `Pagar Bs ${deuda.monto.toFixed(2)}`}
      </button>
    </form>
  );
}
```

### 6. Modificar handleSeleccionarMetodo

```javascript
const handleSeleccionarMetodo = async (metodo) => {
  setMetodoPago(metodo);
  setLoading(true);
  setError(null);

  try {
    if (metodo === 'QR') {
      // QR SIMULACRO
      const resultado = await LibelulaService.iniciarPago(deuda, formData, metodo);
      if (resultado.success) {
        setQrData(resultado.data.qr_data);
        setOrdenId(resultado.data.orden_id);
        setPaso(3);
        iniciarPollingQR(resultado.data.orden_id);
      }
    } else {
      // TARJETA - Stripe
      // No necesitas iniciarPago aquí, se maneja en FormularioTarjetaStripe
      setPaso(3);
    }
  } catch (err) {
    console.error('Error al iniciar pago:', err);
    setError('Error de conexión. Por favor intenta nuevamente.');
    toast.error('Error de conexión');
  } finally {
    setLoading(false);
  }
};
```

### 7. Guardar el Pago en Supabase

Después de que Stripe confirme el pago, guardar en la base de datos:

```javascript
// En el onSuccess del FormularioTarjetaStripe
async function guardarPagoEnSupabase(resultado) {
  const { data, error } = await supabase
    .from('pago')
    .insert({
      id_pago: resultado.transaccionId,
      id_persona: formData.id_persona,
      fecha_pago: new Date().toISOString(),
      monto: deuda.monto,
      metodo_pago: 'Tarjeta Stripe',
      estado: 'Completado',
      concepto: deuda.concepto,
      stripe_payment_intent_id: resultado.transaccionId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error al guardar pago:', error);
    throw error;
  }

  return data;
}
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE:
1. **NUNCA** envíes la `STRIPE_SECRET_KEY` al frontend
2. **SIEMPRE** crea el PaymentIntent en el backend
3. **NUNCA** manejes datos de tarjeta directamente (usa CardElement)
4. **VALIDA** los pagos en el backend usando webhooks de Stripe

### Configurar Webhooks

1. En tu dashboard de Stripe, configura un webhook endpoint:
   ```
   https://tu-backend.com/api/webhooks/stripe
   ```

2. Suscríbete a estos eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

3. Crea el endpoint:
```javascript
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Pago exitoso:', paymentIntent.id);
      // Actualizar estado en tu base de datos
      break;
    case 'payment_intent.payment_failed':
      console.log('Pago fallido:', event.data.object.id);
      break;
  }

  res.json({ received: true });
});
```

---

## 🧪 Testing

### Tarjetas de prueba de Stripe:
- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Declinada**: `4000 0000 0000 9995`

Fecha: Cualquier fecha futura  
CVV: Cualquier 3 dígitos  
ZIP: Cualquier 5 dígitos

---

## 📚 Recursos

- [Documentación oficial de Stripe](https://stripe.com/docs)
- [Stripe React Elements](https://stripe.com/docs/stripe-js/react)
- [Accept a payment tutorial](https://stripe.com/docs/payments/accept-a-payment)
- [Testing](https://stripe.com/docs/testing)

---

## ✅ Checklist de Implementación

- [ ] Crear cuenta en Stripe
- [ ] Instalar dependencias npm
- [ ] Configurar variables de entorno
- [ ] Crear StripeService.js
- [ ] Crear endpoint backend para PaymentIntent
- [ ] Modificar PasarelaPagos.jsx
- [ ] Crear FormularioTarjetaStripe
- [ ] Configurar webhooks
- [ ] Guardar pagos en Supabase
- [ ] Probar con tarjetas de prueba
- [ ] Manejar errores y casos extremos
- [ ] Implementar 3D Secure
- [ ] Validar en producción

---

## 💡 Notas Finales

- El código QR seguirá siendo **SIMULACRO** (LibelulaService con MOCK)
- **Solo los pagos con tarjeta** usarán Stripe
- Los datos del usuario vienen automáticamente de Supabase (solo lectura)
- El formulario actual de tarjeta debe ser reemplazado por `<CardElement />`
- Stripe maneja la seguridad PCI compliance automáticamente

¡Buena suerte con la implementación! 🚀
