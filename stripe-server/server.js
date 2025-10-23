/* eslint-env node */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[Stripe] STRIPE_SECRET_KEY no está configurado. El servidor no podrá crear sesiones de pago.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
}) : null;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe no está configurado en el servidor.' });
    }

    console.log('📥 Datos recibidos en servidor:', req.body);

    const {
      amount,
      areaName,
      areaId,
      horarios,
      horarioLabels,
      fecha,
      idPersona,
      concepto,
      descripcion,
      idDeuda,
      metadata,
      successUrl,
      cancelUrl,
    } = req.body;

    // Determinar si es pago de deuda o reserva de área
    const esDeuda = !!idDeuda;

    console.log('🔍 Tipo de pago:', esDeuda ? 'DEUDA' : 'RESERVA');

    if (!amount || !idPersona) {
      return res.status(400).json({ success: false, error: 'amount e idPersona son obligatorios.' });
    }

    const currency = process.env.STRIPE_CURRENCY || 'usd';
    let sessionMetadata = {};
    let productName = '';
    let productDescription = '';

    if (esDeuda) {
      // Pago de deuda
      console.log('  Concepto:', concepto);
      console.log('  Descripción:', descripcion);
      console.log('  ID Deuda:', idDeuda);

      if (!concepto || !idDeuda) {
        return res.status(400).json({ success: false, error: 'Faltan datos obligatorios para pago de deuda (concepto, idDeuda).' });
      }

      productName = concepto;
      productDescription = descripcion || `Pago de ${concepto}`;
      
      sessionMetadata = {
        tipo: 'deuda',
        id_persona: String(idPersona),
        id_deuda: String(idDeuda),
        concepto: concepto,
        ...metadata
      };
    } else {
      // Reserva de área común
      console.log('  Area:', areaName);
      console.log('  Fecha:', fecha);
      console.log('  Horarios:', horarios);

      if (!areaName || !areaId || !horarios?.length || !fecha) {
        return res.status(400).json({ success: false, error: 'Faltan datos obligatorios para reserva (areaName, areaId, horarios, fecha).' });
      }

      productName = `Reserva de ${areaName}`;
      productDescription = `Reserva para ${horarios.length} horario(s) el ${fecha}`;
      
      sessionMetadata = {
        tipo: 'reserva',
        id_persona: String(idPersona),
        id_area: String(areaId),
        fecha: String(fecha),
        horarios: JSON.stringify(horarios),
        horario_labels: JSON.stringify(horarioLabels),
        area_nombre: areaName,
        concepto: `Reserva de ${areaName}`,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(amount) * 100),
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
          quantity: 1,
        },
      ],
      metadata: sessionMetadata,
      success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    console.log('✅ Sesión creada exitosamente:', session.id);
    console.log('🔗 URL de checkout:', session.url);

    res.json({ success: true, data: { sessionId: session.id, url: session.url } });
  } catch (error) {
    console.error('[Stripe] Error al crear la sesión de checkout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, error: 'Stripe no está configurado en el servidor.' });
    }

    const { session_id: sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'session_id es obligatorio.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('[Stripe] Error al obtener la sesión de checkout:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor de Stripe escuchando en http://localhost:${port}`);
});
