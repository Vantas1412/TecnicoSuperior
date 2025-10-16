// api/send-email.js - Vercel/Netlify Serverless Function
import { sendEmail } from '../server/email-handler.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Manejar preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const result = await sendEmail(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return res.status(400).json({ 
      error: 'Error al enviar el correo',
      details: error.message 
    });
  }
}
