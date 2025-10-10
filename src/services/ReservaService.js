import supabase from './dbConnection.js';

class ReservaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerReservas() {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .select('*')
        .order('id_reserva');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerReservaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .select('*')
        .eq('id_reserva', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener reserva por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearReserva(reserva) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .insert([reserva]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear reserva:', error);
      return { success: false, error: error.message };
    }
  }

  async editarReserva(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update(nuevosDatos)
        .eq('id_reserva', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar reserva:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarReserva(id) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .delete()
        .eq('id_reserva', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      return { success: false, error: error.message };
    }
  }
}

const reservaService = new ReservaService();
export default reservaService;
