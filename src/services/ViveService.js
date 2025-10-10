import supabase from './dbConnection.js';

class ViveService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerVives() {
    try {
      const { data, error } = await this.supabase
        .from('vive')
        .select('*')
        .order('id_vive');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener vives:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerVivePorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('vive')
        .select('*')
        .eq('id_vive', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener vive por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearVive(vive) {
    try {
      const { data, error } = await this.supabase
        .from('vive')
        .insert([vive]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear vive:', error);
      return { success: false, error: error.message };
    }
  }

  async editarVive(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('vive')
        .update(nuevosDatos)
        .eq('id_vive', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar vive:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarVive(id) {
    try {
      const { data, error } = await this.supabase
        .from('vive')
        .delete()
        .eq('id_vive', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar vive:', error);
      return { success: false, error: error.message };
    }
  }
}

const viveService = new ViveService();
export default viveService;
