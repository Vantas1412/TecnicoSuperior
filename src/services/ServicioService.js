// src/services/servicioService.js
import supabase from './dbConnection.js';

class ServicioService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerServicios() {
    try {
      const { data, error } = await this.supabase
        .from('servicio')
        .select('*')
        .order('id_servicio');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener servicios:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerServicioPorId(id_servicio) {
    try {
      const { data, error } = await this.supabase
        .from('servicio')
        .select('*')
        .eq('id_servicio', id_servicio)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener servicio por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearServicio(servicioData) {
    try {
      // Generar ID único para el servicio
      const timestamp = Date.now();

      const nuevoServicio = {
        tipo_servicio: servicioData.tipo_servicio
        // No hay campo descripción en tu tabla
      };

      const { data, error } = await this.supabase
        .from('servicio')
        .insert([nuevoServicio])
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear servicio:', error);
      return { success: false, error: error.message };
    }
  }

  async editarServicio(id_servicio, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('servicio')
        .update(nuevosDatos)
        .eq('id_servicio', id_servicio)
        .select();
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar servicio:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarServicio(id_servicio) {
    try {
      // Verificar si hay tickets asociados
      const { data: tickets, error: errorTickets } = await this.supabase
        .from('ticket')
        .select('id_ticket')
        .eq('id_servicio', id_servicio);

      if (errorTickets) throw errorTickets;

      if (tickets && tickets.length > 0) {
        throw new Error('No se puede eliminar el servicio porque tiene tickets asociados');
      }

      const { data, error } = await this.supabase
        .from('servicio')
        .delete()
        .eq('id_servicio', id_servicio);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      return { success: false, error: error.message };
    }
  }
}

const servicioService = new ServicioService();
export default servicioService;