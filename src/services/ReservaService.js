import supabase from './dbConnection.js';

class ReservaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerReservas() {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .select('*')
        .order('id_reserva');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerReservaPorId(id) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .select('*')
        .eq('id_reserva', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener reserva por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearReserva(reserva) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .insert([reserva]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear reserva:', error);
      return { success: false, error: error.message };
    }
  }

  async editarReserva(id, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update(nuevosDatos)
        .eq('id_reserva', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar reserva:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarReserva(id) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .delete()
        .eq('id_reserva', id);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      return { success: false, error: error.message };
    }
  }

  // Validar disponibilidad de horario usando la función PostgreSQL
  async validarDisponibilidad(idArea, fecha, horaInicio, horaFin, idReservaExcluir = null) {
    try {
      const { data, error } = await this.supabase.rpc('validar_disponibilidad_horario', {
        p_id_area: idArea,
        p_fecha: fecha,
        p_hora_inicio: horaInicio,
        p_hora_fin: horaFin,
        p_id_reserva_excluir: idReservaExcluir
      });
      
      if (error) throw error;
      
      // La función retorna un array con {disponible: boolean, mensaje: text}
      const resultado = data && data.length > 0 ? data[0] : { disponible: false, mensaje: 'Error al validar' };
      
      return { 
        success: true, 
        disponible: resultado.disponible,
        mensaje: resultado.mensaje
      };
    } catch (error) {
      console.error('Error al validar disponibilidad:', error);
      return { success: false, disponible: false, error: error.message };
    }
  }

  // Obtener horarios ocupados para mostrar en el calendario
  async obtenerHorariosOcupados(idArea, fecha) {
    try {
      const { data, error } = await this.supabase.rpc('obtener_horarios_ocupados', {
        p_id_area: idArea,
        p_fecha: fecha
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener horarios ocupados:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear reserva con validación de horario
  async crearReservaConValidacion(reserva) {
    try {
      // Primero validar disponibilidad
      const validacion = await this.validarDisponibilidad(
        reserva.id_registro_area,
        reserva.fecha_reservacion,
        reserva.hora_inicio,
        reserva.hora_fin
      );

      if (!validacion.disponible) {
        return { 
          success: false, 
          error: validacion.mensaje || 'El horario seleccionado no está disponible'
        };
      }

      // Si está disponible, crear la reserva
      const { data, error } = await this.supabase
        .from('reserva')
        .insert([{
          ...reserva,
          estado: reserva.estado || 'Pendiente'
        }])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear reserva:', error);
      return { success: false, error: error.message };
    }
  }

  // Registrar entrega del área común
  async registrarEntregaArea(idReserva, estadoEntrega, descripcion, idEmpleado) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update({
          estado_entrega: estadoEntrega,
          descripcion_entrega: descripcion,
          entregado_a: idEmpleado,
          fecha_entrega: new Date().toISOString(),
          estado: 'Completada'
        })
        .eq('id_reserva', idReserva)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener reservas completas con toda la información (usa la vista)
  async obtenerReservasCompletas(filtros = {}) {
    try {
      let query = this.supabase.from('v_reservas_completas').select('*');

      if (filtros.id_persona) {
        query = query.eq('id_persona', filtros.id_persona);
      }
      if (filtros.id_area) {
        query = query.eq('id_area', filtros.id_area);
      }
      if (filtros.fecha_reservacion) {
        query = query.eq('fecha_reservacion', filtros.fecha_reservacion);
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      // Ordenar por fecha de creación (más recientes primero)
      query = query.order('fecha_creacion', { ascending: false }).order('hora_inicio', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener reservas completas:', error);
      return { success: false, error: error.message };
    }
  }

  // services/ReservaService.js - Agregar este método
  async crearMultiplesReservas(reservas) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .insert(reservas);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear múltiples reservas:', error);
      return { success: false, error: error.message };
    }
  }

  // ==================== MÉTODOS DE ADMINISTRADOR ====================
  
  // Aprobar una reserva
  async aprobarReserva(idReserva) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update({ estado: 'Aprobada' })
        .eq('id_reserva', idReserva);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al aprobar reserva:', error);
      return { success: false, error: error.message };
    }
  }

  // Rechazar una reserva con motivo
  async rechazarReserva(idReserva, motivo) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update({ 
          estado: 'Rechazada',
          descripcion_entrega: motivo // Usando este campo para almacenar el motivo
        })
        .eq('id_reserva', idReserva);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al rechazar reserva:', error);
      return { success: false, error: error.message };
    }
  }

  // Registrar estado de entrega (para empleados)
  async registrarEntrega(idReserva, datosEntrega) {
    try {
      const { data, error } = await this.supabase
        .from('reserva')
        .update({
          estado_entrega: datosEntrega.estado_entrega,
          descripcion_entrega: datosEntrega.descripcion_entrega,
          entregado_a_nombre: datosEntrega.entregado_a_nombre,
          fecha_entrega: datosEntrega.fecha_entrega,
          entregado_por: datosEntrega.entregado_por
        })
        .eq('id_reserva', idReserva);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener estadísticas de reservas
  async obtenerEstadisticas(fechaInicio, fechaFin) {
    try {
      let query = this.supabase
        .from('v_reservas_completas')
        .select('*');
      
      if (fechaInicio) {
        query = query.gte('fecha_reservacion', fechaInicio);
      }
      if (fechaFin) {
        query = query.lte('fecha_reservacion', fechaFin);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calcular estadísticas
      const estadisticas = {
        total: data.length,
        por_estado: {
          pendientes: data.filter(r => r.estado === 'Pendiente').length,
          aprobadas: data.filter(r => r.estado === 'Aprobada').length,
          rechazadas: data.filter(r => r.estado === 'Rechazada').length,
          completadas: data.filter(r => r.estado === 'Completada').length,
          canceladas: data.filter(r => r.estado === 'Cancelada').length
        },
        por_area: {}
      };

      // Agrupar por área
      data.forEach(reserva => {
        const area = reserva.nombre_area;
        if (!estadisticas.por_area[area]) {
          estadisticas.por_area[area] = 0;
        }
        estadisticas.por_area[area]++;
      });

      return { success: true, data: estadisticas };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

const reservaService = new ReservaService();
export default reservaService;
