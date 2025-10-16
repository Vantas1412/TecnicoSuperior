import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

// Cargar variables de entorno
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Agregar tus dominios
  credentials: true
}));
app.use(express.json());

// Log de inicio
console.log('🚀 Servidor de correos iniciando...');
console.log('📧 Email FROM:', process.env.EMAIL_FROM);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Email Server',
    timestamp: new Date().toISOString()
  });
});

// Ruta principal para enviar correos
app.post('/api/send-email', async (req, res) => {
  try {
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

// Ruta para envío masivo (notificaciones grupales)
app.post('/api/send-bulk-email', async (req, res) => {
  try {
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
