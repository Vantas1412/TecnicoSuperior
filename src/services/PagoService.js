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

  // ================== LIBÉLULA INTEGRACIÓN ==================

  // Registra un pago resultado de Libélula en la tabla pago
  async registrarPagoLibelula(deuda, ordenLibelula, estadoPago, usuario) {
    try {
      const nuevoPago = {
        concepto: deuda.concepto,
        descripcion: deuda.descripcion,
        monto: deuda.monto,
        metodo_pago: ordenLibelula?.metodo === 'QR' ? 'Código QR' : 'Tarjeta',
        id_pagador: usuario?.id_persona || usuario?.persona?.id_persona || null,
        id_beneficiario: 1, // TODO: parametrizar o tomar del contexto
        id_transaccion_externa: ordenLibelula?.orden_id || estadoPago?.transaccion_id || null,
        estado: estadoPago?.estado || 'Pendiente',
        fecha: new Date()
      };

      const { data, error } = await this.supabase
        .from('pago')
        .insert([nuevoPago])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar pago Libélula:', error);
      return { success: false, error: error.message };
    }
  }

  // Vincula un pago con una deuda y marca campos básicos
  async vincularPagoADeuda(idDeuda, idPago) {
    try {
      const { data, error } = await this.supabase
        .from('deuda')
        .update({
          estado: 'Pagado',
          id_pago: idPago,
          fecha_pago: new Date()
        })
        .eq('id_deuda', idDeuda)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al vincular pago a deuda:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtiene un pago por el ID de orden/transacción externa (Libélula)
  async obtenerPagoPorOrdenLibelula(ordenId) {
    try {
      const { data, error } = await this.supabase
        .from('pago')
        .select('*')
        .eq('id_transaccion_externa', ordenId)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener pago por orden Libélula:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // Genera un objeto con datos consolidados para el comprobante
  async generarDatosComprobante(idPago) {
    try {
      const { data: pago, error } = await this.supabase
        .from('pago')
        .select('*, persona:persona!pago_id_pagador_fkey(nombre, apellido, ci)')
        .eq('id_pago', idPago)
        .single();
      if (error) throw error;

      const comprobante = {
        id_transaccion: pago.id_transaccion_externa || `PAGO-${pago.id_pago}`,
        fecha: pago.fecha || new Date().toISOString(),
        concepto: pago.concepto,
        monto: Number(pago.monto || 0),
        metodo: pago.metodo_pago,
        pagador: pago.persona ? `${pago.persona.nombre} ${pago.persona.apellido}` : '',
        ci: pago.persona?.ci || ''
      };
      return { success: true, data: comprobante };
    } catch (error) {
      console.error('Error generando datos de comprobante:', error);
      return { success: false, error: error.message };
    }
  }
}

const pagoService = new PagoService();
export default pagoService;
