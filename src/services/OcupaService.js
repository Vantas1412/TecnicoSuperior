import supabase from './dbConnection.js';

class OcupaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerOcupas() {
    try {
      const { data, error } = await this.supabase
        .from('ocupa')
        .select('*')
        .order('id_ocupa');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener ocupas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerOcupaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('ocupa')
        .select('*')
        .eq('id_ocupa', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener ocupa por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearOcupa(ocupa) {
    try {
      const { data, error } = await this.supabase
        .from('ocupa')
        .insert([ocupa]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear ocupa:', error);
      return { success: false, error: error.message };
    }
  }

  async editarOcupa(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('ocupa')
        .update(nuevosDatos)
        .eq('id_ocupa', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar ocupa:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarOcupa(id) {
    try {
      const { data, error } = await this.supabase
        .from('ocupa')
        .delete()
        .eq('id_ocupa', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar ocupa:', error);
      return { success: false, error: error.message };
    }
  }
}

const ocupaService = new OcupaService();
export default ocupaService;
