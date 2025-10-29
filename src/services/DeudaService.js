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

  // ================== LIBÉLULA INTEGRACIÓN ==================
  async marcarComoPagada(idDeuda, idPago) {
    try {
      if (!idDeuda) {
        return { success: false, error: 'idDeuda requerido' };
      }
      const { data, error } = await this.supabase
        .from('deuda')
        .update({ estado: 'Pagado' })
        .eq('id_deuda', idDeuda)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al marcar deuda como pagada:', error);
      return { success: false, error: error.message };
    }
  }

  async verificarEstadoDeuda(idDeuda) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .select('id_deuda, estado, id_pago, fecha_pago')
        .eq('id_deuda', idDeuda)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al verificar estado de deuda:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async obtenerDeudasConPagos(idPersona) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .select('*, pago(*)')
        .eq('id_persona', idPersona)
        .order('id_deuda');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener deudas con pagos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async buscarPorConcepto(id_persona, concepto) {
    try {
      const q = this.supabase
        .from('deuda')
        .select('id_deuda')
        .eq('id_persona', id_persona)
        .eq('concepto', concepto)
        .limit(1);

      let data, error;
      if (typeof q.maybeSingle === 'function') {
        ({ data, error } = await q.maybeSingle());
        if (error) throw error;
        return { success: true, data: data || null };
      } else {
        ({ data, error } = await q);
        if (error) throw error;
        return { success: true, data: (data && data[0]) || null };
      }
    } catch (error) {
      console.error('Error al buscar deuda por concepto:', error);
      return { success: false, error: error.message, data: null };
    }
  }
}

const deudaService = new DeudaService();
export default deudaService;
