// src/services/EmailService.js
// Servicio para enviar correos electrónicos y registrar los envíos en la base de datos.
// Este servicio utiliza Supabase para obtener direcciones de correo de los usuarios activos
// y para guardar un historial de correos enviados en la tabla `correo`.  Además, si se
// configura una API externa (por ejemplo, SendGrid, Mailgun o Resend) mediante las
// variables de entorno `VITE_EMAIL_API_URL` y `VITE_EMAIL_API_KEY`, enviará correos
// reales a los destinatarios.  El campo `VITE_EMAIL_FROM` permite especificar el
// remitente (puede ser el mismo dominio configurado en tu servicio SMTP).

import supabase from './dbConnection.js';

class EmailService {
  constructor() {
    this.supabase = supabase;
    // Dirección de correo remitente.  Algunos servicios requieren un remitente válido.
    // En esta versión se elimina el uso de un backend externo (por ejemplo, Node.js) para
    // enviar correos.  Sólo se registrarán los envíos en la base de datos `correo`.  La
    // variable `fromEmail` puede utilizarse como remitente en caso de que se integre
    // posteriormente un servicio de envío real.
    this.fromEmail = import.meta.env.VITE_EMAIL_FROM || '';
  }

  /**
   * Envía un correo a uno o varios destinatarios y registra cada envío en la tabla `correo`.
   * Si se configura `VITE_EMAIL_API_URL` y `VITE_EMAIL_API_KEY`, utilizará un API externo
   * para enviar el correo real.  En cualquier caso, registra el envío en la tabla `correo`.
   *
   * @param {string|string[]} destinatarios - Dirección o lista de direcciones de correo.
   * @param {string} asunto - Asunto del correo.
   * @param {string} contenido - Contenido o cuerpo del correo (texto plano).
   * @returns {Promise<void>}
   */
  async sendEmail(destinatarios, asunto, contenido) {
    const recipients = Array.isArray(destinatarios) ? destinatarios : [destinatarios];
    // En esta versión no se realiza ningún envío externo de correos.  Si más adelante
    // se desea integrar un servicio SMTP o API, este método puede ajustarse en
    // consecuencia.  Por ahora solo se registra cada correo en la tabla `correo`.
    const inserts = recipients.map((dest) => ({
      destinatario: dest,
      asunto,
      contenido,
      fecha_envio: new Date().toISOString(),
    }));
    try {
      const { error } = await this.supabase.from('correo').insert(inserts);
      if (error) {
        console.error('Error registrando correos en la base de datos:', error);
      }
    } catch (err) {
      console.error('Error registrando correos en la base de datos:', err);
    }
  }

  /**
   * Envía correos a todos los usuarios activos con un rol específico.  Se utiliza para
   * notificaciones masivas (residente, empleado, admin).  Filtra usuarios inactivos o
   * sin correo registrado.
   *
   * @param {string[]} roles - Lista de roles (p. ej. ['residente']).
   * @param {string} asunto - Asunto del correo.
   * @param {string} contenido - Contenido del correo.
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
        await this.sendEmail(emails, asunto, contenido);
      }
    } catch (err) {
      console.error('Error enviando correos a grupo:', err);
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
    const asunto = `Nuevo aviso: ${titulo}`;
    // Enviar a roles 'residente' y 'empleado'.  No se envía a administradores para evitar duplicados.
    await this.sendGroupEmails(['residente', 'empleado'], asunto, contenido);
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
        .select('correo_electronico')
        .eq('id_usuario', id_usuario)
        .single();
      if (error) throw error;
      if (usuario && usuario.correo_electronico) {
        const asunto = `Notificación: ${titulo}`;
        await this.sendEmail(usuario.correo_electronico, asunto, mensaje);
      }
    } catch (err) {
      console.error('Error enviando notificación por correo:', err);
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
        .select('correo_electronico')
        .eq('id_usuario', id_usuario)
        .single();
      if (error) throw error;
      if (usuario && usuario.correo_electronico) {
        const asunto = 'Respuesta a su queja';
        await this.sendEmail(usuario.correo_electronico, asunto, respuesta);
      }
    } catch (err) {
      console.error('Error enviando respuesta de queja por correo:', err);
    }
  }
}

const emailService = new EmailService();
export default emailService;