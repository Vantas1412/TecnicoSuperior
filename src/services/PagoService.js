import supabase from './dbConnection.js';

class PagoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerPagos() {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .select('*')
        .order('id_pago');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener pagos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerPagoPorId(id_pago) {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .select('*')
        .eq('id_pago', id_pago)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener pago por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearPago(pago) {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .insert([pago]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear pago:', error);
      return { success: false, error: error.message };
    }
  }

  async editarPago(id_pago, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .update(nuevosDatos)
        .eq('id_pago', id_pago);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar pago:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarPago(id_pago) {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .delete()
        .eq('id_pago', id_pago);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      return { success: false, error: error.message };
    }
  }
}

const pagoService = new PagoService();
export default pagoService;
