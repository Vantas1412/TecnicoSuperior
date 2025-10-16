import supabase from './dbConnection.js';

class ComprobanteService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerComprobantes() {
    try {
      const { data, error } = await this.supabase
        .from('comprobante')
        .select('*, pago(*)')
        .order('id_comprobante');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener comprobantes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerComprobantePorId(id_comprobante) {
    try {
      const { data, error } = await this.supabase
        .from('comprobante')
        .select('*, pago(*)')
        .eq('id_comprobante', id_comprobante)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener comprobante por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearComprobante(comprobante) {
    try {
      const { data, error } = await this.supabase
        .from('comprobante')
        .insert([comprobante]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear comprobante:', error);
      return { success: false, error: error.message };
    }
  }

  async editarComprobante(id_comprobante, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('comprobante')
        .update(nuevosDatos)
        .eq('id_comprobante', id_comprobante);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar comprobante:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarComprobante(id_comprobante) {
    try {
      const { data, error } = await this.supabase
        .from('comprobante')
        .delete()
        .eq('id_comprobante', id_comprobante);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar comprobante:', error);
      return { success: false, error: error.message };
    }
  }
}

const comprobanteService = new ComprobanteService();
export default comprobanteService;
