import supabase from './dbConnection.js';

class RegistroEstacionamientoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerRegistros() {
    try {
      const { data, error } = await this.supabase
        .from('registro_estacionamiento')
        .select('*, estacionamiento(*)')
        .order('id_registro_estacionamiento');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registros de estacionamiento:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerRegistroPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('registro_estacionamiento')
        .select('*, estacionamiento(*)')
        .eq('id_registro_estacionamiento', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registro de estacionamiento por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearRegistro(registro) {
    try {
      const { data, error } = await this.supabase
        .from('registro_estacionamiento')
        .insert([registro]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear registro de estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }

  async editarRegistro(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('registro_estacionamiento')
        .update(nuevosDatos)
        .eq('id_registro_estacionamiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar registro de estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarRegistro(id) {
    try {
      const { data, error } = await this.supabase
        .from('registro_estacionamiento')
        .delete()
        .eq('id_registro_estacionamiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar registro de estacionamiento:', error);
      return { success: false, error: error.message };
    }
  }
}

const registroEstacionamientoService = new RegistroEstacionamientoService();
export default registroEstacionamientoService;
