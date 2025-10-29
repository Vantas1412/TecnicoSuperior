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
      // Sanitizar y limitar columnas para evitar choques de tipo
      const concepto = (pago?.concepto || 'Pago').toString();
      const descripcion = (pago?.descripcion || '').toString();
      const monto = Number(pago?.monto || 0);
      const metodo_pago = pago?.metodo_pago ? pago.metodo_pago.toString() : null;
      // Generar un id_pago textual seguro (evita números puros para no provocar casts)
      const id_pago = `PG-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      // Fecha obligatoria: usar YYYY-MM-DD
      const fechaStr = pago?.fecha
        ? new Date(pago.fecha).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      // Evitar enviar fecha para no forzar casteos; dejar que la BD maneje default/null
      let payload = { id_pago, concepto, descripcion, monto, fecha: fechaStr };
      if (metodo_pago) payload.metodo_pago = metodo_pago;

      let { data, error } = await this.supabase
        .from('pago')
        .insert([payload]);

      if (error) {
        console.warn('[PagoService] crearPago insert con payload completo falló, probando reducido:', error?.message);
        // Fallback mínimo
        payload = { id_pago, concepto, monto, fecha: fechaStr };
        const res2 = await this.supabase
          .from('pago')
          .insert([payload]);
        data = res2.data; error = res2.error;
      }
      if (error) throw error;
      // Devolvemos el id generado para enlazar en 'realiza'
      return { success: true, data: [{ id_pago, concepto, descripcion, monto, metodo_pago }] };
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

  // Registra un pago (simulado) en la tabla pago
  async registrarPagoLibelula(deuda, ordenLibelula, estadoPago, usuario) {
    try {
      // Payload mínimo para evitar choques con columnas inexistentes o tipos
      // Nota: evitamos enviar 'fecha' si tu tabla la calcula por defecto.
      const id_pago = `PG-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      const fechaStr = new Date().toISOString().slice(0, 10);
      let payload = {
        id_pago,
        concepto: deuda?.concepto || 'Pago de servicios',
        descripcion: deuda?.descripcion || '',
        monto: Number(deuda?.monto || 0),
        fecha: fechaStr
      };

      // Primer intento con (id_pago, concepto, descripcion, monto)
      let { data, error } = await this.supabase
        .from('pago')
        .insert([payload]);

      // Fallback: intenta solo (concepto, monto) si falló por tipos/columnas
      if (error) {
        console.warn('[PagoService] Insert básico falló, intentando payload reducido:', error?.message);
        payload = {
          id_pago,
          concepto: deuda?.concepto || 'Pago de servicios',
          monto: Number(deuda?.monto || 0),
          fecha: fechaStr
        };
        const res2 = await this.supabase
          .from('pago')
          .insert([payload]);
        data = res2.data; error = res2.error;
      }

      // Si se creó el pago, vincular al pagador en tabla 'realiza' (persistencia para Reportes)
      if (!error && (usuario?.persona?.id_persona || usuario?.id_persona)) {
        const id_pagador = usuario?.persona?.id_persona || usuario?.id_persona;
        try {
          await this.supabase
            .from('realiza')
            .insert([{ id_pagador, id_pago }]);
        } catch (linkErr) {
          console.warn('No se pudo vincular pago a pagador (realiza):', linkErr?.message);
        }
      }

      if (error) throw error;
      return { success: true, data: { id_pago } };
    } catch (error) {
      console.error('Error al registrar pago Libélula:', error);
      return { success: false, error: error.message };
    }
  }

  // Vincula un pago con una deuda y marca campos básicos
  async vincularPagoADeuda(idDeuda, idPago) {
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
      console.error('Error al vincular pago a deuda:', error);
      return { success: false, error: error.message };
    }
  }

  // Integración Libélula removida: métodos de búsqueda por transacción externa no utilizados

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
