import supabase from './dbConnection.js';

class ResidenteService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerResidentes() {
    try {
      const { data, error } = await this.supabase.from('residente').select('*, persona(*)').order('id_residente');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener residentes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerResidentePorId(id_residente) {
    try {
      const { data, error } = await this.supabase.from('residente').select('*, persona(*)').eq('id_residente', id_residente).single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener residente por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearResidente(residente) {
    try {
      const { data, error } = await this.supabase.from('residente').insert([residente]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear residente:', error);
      return { success: false, error: error.message };
    }
  }

  async editarResidente(id_residente, nuevosDatos) {
    try {
      const { data, error } = await this.supabase.from('residente').update(nuevosDatos).eq('id_residente', id_residente);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar residente:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarResidente(id_residente) {
    try {
      const { data, error } = await this.supabase.from('residente').delete().eq('id_residente', id_residente);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar residente:', error);
      return { success: false, error: error.message };
    }
  }
}

const residenteService = new ResidenteService();
export default residenteService;
