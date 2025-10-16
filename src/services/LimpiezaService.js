import supabase from './dbConnection.js';

class LimpiezaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerLimpiezas() {
    try {
      const { data, error } = await this.supabase
        .from('limpieza')
        .select('*, servicio(*)')
        .order('id_limpieza');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener limpiezas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerLimpiezaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('limpieza')
        .select('*, servicio(*)')
        .eq('id_limpieza', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener limpieza por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearLimpieza(limpieza) {
    try {
      const { data, error } = await this.supabase
        .from('limpieza')
        .insert([limpieza]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear limpieza:', error);
      return { success: false, error: error.message };
    }
  }

  async editarLimpieza(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('limpieza')
        .update(nuevosDatos)
        .eq('id_limpieza', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar limpieza:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarLimpieza(id) {
    try {
      const { data, error } = await this.supabase
        .from('limpieza')
        .delete()
        .eq('id_limpieza', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar limpieza:', error);
      return { success: false, error: error.message };
    }
  }
}

const limpiezaService = new LimpiezaService();
export default limpiezaService;
