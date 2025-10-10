import supabase from './dbConnection.js';

class RegistroMantenimientoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerRegistros() {
    try {
      const { data, error } = await this.supabase
        .from('registro_mantenimiento')
        .select('*, mantenimiento(*)')
        .order('id_registro_mantenimiento');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registros de mantenimiento:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerRegistroPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('registro_mantenimiento')
        .select('*, mantenimiento(*)')
        .eq('id_registro_mantenimiento', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registro de mantenimiento por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearRegistro(registro) {
    try {
      const { data, error } = await this.supabase
        .from('registro_mantenimiento')
        .insert([registro]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear registro de mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }

  async editarRegistro(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('registro_mantenimiento')
        .update(nuevosDatos)
        .eq('id_registro_mantenimiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar registro de mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarRegistro(id) {
    try {
      const { data, error } = await this.supabase
        .from('registro_mantenimiento')
        .delete()
        .eq('id_registro_mantenimiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar registro de mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }
}

const registroMantenimientoService = new RegistroMantenimientoService();
export default registroMantenimientoService;
