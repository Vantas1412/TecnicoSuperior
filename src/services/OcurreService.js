import supabase from './dbConnection.js';

class OcurreService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerOcurres() {
    try {
      const { data, error } = await this.supabase
        .from('ocurre')
        .select('*')
        .order('id_ocurre');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener ocurre:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerOcurrePorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('ocurre')
        .select('*')
        .eq('id_ocurre', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener ocurre por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearOcurre(ocurre) {
    try {
      const { data, error } = await this.supabase
        .from('ocurre')
        .insert([ocurre]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear ocurre:', error);
      return { success: false, error: error.message };
    }
  }

  async editarOcurre(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('ocurre')
        .update(nuevosDatos)
        .eq('id_ocurre', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar ocurre:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarOcurre(id) {
    try {
      const { data, error } = await this.supabase
        .from('ocurre')
        .delete()
        .eq('id_ocurre', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar ocurre:', error);
      return { success: false, error: error.message };
    }
  }
}

const ocurreService = new OcurreService();
export default ocurreService;
