import supabase from './dbConnection.js';

class MuebleService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerMuebles() {
    try {
      const { data, error } = await this.supabase
        .from('mueble')
        .select('*, departamento(*)')
        .order('id_mueble');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener muebles:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerMueblePorId(id_mueble) {
    try {
      const { data, error } = await this.supabase
        .from('mueble')
        .select('*, departamento(*)')
        .eq('id_mueble', id_mueble)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener mueble por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearMueble(mueble) {
    try {
      const { data, error } = await this.supabase
        .from('mueble')
        .insert([mueble]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear mueble:', error);
      return { success: false, error: error.message };
    }
  }

  async editarMueble(id_mueble, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('mueble')
        .update(nuevosDatos)
        .eq('id_mueble', id_mueble);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar mueble:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarMueble(id_mueble) {
    try {
      const { data, error } = await this.supabase
        .from('mueble')
        .delete()
        .eq('id_mueble', id_mueble);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar mueble:', error);
      return { success: false, error: error.message };
    }
  }
}

const muebleService = new MuebleService();
export default muebleService;
