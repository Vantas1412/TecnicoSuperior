// src/services/DashboardService.js
import supabase from './dbConnection.js';

class DashboardService {
  constructor() {
    this.supabase = supabase;
  }

  // Método genérico para ejecutar consultas
  async executeQuery(queryBuilder) {
    try {
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error en la consulta:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Métodos CORREGIDOS - solo aplicar filtro año donde la vista tenga columna año
  async getAreasConcurridas() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_areas_concurridas')
      .select('*')
      .order('nro_visitas', { ascending: false });
    
    return this.executeQuery(query);
  }

  async getConsumoPorHora() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_consumo_por_hora')
      .select('*')
      .order('hora_24', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getDeudasConNombres() {
    const query = this.supabase
      .from('vista_deudas_con_nombres')
      .select('*')
      .order('monto', { ascending: false });
    
    return this.executeQuery(query);
  }

  async getSueldosConNombres() {
    const query = this.supabase
      .from('vista_sueldos_con_nombres')
      .select('*')
      .order('monto', { ascending: false });
    
    return this.executeQuery(query);
  }

  async getEstacionamientoEntradaPorHora() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_estacionamiento_entrada_por_hora')
      .select('*')
      .order('hora24', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getEstacionamientoSalidaPorHora() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_estacionamiento_salida_por_hora')
      .select('*')
      .order('hora24', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getEstacionamientoPorDiaSemana() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_estacionamiento_por_dia_semana')
      .select('*');
    
    return this.executeQuery(query);
  }

  async getEstacionamientoSalidaPorDiaSemana() {
    // ESTA VISTA NO TIENE AÑO - eliminar filtro
    const query = this.supabase
      .from('vista_estacionamiento_salida_por_dia_semana')
      .select('*');
    
    return this.executeQuery(query);
  }

  async getPagosPorMesYAnio(anio = null) {
    // ESTA VISTA SÍ TIENE AÑO - mantener filtro
    let query = this.supabase
      .from('vista_pagos_por_mes_y_anio')
      .select('*');
    
    if (anio) {
      query = query.eq('anio', anio);
    }
    
    query = query.order('anio', { ascending: true })
                .order('mes', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getVisitasPorMesYAnio(anio = null) {
    // ESTA VISTA SÍ TIENE AÑO - mantener filtro
    let query = this.supabase
      .from('vista_visitas_por_mes_y_anio')
      .select('*');
    
    if (anio) {
      query = query.eq('anio', anio);
    }
    
    query = query.order('anio', { ascending: true })
                .order('mes', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getVisitasPorDiaMesAnio(anio = null) {
    // ESTA VISTA SÍ TIENE AÑO - mantener filtro
    let query = this.supabase
      .from('vista_visitas_por_dia_mes_anio')
      .select('*');
    
    if (anio) {
      query = query.eq('anio', anio);
    }
    
    query = query.order('anio', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getGastosTotales(anio = null) {
    // ESTA VISTA SÍ TIENE AÑO - mantener filtro
    let query = this.supabase
      .from('vista_gastos_totales')
      .select('*');
    
    if (anio) {
      query = query.eq('anio', anio);
    }
    
    query = query.order('anio', { ascending: true })
                .order('mes', { ascending: true });
    
    return this.executeQuery(query);
  }

  async getIngresosTotales(anio = null) {
    // ESTA VISTA SÍ TIENE AÑO - mantener filtro
    let query = this.supabase
      .from('vista_ingresos_totales')
      .select('*');
    
    if (anio) {
      query = query.eq('anio', anio);
    }
    
    query = query.order('anio', { ascending: true })
                .order('mes', { ascending: true });
    
    return this.executeQuery(query);
  }

  // Obtener años disponibles SOLO de vistas que tienen año
  async getAniosDisponibles() {
    try {
      // Solo obtener años de vistas que tienen columna año
      const [pagos, visitas, gastos, ingresos] = await Promise.all([
        this.supabase.from('vista_pagos_por_mes_y_anio').select('anio'),
        this.supabase.from('vista_visitas_por_mes_y_anio').select('anio'),
        this.supabase.from('vista_gastos_totales').select('anio'),
        this.supabase.from('vista_ingresos_totales').select('anio')
      ]);

      // Combinar todos los años y eliminar duplicados
      const todosLosAnios = [
        ...(pagos.data || []),
        ...(visitas.data || []),
        ...(gastos.data || []),
        ...(ingresos.data || [])
      ].map(item => item.anio);

      const aniosUnicos = [...new Set(todosLosAnios)].sort((a, b) => b - a);
      
      return { success: true, data: aniosUnicos };
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Métodos para estadísticas generales (sin cambios)
  async getEstadisticasGenerales() {
    try {
      const [
        totalResidentes,
        totalEmpleados,
        totalTickets,
        ticketsPendientes,
        totalDepartamentos,
        deptosOcupados
      ] = await Promise.all([
        this.supabase.from('residente').select('id_residente', { count: 'exact', head: true }),
        this.supabase.from('empleado').select('id_empleado', { count: 'exact', head: true }),
        this.supabase.from('ticket').select('id_ticket', { count: 'exact', head: true }),
        this.supabase.from('ticket').select('id_ticket', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        this.supabase.from('departamento').select('id_departamento', { count: 'exact', head: true }),
        this.supabase.from('vive').select('id_vive', { count: 'exact', head: true }).is('fecha_fin', null)
      ]);

      return {
        success: true,
        data: {
          totalResidentes: totalResidentes.count || 0,
          totalEmpleados: totalEmpleados.count || 0,
          totalTickets: totalTickets.count || 0,
          ticketsPendientes: ticketsPendientes.count || 0,
          totalDepartamentos: totalDepartamentos.count || 0,
          deptosOcupados: deptosOcupados.count || 0,
          deptosDisponibles: (totalDepartamentos.count || 0) - (deptosOcupados.count || 0)
        }
      };
    } catch (error) {
      console.error('Error al obtener estadísticas generales:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  async getTicketsRecientes(limite = 5) {
    try {
      const { data, error } = await this.supabase
        .from('ticket')
        .select(`
          *,
          persona!ticket_id_persona_fkey (nombre, apellido),
          servicio!ticket_id_servicio_fkey (tipo_servicio),
          empleado!ticket_id_empleado_fkey (persona!empleado_id_persona_fkey (nombre, apellido))
        `)
        .order('fecha', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener tickets recientes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getResidentesRecientes(limite = 5) {
    try {
      const { data, error } = await this.supabase
        .from('residente')
        .select(`
          *,
          persona!residente_id_persona_fkey (nombre, apellido, email, telefono)
        `)
        .order('fecha_registro', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener residentes recientes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getDistribucionResidentes() {
    try {
      const { data, error } = await this.supabase
        .from('residente')
        .select('estado');
      
      if (error) throw error;

      const distribucion = data.reduce((acc, residente) => {
        acc[residente.estado] = (acc[residente.estado] || 0) + 1;
        return acc;
      }, {});

      return {
        success: true,
        data: distribucion
      };
    } catch (error) {
      console.error('Error al obtener distribución de residentes:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  // Método principal CORREGIDO - solo pasar año a vistas que lo soportan
  async fetchDataForView(vistaName, anio = null) {
    const queryMap = {
      // Vistas SIN año - no pasar parámetro anio
      'vista_areas_concurridas': () => this.getAreasConcurridas(),
      'vista_consumo_por_hora': () => this.getConsumoPorHora(),
      'vista_deudas_con_nombres': () => this.getDeudasConNombres(),
      'vista_sueldos_con_nombres': () => this.getSueldosConNombres(),
      'vista_estacionamiento_entrada_por_hora': () => this.getEstacionamientoEntradaPorHora(),
      'vista_estacionamiento_salida_por_hora': () => this.getEstacionamientoSalidaPorHora(),
      'vista_estacionamiento_por_dia_semana': () => this.getEstacionamientoPorDiaSemana(),
      'vista_estacionamiento_salida_por_dia_semana': () => this.getEstacionamientoSalidaPorDiaSemana(),
      
      // Vistas CON año - pasar parámetro anio
      'vista_pagos_por_mes_y_anio': () => this.getPagosPorMesYAnio(anio),
      'vista_visitas_por_mes_y_anio': () => this.getVisitasPorMesYAnio(anio),
      'vista_visitas_por_dia_mes_anio': () => this.getVisitasPorDiaMesAnio(anio),
      'vista_gastos_totales': () => this.getGastosTotales(anio),
      'vista_ingresos_totales': () => this.getIngresosTotales(anio),
      
      // Aliases sin prefijo 'vista_' para compatibilidad
      'areas_concurridas': () => this.getAreasConcurridas(),
      'consumo_por_hora': () => this.getConsumoPorHora(),
      'deudas_con_nombres': () => this.getDeudasConNombres(),
      'sueldos_con_nombres': () => this.getSueldosConNombres(),
      'estacionamiento_entrada_por_hora': () => this.getEstacionamientoEntradaPorHora(),
      'estacionamiento_salida_por_hora': () => this.getEstacionamientoSalidaPorHora(),
      'estacionamiento_por_dia_semana': () => this.getEstacionamientoPorDiaSemana(),
      'estacionamiento_salida_por_dia_semana': () => this.getEstacionamientoSalidaPorDiaSemana(),
      'pagos_por_mes_y_anio': () => this.getPagosPorMesYAnio(anio),
      'visitas_por_mes_y_anio': () => this.getVisitasPorMesYAnio(anio),
      'visitas_por_dia_mes_anio': () => this.getVisitasPorDiaMesAnio(anio),
      'gastos_totales': () => this.getGastosTotales(anio),
      'ingresos_totales': () => this.getIngresosTotales(anio),

      // Métodos adicionales para el dashboard
      'estadisticas_generales': () => this.getEstadisticasGenerales(),
      'tickets_recientes': () => this.getTicketsRecientes(),
      'residentes_recientes': () => this.getResidentesRecientes(),
      'distribucion_residentes': () => this.getDistribucionResidentes(),
      'anios_disponibles': () => this.getAniosDisponibles()
    };

    const queryFunction = queryMap[vistaName];
    if (!queryFunction) {
      return {
        success: false,
        error: `Vista o consulta no encontrada: ${vistaName}`,
        data: []
      };
    }

    return await queryFunction();
  }

  // Método para obtener múltiples datos del dashboard
  async getDashboardData(anio = null) {
    try {
      const [
        estadisticas,
        ticketsRecientes,
        residentesRecientes,
        ingresosTotales,
        gastosTotales,
        areasConcurridas,
        estacionamientoDia,
        aniosDisponibles
      ] = await Promise.all([
        this.getEstadisticasGenerales(),
        this.getTicketsRecientes(5),
        this.getResidentesRecientes(5),
        this.getIngresosTotales(anio),
        this.getGastosTotales(anio),
        this.getAreasConcurridas(),
        this.getEstacionamientoPorDiaSemana(),
        this.getAniosDisponibles()
      ]);

      return {
        success: true,
        data: {
          estadisticas: estadisticas.success ? estadisticas.data : {},
          ticketsRecientes: ticketsRecientes.success ? ticketsRecientes.data : [],
          residentesRecientes: residentesRecientes.success ? residentesRecientes.data : [],
          ingresosTotales: ingresosTotales.success ? ingresosTotales.data : [],
          gastosTotales: gastosTotales.success ? gastosTotales.data : [],
          areasConcurridas: areasConcurridas.success ? areasConcurridas.data : [],
          estacionamientoDia: estacionamientoDia.success ? estacionamientoDia.data : [],
          aniosDisponibles: aniosDisponibles.success ? aniosDisponibles.data : []
        }
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      return { success: false, error: error.message, data: {} };
    }
  }
}

// Exportar una instancia única (Singleton)
const dashboardService = new DashboardService();
export default dashboardService;