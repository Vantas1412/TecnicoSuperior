import supabase from './dbConnection.js';

class VisitaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerVisitas() {
    try {
      const { data, error } = await this.supabase
        .from('visita')
        .select('*')
        .order('id_visita');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener visitas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerVisitaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('visita')
        .select('*')
        .eq('id_visita', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener visita por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearVisita(visita) {
    try {
      const { data, error } = await this.supabase
        .from('visita')
        .insert([visita]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear visita:', error);
      return { success: false, error: error.message };
    }
  }

  async editarVisita(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('visita')
        .update(nuevosDatos)
        .eq('id_visita', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar visita:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarVisita(id) {
    try {
      const { data, error } = await this.supabase
        .from('visita')
        .delete()
        .eq('id_visita', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar visita:', error);
      return { success: false, error: error.message };
    }
  }
}

const visitaService = new VisitaService();
export default visitaService;
