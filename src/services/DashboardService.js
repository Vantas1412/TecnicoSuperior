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

  // ============================
  // NUEVO: RPC - Funciones SQL
  // ============================

  /**
   * Llama a la función SQL:
   *   obtener_registros_medidor(p_id_persona VARCHAR, p_tipo VARCHAR)
   * Devuelve: [ { tipo, lectura, unidad, hora, fecha }, ... ]
   */
  async getRegistrosMedidor({ idPersona, tipo }) {
    if (!idPersona || !tipo) {
      return { success: false, error: 'Parámetros faltantes: idPersona y tipo son requeridos.', data: [] };
    }

    try {
      const { data, error } = await this.supabase.rpc('obtener_registros_medidor', {
        p_id_persona: idPersona,
        p_tipo: tipo
      });
      if (error) throw error;

      // Orden opcional por fecha/hora ascendente
      const ordenado = (data || []).sort((a, b) => {
        const fa = `${a.fecha} ${a.hora}`; const fb = `${b.fecha} ${b.hora}`;
        return new Date(fa) - new Date(fb);
      });

      return { success: true, data: ordenado };
    } catch (e) {
      console.error('Error al obtener registros de medidor:', e);
      return { success: false, error: e.message, data: [] };
    }
  }

  /**
   * Llama a la función SQL:
   *   obtener_visitas_mensuales_por_persona(p_id_persona VARCHAR)
   * Devuelve: [ { nombre_area, anio, mes, total_visitas }, ... ]
   */
  async getVisitasMensualesPorPersona({ idPersona }) {
    if (!idPersona) {
      return { success: false, error: 'Parámetro faltante: idPersona es requerido.', data: [] };
    }

    try {
      const { data, error } = await this.supabase.rpc('obtener_visitas_mensuales_por_persona', {
        p_id_persona: idPersona
      });
      if (error) throw error;

      // Ya viene ordenado por (anio DESC, mes DESC, total_visitas DESC) desde SQL,
      // pero por si acaso normalizamos a (anio ASC, mes ASC) para gráficos de series.
      const normalizado = (data || []).slice().sort((a, b) => {
        if (a.anio !== b.anio) return a.anio - b.anio;
        return a.mes - b.mes;
      });

      return { success: true, data: normalizado };
    } catch (e) {
      console.error('Error al obtener visitas mensuales por persona:', e);
      return { success: false, error: e.message, data: [] };
    }
  }

  // ============================
  // Vistas (sin cambios lógicos)
  // ============================

  async getAreasConcurridas() {
    const query = this.supabase
      .from('vista_areas_concurridas')
      .select('*')
      .order('nro_visitas', { ascending: false });
    return this.executeQuery(query);
  }

  async getConsumoPorHora() {
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
    const query = this.supabase
      .from('vista_estacionamiento_entrada_por_hora')
      .select('*')
      .order('hora24', { ascending: true });
    return this.executeQuery(query);
  }

  async getEstacionamientoSalidaPorHora() {
    const query = this.supabase
      .from('vista_estacionamiento_salida_por_hora')
      .select('*')
      .order('hora24', { ascending: true });
    return this.executeQuery(query);
  }

  async getEstacionamientoPorDiaSemana() {
    const query = this.supabase
      .from('vista_estacionamiento_por_dia_semana')
      .select('*');
    return this.executeQuery(query);
  }

  async getEstacionamientoSalidaPorDiaSemana() {
    const query = this.supabase
      .from('vista_estacionamiento_salida_por_dia_semana')
      .select('*');
    return this.executeQuery(query);
  }

  async getPagosPorMesYAnio(anio = null) {
    let query = this.supabase.from('vista_pagos_por_mes_y_anio').select('*');
    if (anio) query = query.eq('anio', anio);
    query = query.order('anio', { ascending: true }).order('mes', { ascending: true });
    return this.executeQuery(query);
  }

  async getVisitasPorMesYAnio(anio = null) {
    let query = this.supabase.from('vista_visitas_por_mes_y_anio').select('*');
    if (anio) query = query.eq('anio', anio);
    query = query.order('anio', { ascending: true }).order('mes', { ascending: true });
    return this.executeQuery(query);
  }

  async getVisitasPorDiaMesAnio(anio = null) {
    let query = this.supabase.from('vista_visitas_por_dia_mes_anio').select('*');
    if (anio) query = query.eq('anio', anio);
    query = query.order('anio', { ascending: true });
    return this.executeQuery(query);
  }

  async getGastosTotales(anio = null) {
    let query = this.supabase.from('vista_gastos_totales').select('*');
    if (anio) query = query.eq('anio', anio);
    query = query.order('anio', { ascending: true }).order('mes', { ascending: true });
    return this.executeQuery(query);
  }

  async getIngresosTotales(anio = null) {
    let query = this.supabase.from('vista_ingresos_totales').select('*');
    if (anio) query = query.eq('anio', anio);
    query = query.order('anio', { ascending: true }).order('mes', { ascending: true });
    return this.executeQuery(query);
  }

  // Obtener años disponibles SOLO de vistas que tienen año
  async getAniosDisponibles() {
    try {
      const [pagos, visitas, gastos, ingresos] = await Promise.all([
        this.supabase.from('vista_pagos_por_mes_y_anio').select('anio'),
        this.supabase.from('vista_visitas_por_mes_y_anio').select('anio'),
        this.supabase.from('vista_gastos_totales').select('anio'),
        this.supabase.from('vista_ingresos_totales').select('anio')
      ]);

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

  // Estadísticas generales
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

      return { success: true, data: distribucion };
    } catch (error) {
      console.error('Error al obtener distribución de residentes:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  // ============================
  // NUEVO: fetchDataForView flexible
  // ============================
  /**
   * Soporta:
   *  - fetchDataForView('vista_pagos_por_mes_y_anio', 2025)
   *  - fetchDataForView('obtener_registros_medidor', { idPersona: 'AC001', tipo: 'Agua' })
   *  - fetchDataForView('obtener_visitas_mensuales_por_persona', { idPersona: 'AC001' })
   */
  async fetchDataForView(vistaName, params = null) {
    // Compatibilidad: si params es número, se asume que es "anio"
    const anio = typeof params === 'number' ? params : params?.anio ?? null;

    const queryMap = {
      // Vistas SIN año
      'vista_areas_concurridas': () => this.getAreasConcurridas(),
      'vista_consumo_por_hora': () => this.getConsumoPorHora(),
      'vista_deudas_con_nombres': () => this.getDeudasConNombres(),
      'vista_sueldos_con_nombres': () => this.getSueldosConNombres(),
      'vista_estacionamiento_entrada_por_hora': () => this.getEstacionamientoEntradaPorHora(),
      'vista_estacionamiento_salida_por_hora': () => this.getEstacionamientoSalidaPorHora(),
      'vista_estacionamiento_por_dia_semana': () => this.getEstacionamientoPorDiaSemana(),
      'vista_estacionamiento_salida_por_dia_semana': () => this.getEstacionamientoSalidaPorDiaSemana(),

      // Vistas CON año
      'vista_pagos_por_mes_y_anio': () => this.getPagosPorMesYAnio(anio),
      'vista_visitas_por_mes_y_anio': () => this.getVisitasPorMesYAnio(anio),
      'vista_visitas_por_dia_mes_anio': () => this.getVisitasPorDiaMesAnio(anio),
      'vista_gastos_totales': () => this.getGastosTotales(anio),
      'vista_ingresos_totales': () => this.getIngresosTotales(anio),

      // Aliases sin 'vista_'
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

      // Datos del dashboard
      'estadisticas_generales': () => this.getEstadisticasGenerales(),
      'tickets_recientes': () => this.getTicketsRecientes(),
      'residentes_recientes': () => this.getResidentesRecientes(),
      'distribucion_residentes': () => this.getDistribucionResidentes(),
      'anios_disponibles': () => this.getAniosDisponibles(),

      // NUEVO: RPC
      'obtener_registros_medidor': () =>
        this.getRegistrosMedidor({ idPersona: params?.idPersona, tipo: params?.tipo }),
      'obtener_visitas_mensuales_por_persona': () =>
        this.getVisitasMensualesPorPersona({ idPersona: params?.idPersona }),
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

  // ============================
  // Dashboard compuesto
  // ============================
  /**
   * getDashboardData({
   *   anio: 2025,
   *   idPersona: 'AC001',
   *   tipoMedidor: 'Agua' // o 'Luz', 'Gas' según tu tabla medidor.tipo
   * })
   */
  async getDashboardData({ anio = null, idPersona = null, tipoMedidor = null } = {}) {
    try {
      const peticiones = [
        this.getEstadisticasGenerales(),
        this.getTicketsRecientes(5),
        this.getResidentesRecientes(5),
        this.getIngresosTotales(anio),
        this.getGastosTotales(anio),
        this.getAreasConcurridas(),
        this.getEstacionamientoPorDiaSemana(),
        this.getAniosDisponibles()
      ];

      // Si envías idPersona, agregamos datasets personalizados
      if (idPersona) {
        peticiones.push(this.getVisitasMensualesPorPersona({ idPersona }));
      } else {
        // mantener lugar para el índice
        peticiones.push(Promise.resolve({ success: true, data: [] }));
      }

      if (idPersona && tipoMedidor) {
        peticiones.push(this.getRegistrosMedidor({ idPersona, tipo: tipoMedidor }));
      } else {
        peticiones.push(Promise.resolve({ success: true, data: [] }));
      }

      const [
        estadisticas,
        ticketsRecientes,
        residentesRecientes,
        ingresosTotales,
        gastosTotales,
        areasConcurridas,
        estacionamientoDia,
        aniosDisponibles,
        visitasMensualesPersona,
        registrosMedidorPersona
      ] = await Promise.all(peticiones);

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
          aniosDisponibles: aniosDisponibles.success ? aniosDisponibles.data : [],

          // NUEVO: datasets personalizados por persona
          visitasMensualesPersona: visitasMensualesPersona.success ? visitasMensualesPersona.data : [],
          registrosMedidorPersona: registrosMedidorPersona.success ? registrosMedidorPersona.data : []
        }
      };
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  async obtenerEmpresaPorServicio(idServicio) {
    try {
      const { data, error } = await this.supabase
        .from('empresa_servicio')
        .select(`
          id_servicio,
          empresa:empresa ( id_empresa, nombre )
        `)
        .eq('id_servicio', idServicio); // <- sin .single()

      if (error) throw error;
      return { success: true, data }; // array de empresas
    } catch (e) {
      console.error('Error al obtener empresa por servicio:', e);
      return { success: false, error: e.message, data: [] };
    }
  }
    // ============================
  // NUEVO: Horas extra por día (para gráficos)
  // SQL: fn_horas_extra_por_dia(p_id_empleado TEXT, p_desde DATE, p_hasta DATE)
  // shape: 'raw'    -> devuelve tal cual viene de SQL
  //        'recharts' -> [{ name:'YYYY-MM-DD', horas_extra:Number }]
  // ============================
  async getHorasExtraPorDia({ idEmpleado, desde, hasta, shape = 'raw' }) {
    if (!idEmpleado || !desde || !hasta) {
      return { success: false, error: 'Parámetros requeridos: idEmpleado, desde, hasta', data: [] };
    }
    try {
      const { data, error } = await this.supabase.rpc('fn_horas_extra_por_dia', {
        p_id_empleado: idEmpleado,
        p_desde: desde,
        p_hasta: hasta
      });
      if (error) throw error;

      const ordenado = (data || []).slice().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      if (shape === 'recharts') {
        const serie = ordenado.map(d => ({
          name: d.fecha,                         // eje X
          horas_extra: Number(d.horas_extra ?? 0) // eje Y
        }));
        return { success: true, data: serie };
      }

      return { success: true, data: ordenado };
    } catch (e) {
      console.error('Error al obtener horas extra por día:', e);
      return { success: false, error: e.message, data: [] };
    }
  }

  // ============================
  // NUEVO: Veces tarde por mes (para gráficos)
  // SQL: fn_veces_tarde_por_mes(p_id_empleado TEXT, p_desde DATE, p_hasta DATE)
  // shape: 'raw'      -> tal cual SQL
  //        'recharts' -> [{ name:'YYYY-MM', veces_tarde:Number }]
  // ============================
  async getVecesTardePorMes({ idEmpleado, desde, hasta, shape = 'raw' }) {
    if (!idEmpleado || !desde || !hasta) {
      return { success: false, error: 'Parámetros requeridos: idEmpleado, desde, hasta', data: [] };
    }
    try {
      const { data, error } = await this.supabase.rpc('fn_veces_tarde_por_mes', {
        p_id_empleado: idEmpleado,
        p_desde: desde,
        p_hasta: hasta
      });
      if (error) throw error;

      // Normaliza a YYYY-MM ascendente para gráficos de barras/áreas
      const ordenado = (data || []).slice().sort((a, b) => {
        if (a.anio !== b.anio) return a.anio - b.anio;
        return a.mes - b.mes;
      });

      if (shape === 'recharts') {
        const pad2 = (n) => String(n).padStart(2, '0');
        const serie = ordenado.map(d => ({
          name: `${d.anio}-${pad2(d.mes)}`,              // eje X
          veces_tarde: Number(d.veces_tarde ?? 0)        // eje Y
        }));
        return { success: true, data: serie };
      }

      return { success: true, data: ordenado };
    } catch (e) {
      console.error('Error al obtener veces tarde por mes:', e);
      return { success: false, error: e.message, data: [] };
    }
  }

}

// Exportar una instancia única (Singleton)
const dashboardService = new DashboardService();
export default dashboardService;
