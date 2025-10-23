// src/services/AreaComunService.js
import supabase from './dbConnection.js';

class AreaComunService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerAreasComunes() {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .eq('activo', true) // Solo áreas activas
        .order('nombre');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener áreas comunes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerAreaPorId(id_area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .eq('id_area', id_area)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener área común por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearAreaComun(area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .insert([area])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear área común:', error);
      return { success: false, error: error.message };
    }
  }

  async editarAreaComun(id_area, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .update(nuevosDatos)
        .eq('id_area', id_area)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar área común:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarAreaComun(id_area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .delete()
        .eq('id_area', id_area);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar área común:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener áreas activas disponibles para reservar
  async obtenerAreasActivas() {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener áreas activas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Obtener configuración de horarios de un área
  async obtenerConfiguracionHorarios(id_area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('tiempo_limpieza_horas, hora_apertura, hora_cierre, minimo_horas_reserva, costo_hora')
        .eq('id_area', id_area)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener configuración de horarios:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar horarios disponibles para un área en una fecha específica
  async generarHorariosDisponibles(id_area, fecha) {
    try {
      console.log('🔍 Generando horarios para:', { id_area, fecha });
      
      // Obtener configuración del área
      const config = await this.obtenerConfiguracionHorarios(id_area);
      if (!config.success) return config;

      const { hora_apertura, hora_cierre, minimo_horas_reserva, tiempo_limpieza_horas } = config.data;
      console.log('⚙️ Config área:', { hora_apertura, hora_cierre, minimo_horas_reserva, tiempo_limpieza_horas });

      // Obtener horarios ocupados
      const ocupados = await this.obtenerHorariosOcupados(id_area, fecha);
      const horariosOcupados = ocupados.success ? ocupados.data : [];
      console.log('🚫 Horarios ocupados:', horariosOcupados);

      // Generar horarios disponibles de hora en hora
      const horarios = [];
      const horaInicio = parseInt(hora_apertura.split(':')[0]);
      const horaFin = parseInt(hora_cierre.split(':')[0]);
      const tiempoLimpieza = tiempo_limpieza_horas || 1;

      for (let hora = horaInicio; hora <= horaFin - minimo_horas_reserva; hora++) {
        const horaStr = `${hora.toString().padStart(2, '0')}:00:00`;
        
        // Verificar si este horario está ocupado (incluyendo tiempo de limpieza)
        const ocupadoPorReserva = horariosOcupados.some(ocupacion => {
          // Usar hora_fin_con_limpieza para bloquear también el tiempo de limpieza
          const horaFinBloqueo = ocupacion.hora_fin_con_limpieza || ocupacion.hora_fin;
          return horaStr >= ocupacion.hora_inicio && horaStr < horaFinBloqueo;
        });

        // Verificar si hay suficiente espacio para reserva mínima + limpieza antes de la siguiente reserva
        const horaFinMinima = hora + minimo_horas_reserva;
        const horaFinConLimpieza = horaFinMinima + tiempoLimpieza;
        
        const noHayEspacioParaLimpieza = horariosOcupados.some(ocupacion => {
          const horaInicioOcupacion = parseInt(ocupacion.hora_inicio.split(':')[0]);
          // Si hay una reserva que empieza antes de que termine nuestra limpieza, hay conflicto
          return horaInicioOcupacion < horaFinConLimpieza && horaInicioOcupacion >= horaFinMinima;
        });

        horarios.push({
          hora: horaStr,
          disponible: !ocupadoPorReserva && !noHayEspacioParaLimpieza,
          razon: ocupadoPorReserva ? 'Ocupado' : noHayEspacioParaLimpieza ? 'Sin tiempo para limpieza' : null
        });
      }

      console.log('✅ Horarios generados:', horarios);
      return { success: true, data: horarios };
    } catch (error) {
      console.error('Error al generar horarios disponibles:', error);
      return { success: false, error: error.message };
    }
  }

  // En src/services/AreaComunService.js - Actualizar la función
  async obtenerHorariosOcupados(id_area, fecha) {
    try {
      const { data, error } = await this.supabase
        .rpc('obtener_horarios_ocupados', { 
          p_id_area: id_area,
          p_fecha: fecha
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener horarios ocupados:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ==================== MÉTODOS DE ADMINISTRADOR ====================
  
  // Obtener TODAS las áreas (incluyendo inactivas)
  async obtenerTodasAreas() {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener todas las áreas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Activar/Desactivar área
  async activarDesactivarArea(id_area, activo) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .update({ activo })
        .eq('id_area', id_area);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al activar/desactivar área:', error);
      return { success: false, error: error.message };
    }
  }
}

const areaComunService = new AreaComunService();
export default areaComunService;