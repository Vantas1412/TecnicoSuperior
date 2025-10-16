import supabase from './dbConnection.js';

class EntradaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerEntradas() {
    try {
      const { data, error } = await this.supabase
        .from('entrada')
        .select('*, persona(*)')
        .order('id_entrada');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener entradas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerEntradaPorId(id_entrada) {
    try {
      const { data, error } = await this.supabase
        .from('entrada')
        .select('*, persona(*)')
        .eq('id_entrada', id_entrada)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener entrada por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearEntrada(entrada) {
    try {
      const { data, error } = await this.supabase
        .from('entrada')
        .insert([entrada]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear entrada:', error);
      return { success: false, error: error.message };
    }
  }

  async editarEntrada(id_entrada, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('entrada')
        .update(nuevosDatos)
        .eq('id_entrada', id_entrada);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar entrada:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarEntrada(id_entrada) {
    try {
      const { data, error } = await this.supabase
        .from('entrada')
        .delete()
        .eq('id_entrada', id_entrada);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar entrada:', error);
      return { success: false, error: error.message };
    }
  }
}

const entradaService = new EntradaService();
export default entradaService;
