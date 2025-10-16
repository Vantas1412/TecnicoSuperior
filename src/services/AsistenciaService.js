// src/services/AsistenciaService.js
import supabase from './dbConnection.js';

class AsistenciaService {
  constructor() {
    this.supabase = supabase;
  }

  // Calcular horas trabajadas entre entrada y salida
  calcularHorasTrabajadas(horaEntrada, horaSalida) {
    if (!horaEntrada || !horaSalida) return 0;
    
    const entrada = new Date(`2000-01-01T${horaEntrada}`);
    const salida = new Date(`2000-01-01T${horaSalida}`);
    
    // Si la salida es menor que la entrada, asumimos que es del día siguiente
    if (salida < entrada) {
      salida.setDate(salida.getDate() + 1);
    }
    
    const diffMs = salida - entrada;
    const horas = diffMs / (1000 * 60 * 60);
    
    return Math.round(horas * 100) / 100; // Redondear a 2 decimales
  }

  // Calcular horas extras (más de 8 horas por día)
  calcularHorasExtras(horasTrabajadas) {
    const horasNormales = 8;
    return Math.max(0, horasTrabajadas - horasNormales);
  }

  // Calcular pago de horas extras (25% más por hora)
  calcularPagoExtras(horasExtras, sueldoBase) {
    const pagoPorHoraNormal = sueldoBase / 30 / 8; // Sueldo diario / 8 horas
    const pagoPorHoraExtra = pagoPorHoraNormal * 1.25; // 25% más
    return Math.round(horasExtras * pagoPorHoraExtra * 100) / 100;
  }

  async obtenerInformesPorEmpleado(id_empleado, mes, anio) {
    try {
      console.log(`Obteniendo informes para empleado ${id_empleado}, ${mes}/${anio}`);
      
      // Obtener asistencias del mes
      const fechaInicio = `${anio}-${mes.toString().padStart(2, '0')}-01`;
      const fechaFin = `${anio}-${mes.toString().padStart(2, '0')}-31`;

      const { data: asistencias, error: errorAsistencias } = await this.supabase
        .from('asistencia_empleado')
        .select('*')
        .eq('id_empleado', id_empleado)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: true });

      if (errorAsistencias) throw errorAsistencias;

      // Obtener información del empleado
      const { data: empleado, error: errorEmpleado } = await this.supabase
        .from('empleado')
        .select('*')
        .eq('id_empleado', id_empleado)
        .single();

      if (errorEmpleado) throw errorEmpleado;

      // Obtener pagos realizados al empleado
      const { data: pagos, error: errorPagos } = await this.supabase
        .from('realiza')
        .select(`
          id_realiza,
          pago (
            monto,
            fecha,
            metodo_pago,
            concepto,
            descripcion
          ),
          persona_pagador:persona!realiza_id_pagador_fkey (
            nombre,
            apellido
          )
        `)
        .eq('id_beneficiario', id_empleado)
        .gte('pago(fecha)', fechaInicio)
        .lte('pago(fecha)', fechaFin);

      if (errorPagos && !errorPagos.message.includes('No results')) {
        console.error('Error obteniendo pagos:', errorPagos);
      }

      // Calcular totales
      let totalHorasTrabajadas = 0;
      let totalHorasExtra = 0;
      let diasTrabajados = 0;

      asistencias.forEach(asistencia => {
        if (asistencia.horas_trabajadas) {
          totalHorasTrabajadas += asistencia.horas_trabajadas;
          totalHorasExtra += asistencia.horas_extra || 0;
          diasTrabajados++;
        }
      });

      // Calcular pagos
      const pagoBase = empleado.sueldo || 2000;
      const pagoExtra = this.calcularPagoExtras(totalHorasExtra, pagoBase);
      const totalPago = pagoBase + pagoExtra;

      // Buscar comprobante si existe
      let comprobanteUrl = null;
      if (pagos && pagos.length > 0) {
        const pagoPrincipal = pagos[0];
        const { data: comprobante } = await this.supabase
          .from('comprobante')
          .select('urlfoto')
          .eq('id_pago', pagoPrincipal.pago.id_pago)
          .single();

        comprobanteUrl = comprobante?.urlfoto;
      }

      const informe = {
        mes: parseInt(mes),
        anio: parseInt(anio),
        horas_trabajadas: Math.round(totalHorasTrabajadas),
        horas_extra: Math.round(totalHorasExtra),
        pago_base: pagoBase,
        pago_extra: pagoExtra,
        total_pago: totalPago,
        estado_pago: pagos && pagos.length > 0 ? 'pagado' : 'pendiente',
        fecha_pago: pagos && pagos.length > 0 ? pagos[0].pago.fecha : null,
        comprobante_url: comprobanteUrl,
        dias_trabajados: diasTrabajados,
        asistencias: asistencias,
        realizaciones: pagos ? pagos.map(pago => ({
          id_realiza: pago.id_realiza,
          pagador: `${pago.persona_pagador?.nombre || 'Administración'} ${pago.persona_pagador?.apellido || 'Condominio'}`,
          beneficiario: empleado.persona ? `${empleado.persona.nombre} ${empleado.persona.apellido}` : 'Empleado',
          metodo_pago: pago.pago.metodo_pago,
          nro_cuenta: empleado.nro_cuenta || '****1234',
          monto: pago.pago.monto,
          concepto: pago.pago.concepto,
          fecha_pago: pago.pago.fecha
        })) : []
      };

      return { success: true, data: [informe] };

    } catch (error) {
      console.error('Error obteniendo informes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async registrarAsistencia(id_empleado, tipoRegistro) {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const ahora = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

      // Buscar si ya existe registro para hoy
      const { data: registroExistente, error: errorBusqueda } = await this.supabase
        .from('asistencia_empleado')
        .select('*')
        .eq('id_empleado', id_empleado)
        .eq('fecha', hoy)
        .single();

      let resultado;

      if (registroExistente) {
        // Actualizar salida
        const horasTrabajadas = this.calcularHorasTrabajadas(
          registroExistente.hora_entrada, 
          ahora
        );
        const horasExtra = this.calcularHorasExtras(horasTrabajadas);

        const { data, error } = await this.supabase
          .from('asistencia_empleado')
          .update({
            hora_salida: ahora,
            horas_trabajadas: horasTrabajadas,
            horas_extra: horasExtra,
            estado: 'completado'
          })
          .eq('id_asistencia', registroExistente.id_asistencia)
          .select();

        if (error) throw error;
        resultado = data[0];
      } else {
        // Crear nuevo registro de entrada
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const nuevoIdAsistencia = `ASI${timestamp}${random}`.substring(0, 15);

        const { data, error } = await this.supabase
          .from('asistencia_empleado')
          .insert([{
            id_asistencia: nuevoIdAsistencia,
            id_empleado: id_empleado,
            fecha: hoy,
            hora_entrada: ahora,
            estado: 'registrado'
          }])
          .select();

        if (error) throw error;
        resultado = data[0];
      }

      return { success: true, data: resultado };

    } catch (error) {
      console.error('Error registrando asistencia:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerAsistenciasPorPeriodo(id_empleado, fechaInicio, fechaFin) {
    try {
      const { data, error } = await this.supabase
        .from('asistencia_empleado')
        .select('*')
        .eq('id_empleado', id_empleado)
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: true });

      if (error) throw error;
      return { success: true, data };

    } catch (error) {
      console.error('Error obteniendo asistencias:', error);
      return { success: false, error: error.message, data: [] };
    }
  }
}

const asistenciaService = new AsistenciaService();
export default asistenciaService;