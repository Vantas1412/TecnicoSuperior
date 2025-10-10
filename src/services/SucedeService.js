import supabase from './dbConnection.js';

class SucedeService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerSucedes() {
    try {
      const { data, error } = await this.supabase
        .from('sucede')
        .select('*')
        .order('id_sucede');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener sucede:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerSucedePorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('sucede')
        .select('*')
        .eq('id_sucede', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener sucede por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearSucede(sucede) {
    try {
      const { data, error } = await this.supabase
        .from('sucede')
        .insert([sucede]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear sucede:', error);
      return { success: false, error: error.message };
    }
  }

  async editarSucede(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('sucede')
        .update(nuevosDatos)
        .eq('id_sucede', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar sucede:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarSucede(id) {
    try {
      const { data, error } = await this.supabase
        .from('sucede')
        .delete()
        .eq('id_sucede', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar sucede:', error);
      return { success: false, error: error.message };
    }
  }
}

const sucedeService = new SucedeService();
export default sucedeService;
