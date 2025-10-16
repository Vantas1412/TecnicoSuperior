import supabase from './dbConnection.js';

class AfectaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerAfectas() {
    try {
      const { data, error } = await this.supabase
        .from('afecta')
        .select('*')
        .order('id_afecta');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener afecta:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerAfectaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('afecta')
        .select('*')
        .eq('id_afecta', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener afecta por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearAfecta(afecta) {
    try {
      const { data, error } = await this.supabase
        .from('afecta')
        .insert([afecta]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear afecta:', error);
      return { success: false, error: error.message };
    }
  }

  async editarAfecta(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('afecta')
        .update(nuevosDatos)
        .eq('id_afecta', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar afecta:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarAfecta(id) {
    try {
      const { data, error } = await this.supabase
        .from('afecta')
        .delete()
        .eq('id_afecta', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar afecta:', error);
      return { success: false, error: error.message };
    }
  }
}

const afectaService = new AfectaService();
export default afectaService;
