import supabase from './dbConnection.js';

class RegistroMedidorService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerRegistros() {
    try {
      const { data, error } = await this.supabase
        .from('registro_medidor')
        .select('*, medidor(*)')
        .order('id_registro_medidor');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registros:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerRegistroPorId(id_registro_medidor) {
    try {
      const { data, error } = await this.supabase
        .from('registro_medidor')
        .select('*, medidor(*)')
        .eq('id_registro_medidor', id_registro_medidor)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener registro por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearRegistro(registro) {
    try {
      const { data, error } = await this.supabase
        .from('registro_medidor')
        .insert([registro]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear registro:', error);
      return { success: false, error: error.message };
    }
  }

  async editarRegistro(id_registro_medidor, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('registro_medidor')
        .update(nuevosDatos)
        .eq('id_registro_medidor', id_registro_medidor);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar registro:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarRegistro(id_registro_medidor) {
    try {
      const { data, error } = await this.supabase
        .from('registro_medidor')
        .delete()
        .eq('id_registro_medidor', id_registro_medidor);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      return { success: false, error: error.message };
    }
  }
}

const registroMedidorService = new RegistroMedidorService();
export default registroMedidorService;
