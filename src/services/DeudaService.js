import supabase from './dbConnection.js';

class DeudaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerDeudas() {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .select('*, persona(*)')
        .order('id_deuda');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener deudas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerDeudaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .select('*, persona(*)')
        .eq('id_deuda', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener deuda por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearDeuda(deuda) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .insert([deuda]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear deuda:', error);
      return { success: false, error: error.message };
    }
  }

  async editarDeuda(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .update(nuevosDatos)
        .eq('id_deuda', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar deuda:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarDeuda(id) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .delete()
        .eq('id_deuda', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar deuda:', error);
      return { success: false, error: error.message };
    }
  }
}

const deudaService = new DeudaService();
export default deudaService;
