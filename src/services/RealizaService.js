import supabase from './dbConnection.js';

class RealizaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerRealizas() {
    try {
      const { data, error } = await this.supabase
        .from('realiza')
        .select('*')
        .order('id_realiza');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener realiza:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerRealizaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('realiza')
        .select('*')
        .eq('id_realiza', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener realiza por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearRealiza(realiza) {
    try {
      const { data, error } = await this.supabase
        .from('realiza')
        .insert([realiza]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear realiza:', error);
      return { success: false, error: error.message };
    }
  }

  async editarRealiza(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('realiza')
        .update(nuevosDatos)
        .eq('id_realiza', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar realiza:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarRealiza(id) {
    try {
      const { data, error } = await this.supabase
        .from('realiza')
        .delete()
        .eq('id_realiza', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar realiza:', error);
      return { success: false, error: error.message };
    }
  }
}

const realizaService = new RealizaService();
export default realizaService;
