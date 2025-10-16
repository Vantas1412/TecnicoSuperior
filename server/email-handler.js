// server/email-handler.js - Lógica compartida para todas las plataformas
import { Resend } from 'resend';

// Plantillas HTML reutilizables
export const plantillas = {
  login: (contenido) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; min-height: 100vh;">
        <div style="background: white; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">🔐 Inicio de sesión detectado</h2>
          <div style="color: #555; line-height: 1.6;">
            ${contenido}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  notificacion: (contenido) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px; min-height: 100vh;">
        <div style="background: white; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">🔔 Nueva Notificación</h2>
          <div style="color: #555; line-height: 1.6;">
            ${contenido}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  anuncio: (contenido) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); padding: 40px; min-height: 100vh;">
        <div style="background: white; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">📢 Nuevo Aviso</h2>
          <div style="color: #555; line-height: 1.6;">
            ${contenido}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  respuesta: (contenido) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px; min-height: 100vh;">
        <div style="background: white; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">✉️ Respuesta a tu Queja</h2>
          <div style="color: #555; line-height: 1.6;">
            ${contenido}
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
};

// Lógica principal de envío de correos
export async function sendEmail({ destinatarios, asunto, contenido, tipo = 'notificacion' }) {
  // Validación
  if (!destinatarios || !asunto || !contenido) {
    throw new Error('Faltan campos requeridos: destinatarios, asunto, contenido');
  }

  // Inicializar Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Seleccionar plantilla
  const htmlContent = plantillas[tipo] 
    ? plantillas[tipo](contenido) 
    : plantillas.notificacion(contenido);

  // Convertir destinatarios a array
  const destinatariosArray = Array.isArray(destinatarios) 
    ? destinatarios 
    : [destinatarios];

  // Enviar correo
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: destinatariosArray,
    subject: asunto,
    html: htmlContent,
  });

  if (error) {
    throw error;
  }

  return {
    success: true,
    message: 'Correo enviado exitosamente',
    id: data.id,
    destinatarios: destinatariosArray
  };
}
