import supabase from './dbConnection.js';

class MedidorService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerMedidores() {
    try {
      const { data, error } = await this.supabase
        .from('medidor')
        .select('*, departamento(*)')
        .order('id_medidor');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener medidores:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerMedidorPorId(id_medidor) {
    try {
      const { data, error } = await this.supabase
        .from('medidor')
        .select('*, departamento(*)')
        .eq('id_medidor', id_medidor)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener medidor por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearMedidor(medidor) {
    try {
      const { data, error } = await this.supabase
        .from('medidor')
        .insert([medidor]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear medidor:', error);
      return { success: false, error: error.message };
    }
  }

  async editarMedidor(id_medidor, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('medidor')
        .update(nuevosDatos)
        .eq('id_medidor', id_medidor);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar medidor:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarMedidor(id_medidor) {
    try {
      const { data, error } = await this.supabase
        .from('medidor')
        .delete()
        .eq('id_medidor', id_medidor);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar medidor:', error);
      return { success: false, error: error.message };
    }
  }
}

const medidorService = new MedidorService();
export default medidorService;
