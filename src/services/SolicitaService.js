import supabase from './dbConnection.js';

class SolicitaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerSolicitas() {
    try {
      const { data, error } = await this.supabase
        .from('solicita')
        .select('*')
        .order('id_solicita');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener solicita:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerSolicitaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('solicita')
        .select('*')
        .eq('id_solicita', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener solicita por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearSolicita(solicita) {
    try {
      const { data, error } = await this.supabase
        .from('solicita')
        .insert([solicita]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear solicita:', error);
      return { success: false, error: error.message };
    }
  }

  async editarSolicita(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('solicita')
        .update(nuevosDatos)
        .eq('id_solicita', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar solicita:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarSolicita(id) {
    try {
      const { data, error } = await this.supabase
        .from('solicita')
        .delete()
        .eq('id_solicita', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar solicita:', error);
      return { success: false, error: error.message };
    }
  }
}

const solicitaService = new SolicitaService();
export default solicitaService;
