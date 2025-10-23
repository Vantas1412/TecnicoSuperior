import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { Resend } from 'resend';

// Cargar variables de entorno
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar Resend (opcional)
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY no configurado. Las rutas de email no funcionarán.');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Agregar tus dominios
  credentials: true
}));
app.use(express.json());

// Log de inicio
console.log('🚀 Servidor de correos iniciando...');
console.log('📧 Email FROM:', process.env.EMAIL_FROM);

// ==============================
// Configuración Libélula
// ==============================
const LIBELULA_API_URL = process.env.LIBELULA_API_URL || 'https://sandbox.libelula.bo/api/v1';
const LIBELULA_APP_KEY = process.env.LIBELULA_APP_KEY || '';
const LIBELULA_SANDBOX = (process.env.LIBELULA_SANDBOX || 'true') === 'true';
const LIBELULA_MOCK = (process.env.LIBELULA_MOCK || 'false') === 'true';

if (!LIBELULA_APP_KEY) {
  console.warn('⚠️  LIBELULA_APP_KEY no está configurado. Configura este valor en tu .env para habilitar pagos.');
}

// Helper para headers Libélula
const libelulaHeaders = () => ({
  'Content-Type': 'application/json',
  'X-App-Key': LIBELULA_APP_KEY
});

// ==============================
// Fallback MOCK en memoria (dev)
// ==============================
const MOCK_STORE = {
  orders: new Map() // orden_id -> { createdAt, monto, metodo, concepto }
};

function makeMockOrder(deuda, metodo) {
  const id = `MOCK-${Date.now()}`;
  const entry = { createdAt: Date.now(), monto: deuda.monto, metodo, concepto: deuda.concepto };
  MOCK_STORE.orders.set(id, entry);
  return {
    orden_id: id,
    // Para dev, usamos un generador de QR público sólo como placeholder visual
    qr_data: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('MOCK-' + id)}`,
    url_checkout: 'about:blank',
    estado: 'PENDING',
    monto: deuda.monto,
    concepto: deuda.concepto
  };
}

function mockStatus(ordenId) {
  const entry = MOCK_STORE.orders.get(ordenId);
  if (!entry) {
    return { estado: 'NOT_FOUND', transaccion_id: ordenId };
  }
  const elapsed = Date.now() - entry.createdAt;
  const approved = elapsed > 15000; // aprueba en ~15s
  return {
    estado: approved ? 'APPROVED' : 'PENDING',
    transaccion_id: ordenId,
    fecha: new Date().toISOString(),
    monto: entry.monto,
    metodo: entry.metodo
  };
}

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    services: {
      email: !!resend,
      libelula: !!LIBELULA_APP_KEY
    },
    libelula: {
      apiUrl: LIBELULA_API_URL,
      appKeyLoaded: !!LIBELULA_APP_KEY,
      sandbox: LIBELULA_SANDBOX,
      mockEnabled: LIBELULA_MOCK
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta principal para enviar correos
app.post('/api/send-email', async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({ error: 'Servidor de email no configurado (RESEND_API_KEY faltante)' });
    }
    const { destinatarios, asunto, contenido, tipo } = req.body;

    // Validación
    if (!destinatarios || !asunto || !contenido) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: destinatarios, asunto, contenido' 
      });
    }

    // Normalizar destinatarios a array
    const emails = Array.isArray(destinatarios) ? destinatarios : [destinatarios];

    console.log(`📨 Enviando correo a: ${emails.join(', ')}`);
    console.log(`📋 Asunto: ${asunto}`);

    // Enviar correo con Resend
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: emails,
      subject: asunto,
      html: contenido,
    });

    if (error) {
      console.error('❌ Error al enviar correo:', error);
      return res.status(400).json({ 
        error: 'Error al enviar correo', 
        details: error 
      });
    }

    console.log('✅ Correo enviado exitosamente:', data.id);

    res.json({ 
      success: true, 
      message: 'Correo enviado exitosamente',
      emailId: data.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// ==============================
// Rutas Libélula (proxy backend)
// ==============================

// Crear nueva orden de pago
app.post('/api/libelula/payment/new', async (req, res) => {
  try {
    const { deuda, pagador, metodoPago, url_callback } = req.body || {};

    if (!LIBELULA_APP_KEY) {
      return res.status(500).json({ error: 'LIBELULA_APP_KEY no configurado en el servidor' });
    }

    if (!deuda?.monto || !deuda?.concepto || !pagador?.email || !metodoPago) {
      return res.status(400).json({ error: 'Faltan campos requeridos: deuda, pagador, metodoPago' });
    }

    // Validación básica de monto
    const monto = Number(deuda.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const payload = {
      appkey: LIBELULA_APP_KEY,
      concepto: String(deuda.concepto).slice(0, 100),
      monto: monto,
      moneda: deuda.moneda || 'BOB',
      descripcion: deuda.descripcion || '',
      email: pagador.email,
      telefono: pagador.telefono || '',
      nombre: pagador.nombre || `${pagador.nombres || ''} ${pagador.apellidos || ''}`.trim(),
      ci: pagador.ci || pagador.documento || '',
      metodo: metodoPago, // "QR" | "CARD"
      url_callback: url_callback || `${req.headers.origin || ''}/pagos/callback`
    };

    const url = `${LIBELULA_API_URL}/payment/new`;
    try {
      const { data } = await axios.post(url, payload, { headers: libelulaHeaders() });
      return res.json({ success: true, data });
    } catch (err) {
      // Fallback mock si el host no resuelve o está desconectado
      const code = err?.code || err?.response?.status;
      const isDns = code === 'ENOTFOUND' || code === 'EAI_AGAIN';
      if ((LIBELULA_MOCK || isDns) && LIBELULA_APP_KEY) {
        console.warn('⚠️  Usando MOCK de Libélula (sin conexión o sandbox no resuelve)');
        const data = makeMockOrder(deuda, metodoPago);
        return res.json({ success: true, data, mock: true });
      }
      throw err;
    }
  } catch (error) {
    console.error('❌ Error creando pago Libélula:', error.response?.data || error.message);
    return res.status(400).json({ success: false, error: error.response?.data || error.message });
  }
});

// Verificar estado de pago
app.get('/api/libelula/payment/status/:ordenId', async (req, res) => {
  try {
    const { ordenId } = req.params;
    if (!ordenId) return res.status(400).json({ error: 'ordenId requerido' });

    const url = `${LIBELULA_API_URL}/payment/status/${encodeURIComponent(ordenId)}`;
    try {
      const { data } = await axios.get(url, { headers: libelulaHeaders() });
      return res.json({ success: true, data });
    } catch (err) {
      const code = err?.code || err?.response?.status;
      const isDns = code === 'ENOTFOUND' || code === 'EAI_AGAIN';
      if (LIBELULA_MOCK || isDns) {
        const data = mockStatus(ordenId);
        return res.json({ success: true, data, mock: true });
      }
      throw err;
    }
  } catch (error) {
    console.error('❌ Error verificando estado Libélula:', error.response?.data || error.message);
    return res.status(400).json({ success: false, error: error.response?.data || error.message });
  }
});

// Procesar pago con tarjeta
app.post('/api/libelula/payment/process-card', async (req, res) => {
  try {
    const { orden_id, numero_tarjeta, mes_vencimiento, anio_vencimiento, cvv, nombre_titular } = req.body || {};
    if (!orden_id || !numero_tarjeta || !mes_vencimiento || !anio_vencimiento || !cvv) {
      return res.status(400).json({ error: 'Campos requeridos: orden_id, numero_tarjeta, mes_vencimiento, anio_vencimiento, cvv' });
    }

    const url = `${LIBELULA_API_URL}/payment/process`;
    const payload = { orden_id, numero_tarjeta, mes_vencimiento, anio_vencimiento, cvv, nombre_titular };
    try {
      const { data } = await axios.post(url, payload, { headers: libelulaHeaders() });
      return res.json({ success: true, data });
    } catch (err) {
      const code = err?.code || err?.response?.status;
      const isDns = code === 'ENOTFOUND' || code === 'EAI_AGAIN';
      if (LIBELULA_MOCK || isDns) {
        // Mock simple: aprueba si último dígito es par
        const last = parseInt(String(numero_tarjeta).slice(-1), 10);
        const approved = !isNaN(last) && last % 2 === 0;
        const data = approved
          ? { estado: 'APPROVED', transaccion_id: orden_id, mensaje: 'Pago aprobado (MOCK)', fecha: new Date().toISOString(), metodo: 'TARJETA', ultimos_digitos: String(numero_tarjeta).slice(-4) }
          : { estado: 'REJECTED', transaccion_id: orden_id, mensaje: 'Tarjeta rechazada (MOCK)', fecha: new Date().toISOString(), metodo: 'TARJETA' };
        return res.json({ success: approved, data: approved ? data : undefined, error: approved ? undefined : data.mensaje, mock: true });
      }
      throw err;
    }
  } catch (error) {
    console.error('❌ Error procesando tarjeta Libélula:', error.response?.data || error.message);
    return res.status(400).json({ success: false, error: error.response?.data || error.message });
  }
});

// Obtener QR (si aplica)
app.get('/api/libelula/payment/qr/:ordenId', async (req, res) => {
  try {
    const { ordenId } = req.params;
    const url = `${LIBELULA_API_URL}/payment/qr/${encodeURIComponent(ordenId)}`;
    try {
      const { data } = await axios.get(url, { headers: libelulaHeaders() });
      return res.json({ success: true, data });
    } catch (err) {
      const code = err?.code || err?.response?.status;
      const isDns = code === 'ENOTFOUND' || code === 'EAI_AGAIN';
      if (LIBELULA_MOCK || isDns) {
        const data = { qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('MOCK-' + ordenId)}` };
        return res.json({ success: true, data, mock: true });
      }
      throw err;
    }
  } catch (error) {
    console.error('❌ Error obteniendo QR Libélula:', error.response?.data || error.message);
    return res.status(400).json({ success: false, error: error.response?.data || error.message });
  }
});

// Webhook de Libélula (callback)
app.post('/api/libelula/webhook', async (req, res) => {
  try {
    // TODO: Validar firma del webhook si Libélula provee un secreto
    const evento = req.body;
    console.log('📥 Webhook Libélula recibido:', JSON.stringify(evento));

    // Responder 200 para confirmar recepción
    return res.json({ received: true });
  } catch (error) {
    console.error('❌ Error en webhook Libélula:', error.message);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// Ruta para envío masivo (notificaciones grupales)
app.post('/api/send-bulk-email', async (req, res) => {
  try {
    if (!resend) {
      return res.status(500).json({ error: 'Servidor de email no configurado (RESEND_API_KEY faltante)' });
    }
    const { destinatarios, asunto, contenido } = req.body;

    if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({ 
        error: 'destinatarios debe ser un array con al menos un email' 
      });
    }

    console.log(`📨 Enviando correos masivos a ${destinatarios.length} destinatarios`);

    // Enviar correos en lotes para evitar límites de rate
    const resultados = [];
    const errores = [];

    for (const email of destinatarios) {
      try {
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: email,
          subject: asunto,
          html: contenido,
        });

        if (error) {
          errores.push({ email, error: error.message });
        } else {
          resultados.push({ email, id: data.id });
        }

        // Pequeña pausa entre envíos
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        errores.push({ email, error: error.message });
      }
    }

    console.log(`✅ Correos enviados: ${resultados.length}/${destinatarios.length}`);
    if (errores.length > 0) {
      console.log(`⚠️ Errores: ${errores.length}`);
    }

    res.json({ 
      success: true,
      enviados: resultados.length,
      errores: errores.length,
      detalles: { resultados, errores },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en envío masivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor de correos ejecutándose en http://localhost:${PORT}`);
  console.log(`📧 Listo para enviar correos desde: ${process.env.EMAIL_FROM}`);
});

export default app;
