import supabase from './dbConnection.js';

class HorarioService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerHorarios() {
    try {
      const { data, error } = await this.supabase
        .from('horario')
        .select('*')
        .order('id_horario');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener horarios:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerHorarioPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('horario')
        .select('*')
        .eq('id_horario', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener horario por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearHorario(horario) {
    try {
      const { data, error } = await this.supabase
        .from('horario')
        .insert([horario]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear horario:', error);
      return { success: false, error: error.message };
    }
  }

  async editarHorario(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('horario')
        .update(nuevosDatos)
        .eq('id_horario', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar horario:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarHorario(id) {
    try {
      const { data, error } = await this.supabase
        .from('horario')
        .delete()
        .eq('id_horario', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      return { success: false, error: error.message };
    }
  }
}

const horarioService = new HorarioService();
export default horarioService;
