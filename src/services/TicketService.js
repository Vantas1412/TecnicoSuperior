// src/services/TicketService.js
import supabase from './dbConnection.js';

class TicketService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Registra un cambio de estado en el historial. Opcionalmente almacena el usuario que lo hizo y un comentario.
   * @param {string} id_ticket
   * @param {string} estado_anterior
   * @param {string} estado_nuevo
   * @param {string|null} id_usuario
   * @param {string|null} comentario
   */
  async logCambioEstado(id_ticket, estado_anterior, estado_nuevo, id_usuario = null, comentario = null) {
    try {
      const { data, error } = await this.supabase
        .from('ticket_historial')
        .insert([{
          id_ticket,
          estado_anterior,
          estado_nuevo,
          comentario,
          id_usuario,
          creado_at: new Date().toISOString(),
        }])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar historial de ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea o reasigna un ticket a un empleado. Desactiva asignaciones anteriores y actualiza el ticket.
   * @param {string} id_ticket
   * @param {string} id_empleado
   * @param {string|null} asignado_por
   * @param {string|null} motivo
   */
  async createAsignacion(id_ticket, id_empleado, asignado_por = null, motivo = null) {
    try {
      // Desactivar asignaciones anteriores activas
      await this.supabase
        .from('ticket_asignacion')
        .update({ activo: false })
        .eq('id_ticket', id_ticket)
        .eq('activo', true);

      // Insertar nueva asignación
      const { data, error } = await this.supabase
        .from('ticket_asignacion')
        .insert([{
          id_ticket,
          id_empleado,
          asignado_por,
          motivo,
          activo: true,
          creado_at: new Date().toISOString(),
        }])
        .select();
      if (error) throw error;

      // Actualizar el ticket para reflejar la asignación actual
      await this.supabase
        .from('ticket')
        .update({ id_empleado })
        .eq('id_ticket', id_ticket);

      return { success: true, data };
    } catch (error) {
      console.error('Error al crear asignación de ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el historial de cambios de un ticket ordenado por fecha descendente.
   * @param {string} id_ticket
   */
  async obtenerHistorial(id_ticket) {
    try {
      const { data, error } = await this.supabase
        .from('ticket_historial')
        .select('*')
        .eq('id_ticket', id_ticket)
        .order('creado_at', { ascending: false });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener historial del ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agrega un comentario al ticket. Se puede marcar como interno para que no lo vea el residente.
   * @param {string} id_ticket
   * @param {string} id_usuario
   * @param {string} mensaje
   * @param {boolean} interno
   */
  async agregarComentario(id_ticket, id_usuario, mensaje, interno = false) {
    try {
      const { data, error } = await this.supabase
        .from('ticket_comentario')
        .insert([{
          id_ticket,
          id_usuario,
          mensaje,
          interno,
          creado_at: new Date().toISOString(),
        }])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al agregar comentario al ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene los comentarios asociados a un ticket.
   * @param {string} id_ticket
   */
  async obtenerComentarios(id_ticket) {
    try {
      const { data, error } = await this.supabase
        .from('ticket_comentario')
        .select('*')
        .eq('id_ticket', id_ticket)
        .order('creado_at', { ascending: true });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener comentarios del ticket:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerTickets() {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .select(`
          *,
          persona:id_persona (
            nombre,
            apellido,
            telefono
          ),
          servicio:id_servicio (
            id_servicio,
            tipo_servicio
          ),
          empleado:id_empleado (
            id_empleado,
            tipo,
            persona!empleado_id_persona_fkey (
              nombre,
              apellido
            )
          )
        `)
        .order('fecha', { ascending: false });
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener tickets:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerTicketsSinAsignar() {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .select(`
          *,
          persona:id_persona (
            nombre,
            apellido,
            telefono
          ),
          servicio:id_servicio (
            id_servicio,
            tipo_servicio
          )
        `)
        .is('id_empleado', null)
        .order('fecha', { ascending: false });
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener tickets sin asignar:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerTicketsPorEmpleado(id_empleado) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .select(`
          *,
          persona:id_persona (
            nombre,
            apellido,
            telefono
          ),
          servicio:id_servicio (
            id_servicio,
            tipo_servicio
          )
        `)
        .eq('id_empleado', id_empleado)
        .order('fecha', { ascending: false });
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener tickets por empleado:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerTicketPorId(id_ticket) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .select(`
          *,
          persona:id_persona (
            nombre,
            apellido,
            telefono
          ),
          servicio:id_servicio (
            id_servicio,
            tipo_servicio
          )
        `)
        .eq('id_ticket', id_ticket)
        .single();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener ticket por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearTicket(ticketData) {
    try {
      // Generar ID único para el ticket
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const nuevoIdTicket = `TKT${timestamp}${random}`.substring(0, 10);

      const nuevoTicket = {
        id_ticket: nuevoIdTicket,
        id_persona: ticketData.id_persona,
        id_servicio: ticketData.id_servicio,
        descripcion: ticketData.descripcion,
        tipo: ticketData.tipo,
        estado: ticketData.estado || 'Pendiente',
        fecha: ticketData.fecha || new Date().toISOString().split('T')[0],
        id_empleado: ticketData.id_empleado || null
      };

      const { data, error } = await this.supabase
        .from('ticket')
        .insert([nuevoTicket])
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear ticket:', error);
      return { success: false, error: error.message };
    }
  }

  async asignarEmpleado(id_ticket, id_empleado) {
    // A partir de ahora usamos la tabla ticket_asignacion para manejar asignaciones.
    return this.createAsignacion(id_ticket, id_empleado);
  }
    // SE AGREGO ESTO Y SHA

async obtenerTicketsPorEmpleadoCompleto(id_empleado) {
  try {
    const { data, error } = await this.supabase
      .from('ticket')
      .select(`
        id_ticket,
        descripcion,
        tipo,
        estado,
        fecha,
        fechafin,
        persona:id_persona (
          nombre,
          apellido
        ),
        servicio:id_servicio (
          tipo_servicio
        )
      `)
      .eq('id_empleado', id_empleado)
      .order('fecha', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener tickets por empleado:', error);
    return { success: false, error: error.message, data: [] };
  }
}

  async cambiarEstado(id_ticket, nuevoEstado) {
    // Cambio de estado con registro en historial
    try {
      // Obtener estado anterior
      const ticketResp = await this.obtenerTicketPorId(id_ticket);
      const estadoAnterior = ticketResp?.data?.estado;
      const { data, error } = await this.supabase
        .from('ticket')
        .update({ estado: nuevoEstado })
        .eq('id_ticket', id_ticket)
        .select();
      if (error) throw error;
      // Registrar en historial
      await this.logCambioEstado(id_ticket, estadoAnterior, nuevoEstado);
      return { success: true, data };
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return { success: false, error: error.message };
    }
  }

  async editarTicket(id_ticket, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .update(nuevosDatos)
        .eq('id_ticket', id_ticket)
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar ticket:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarTicket(id_ticket) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .delete()
        .eq('id_ticket', id_ticket);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar ticket:', error);
      return { success: false, error: error.message };
    }
  }
}

const ticketService = new TicketService();
export default ticketService;