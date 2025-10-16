import supabase from './dbConnection.js';

class EstacionamientoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerEstacionamientos() {
    try {
      const { data, error } = await this.supabase
        .from('estacionamiento')
        .select('*')
        .order('cod');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener estacionamientos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerEstacionamientoPorId(cod) {
    try {
      const { data, error } = await this.supabase
        .from('estacionamiento')
        .select('*')
        .eq('cod', cod)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener estacionamiento por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearEstacionamiento(estacionamiento) {
    try {
      const { data, error } = await this.supabase
        .from('estacionamiento')
        .insert([estacionamiento]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }

  async editarEstacionamiento(cod, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('estacionamiento')
        .update(nuevosDatos)
        .eq('cod', cod);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarEstacionamiento(cod) {
    try {
      const { data, error } = await this.supabase
        .from('estacionamiento')
        .delete()
        .eq('cod', cod);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }
}

const estacionamientoService = new EstacionamientoService();
export default estacionamientoService;
