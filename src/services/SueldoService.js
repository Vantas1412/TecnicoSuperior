import supabase from './dbConnection.js';

class SueldoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerSueldos() {
    try {
      const { data, error } = await this.supabase
        .from('sueldo')
        .select('*, empleado(*)')
        .order('id_sueldo');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener sueldos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerSueldoPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('sueldo')
        .select('*, empleado(*)')
        .eq('id_sueldo', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener sueldo por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearSueldo(sueldo) {
    try {
      const { data, error } = await this.supabase
        .from('sueldo')
        .insert([sueldo]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear sueldo:', error);
      return { success: false, error: error.message };
    }
  }

  async editarSueldo(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('sueldo')
        .update(nuevosDatos)
        .eq('id_sueldo', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar sueldo:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarSueldo(id) {
    try {
      const { data, error } = await this.supabase
        .from('sueldo')
        .delete()
        .eq('id_sueldo', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar sueldo:', error);
      return { success: false, error: error.message };
    }
  }
}

const sueldoService = new SueldoService();
export default sueldoService;
