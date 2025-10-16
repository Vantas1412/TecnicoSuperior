// src/services/EmailService.js
// Servicio para enviar correos electrónicos usando Resend API y registrar los envíos en la base de datos.
// Este servicio utiliza Supabase para obtener direcciones de correo de los usuarios activos
// y para guardar un historial de correos enviados en la tabla `correo`.
// Utiliza un servidor backend (email-server) con Resend API para el envío real de correos.

import supabase from './dbConnection.js';

class EmailService {
  constructor() {
    this.supabase = supabase;
    // Usar /api/send-email para producción y desarrollo con Vite proxy
    this.emailApiUrl = import.meta.env.VITE_EMAIL_API_URL || '/api/send-email';
    this.fromEmail = import.meta.env.VITE_EMAIL_FROM || 'onboarding@resend.dev';
  }

  /**
   * Envía un correo a uno o varios destinatarios usando Resend API y registra cada envío en la tabla `correo`.
   *
   * @param {string|string[]} destinatarios - Dirección o lista de direcciones de correo.
   * @param {string} asunto - Asunto del correo.
   * @param {string} contenido - Contenido o cuerpo del correo (HTML).
   * @param {string} tipo - Tipo de correo (login, notificacion, aviso, etc.)
   * @returns {Promise<Object>}
   */
  async sendEmail(destinatarios, asunto, contenido, tipo = 'general') {
    const recipients = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    
    try {
      // Enviar correo real a través del servidor backend con Resend
      const response = await fetch(this.emailApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinatarios: recipients,
          asunto,
          contenido,
          tipo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al enviar correo:', errorData);
        throw new Error(errorData.error || 'Error al enviar correo');
      }

      const result = await response.json();
      console.log('✅ Correo enviado exitosamente:', result);

      // Registrar en la base de datos
      const inserts = recipients.map((dest) => ({
        destinatario: dest,
        asunto,
        contenido,
        fecha_envio: new Date().toISOString(),
      }));

      const { error: dbError } = await this.supabase.from('correo').insert(inserts);
      if (dbError) {
        console.error('Error registrando correos en la base de datos:', dbError);
      }

      return result;
    } catch (err) {
      console.error('Error en EmailService.sendEmail:', err);
      throw err;
    }
  }

  /**
   * Envía correos a todos los usuarios activos con un rol específico.  Se utiliza para
   * notificaciones masivas (residente, empleado, admin).  Filtra usuarios inactivos o
   * sin correo registrado.
   *
   * @param {string[]} roles - Lista de roles (p. ej. ['residente']).
   * @param {string} asunto - Asunto del correo.
   * @param {string} contenido - Contenido del correo (HTML).
   */
  async sendGroupEmails(roles, asunto, contenido) {
    try {
      const { data: users, error } = await this.supabase
        .from('usuario')
        .select('correo_electronico')
        .in('rol', roles)
        .eq('estado', 'activo');
      
      if (error) throw error;
      
      const emails = (users || [])
        .map((u) => u.correo_electronico)
        .filter((email) => !!email);
      
      if (emails.length > 0) {
        console.log(`📧 Enviando correo grupal a ${emails.length} usuarios con roles: ${roles.join(', ')}`);
        await this.sendEmail(emails, asunto, contenido, 'grupo');
      }
    } catch (err) {
      console.error('Error enviando correos a grupo:', err);
      throw err;
    }
  }

  /**
   * Envía un aviso (anuncio) a residentes y empleados activos.  Utiliza el título
   * y el contenido como asunto y cuerpo del correo, respectivamente.
   *
   * @param {string} titulo - Título del aviso (usado en el asunto).
   * @param {string} contenido - Contenido del aviso.
   */
  async sendAnnouncementEmails(titulo, contenido) {
    const asunto = `📢 Nuevo aviso: ${titulo}`;
    const htmlContent = this.createAnnouncementTemplate(titulo, contenido);
    // Enviar a roles 'residente' y 'empleado'.
    await this.sendGroupEmails(['residente', 'empleado'], asunto, htmlContent);
  }

  /**
   * Envía una notificación por correo a un usuario específico.
   *
   * @param {string|number} id_usuario - ID del usuario destinatario.
   * @param {string} titulo - Título de la notificación (asunto).
   * @param {string} mensaje - Mensaje de la notificación (cuerpo).
   */
  async sendNotificationEmail(id_usuario, titulo, mensaje) {
    try {
      const { data: usuario, error } = await this.supabase
        .from('usuario')
        .select('correo_electronico, nombre')
        .eq('id_usuario', id_usuario)
        .single();
      
      if (error) throw error;
      
      if (usuario && usuario.correo_electronico) {
        const asunto = `🔔 Notificación: ${titulo}`;
        const htmlContent = this.createNotificationTemplate(usuario.nombre, titulo, mensaje);
        await this.sendEmail(usuario.correo_electronico, asunto, htmlContent, 'notificacion');
      }
    } catch (err) {
      console.error('Error enviando notificación por correo:', err);
      throw err;
    }
  }

  /**
   * Envía por correo la respuesta a una queja a un usuario específico (no anónimo).
   *
   * @param {string|number} id_usuario - ID del usuario que recibió la respuesta.
   * @param {string} respuesta - Contenido de la respuesta.
   */
  async sendComplaintResponseEmail(id_usuario, respuesta) {
    try {
      const { data: usuario, error } = await this.supabase
        .from('usuario')
        .select('correo_electronico, nombre')
        .eq('id_usuario', id_usuario)
        .single();
      
      if (error) throw error;
      
      if (usuario && usuario.correo_electronico) {
        const asunto = '✉️ Respuesta a su queja';
        const htmlContent = this.createComplaintResponseTemplate(usuario.nombre, respuesta);
        await this.sendEmail(usuario.correo_electronico, asunto, htmlContent, 'respuesta_queja');
      }
    } catch (err) {
      console.error('Error enviando respuesta de queja por correo:', err);
      throw err;
    }
  }

  /**
   * Envía correo de notificación de inicio de sesión
   * 
   * @param {string} email - Correo del usuario
   * @param {string} nombre - Nombre del usuario
   * @param {Object} loginInfo - Información del inicio de sesión
   */
  async sendLoginNotification(email, nombre, loginInfo = {}) {
    try {
      const asunto = '🔐 Inicio de sesión detectado';
      const htmlContent = this.createLoginTemplate(nombre, loginInfo);
      await this.sendEmail(email, asunto, htmlContent, 'login');
      console.log(`✅ Correo de inicio de sesión enviado a: ${email}`);
    } catch (err) {
      console.error('Error enviando correo de inicio de sesión:', err);
      // No lanzar error para no bloquear el inicio de sesión
    }
  }

  // ============= TEMPLATES HTML =============

  /**
   * Template para correo de inicio de sesión
   */
  createLoginTemplate(nombre, loginInfo) {
    const fecha = new Date().toLocaleString('es-ES', { 
      dateStyle: 'full', 
      timeStyle: 'short' 
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Inicio de Sesión Detectado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Se ha detectado un inicio de sesión en tu cuenta del sistema de gestión.</p>
            
            <div class="info-box">
              <p><strong>📅 Fecha y hora:</strong> ${fecha}</p>
              <p><strong>💻 Navegador:</strong> ${loginInfo.browser || 'Desconocido'}</p>
              <p><strong>🌐 IP:</strong> ${loginInfo.ip || 'No disponible'}</p>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ ¿No fuiste tú?</strong></p>
              <p>Si no reconoces este inicio de sesión, te recomendamos cambiar tu contraseña inmediatamente y contactar al administrador del sistema.</p>
            </div>
            
            <p>Este es un correo automático de seguridad para mantener tu cuenta protegida.</p>
          </div>
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión - Técnico Superior</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para notificaciones
   */
  createNotificationTemplate(nombre, titulo, mensaje) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .notification { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Nueva Notificación</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <div class="notification">
              <h2 style="color: #667eea; margin-top: 0;">${titulo}</h2>
              <p>${mensaje}</p>
            </div>
            <p>Puedes ver más detalles en tu panel de control del sistema.</p>
          </div>
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión - Técnico Superior</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para avisos/anuncios
   */
  createAnnouncementTemplate(titulo, contenido) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .announcement { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Nuevo Aviso</h1>
          </div>
          <div class="content">
            <div class="announcement">
              <h2 style="color: #f5576c; margin-top: 0;">${titulo}</h2>
              <p>${contenido}</p>
            </div>
            <p>Para más información, visita el panel de avisos en el sistema.</p>
          </div>
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión - Técnico Superior</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para respuesta a quejas
   */
  createComplaintResponseTemplate(nombre, respuesta) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .response { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4facfe; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Respuesta a tu Queja</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Hemos recibido y procesado tu queja. A continuación nuestra respuesta:</p>
            <div class="response">
              <p>${respuesta}</p>
            </div>
            <p>Si tienes más dudas o comentarios, no dudes en contactarnos nuevamente.</p>
            <p>Gracias por tu comprensión.</p>
          </div>
          <div class="footer">
            <p>Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Gestión - Técnico Superior</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

const emailService = new EmailService();
export default emailService;