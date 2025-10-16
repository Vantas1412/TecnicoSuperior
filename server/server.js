// server/server.js - Servidor Express tradicional para Railway/Render/Heroku
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendEmail } from './email-handler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor de correos funcionando',
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal para enviar correos
app.post('/api/send-email', async (req, res) => {
  try {
    const result = await sendEmail(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(400).json({ 
      error: 'Error al enviar el correo',
      details: error.message 
    });
  }
});

// Endpoint para envío masivo (opcional)
app.post('/api/send-bulk-email', async (req, res) => {
  try {
    const { destinatarios, asunto, contenido, tipo } = req.body;
    
    if (!Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({ error: 'destinatarios debe ser un array con al menos un correo' });
    }

    const result = await sendEmail({
      destinatarios,
      asunto,
      contenido,
      tipo
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error al enviar correos masivos:', error);
    res.status(400).json({ 
      error: 'Error al enviar los correos',
      details: error.message 
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor de correos escuchando en puerto ${PORT}`);
  console.log(`📧 Resend API configurada: ${process.env.RESEND_API_KEY ? 'Sí' : 'No'}`);
  console.log(`📬 Email remitente: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
