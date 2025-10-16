import supabase from './dbConnection.js';

class EvidenciaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerEvidencias() {
    try {
      const { data, error } = await this.supabase
        .from('evidencia')
        .select('*')
        .order('id_evidencia');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener evidencias:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerEvidenciaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia')
        .select('*')
        .eq('id_evidencia', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener evidencia por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearEvidencia(evidencia) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia')
        .insert([evidencia]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear evidencia:', error);
      return { success: false, error: error.message };
    }
  }

  async editarEvidencia(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia')
        .update(nuevosDatos)
        .eq('id_evidencia', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar evidencia:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarEvidencia(id) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia')
        .delete()
        .eq('id_evidencia', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar evidencia:', error);
      return { success: false, error: error.message };
    }
  }
}

const evidenciaService = new EvidenciaService();
export default evidenciaService;
