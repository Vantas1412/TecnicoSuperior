// src/services/TicketService.js
import supabase from './dbConnection.js';

class TicketService {
  constructor() {
    this.supabase = supabase;
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
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .update({ 
          id_empleado,
          estado: 'En Proceso'
        })
        .eq('id_ticket', id_ticket)
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al asignar empleado:', error);
      return { success: false, error: error.message };
    }
  }

  async cambiarEstado(id_ticket, nuevoEstado) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .update({ estado: nuevoEstado })
        .eq('id_ticket', id_ticket)
        .select();
        
      if (error) throw error;
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