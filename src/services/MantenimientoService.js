import supabase from './dbConnection.js';

class MantenimientoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerMantenimientos() {
    try {
      const { data, error } = await this.supabase
        .from('mantenimiento')
        .select('*, servicio(*), empleado(*)')
        .order('id_mantenimiento');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener mantenimientos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerMantenimientoPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('mantenimiento')
        .select('*, servicio(*), empleado(*)')
        .eq('id_mantenimiento', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener mantenimiento por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearMantenimiento(mantenimiento) {
    try {
      const { data, error } = await this.supabase
        .from('mantenimiento')
        .insert([mantenimiento]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }

  async editarMantenimiento(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('mantenimiento')
        .update(nuevosDatos)
        .eq('id_mantenimiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarMantenimiento(id) {
    try {
      const { data, error } = await this.supabase
        .from('mantenimiento')
        .delete()
        .eq('id_mantenimiento', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar mantenimiento:', error);
      return { success: false, error: error.message };
    }
  }
}

const mantenimientoService = new MantenimientoService();
export default mantenimientoService;
