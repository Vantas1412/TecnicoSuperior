import supabase from './dbConnection.js';
import usuarioService from './UsuarioService.js';
import notificacionesService from './notificacionesService.js';

// Utilidades de fecha
const toDateOnly = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

const getPeriodo = (mes, anio) => {
  const inicio = new Date(Date.UTC(anio, mes - 1, 1));
  // Fin: último día del mes
  const fin = new Date(Date.UTC(anio, mes, 0, 23, 59, 59));
  return { inicio, fin };
};

class FacturaService {
  constructor() {
    this.supabase = supabase;
  }

  // Tarifa vigente por servicio (o 1 si no existe)
  async obtenerTarifaActual(servicio, enFecha = new Date()) {
    const fecha = toDateOnly(enFecha).toISOString().slice(0, 10);
    const { data, error } = await this.supabase
      .from('tarifa_servicio')
      .select('*')
      .eq('servicio', servicio)
      .lte('vigencia_desde', fecha)
      .or('vigencia_hasta.is.null,vigencia_hasta.gte.' + fecha)
      .order('vigencia_desde', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Error obteniendo tarifa:', error);
      return { valor_unitario: 1, tipo: 'unitario' };
    }
    return (data && data[0]) || { valor_unitario: 1, tipo: 'unitario' };
  }

  async obtenerDepartamentosDePersona(id_persona) {
    // En tu esquema, 'vive' usa id_residente (no id_persona). Primero buscamos el/los residente(s).
    const { data: resRows, error: resErr } = await this.supabase
      .from('residente')
      .select('id_residente')
      .eq('id_persona', id_persona);
    if (resErr) throw resErr;
    const idsRes = (resRows || []).map(r => r.id_residente);

    if (idsRes.length === 0) {
      // Fallback: si no hay residente, devolvemos vacío
      return [];
    }

    const { data, error } = await this.supabase
      .from('vive')
      .select('id_departamento, fecha_ini, fecha_fin')
      .in('id_residente', idsRes)
      .order('fecha_ini', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => r.id_departamento);
  }

  async obtenerMedidores(departamentos, servicio) {
    if (!departamentos || departamentos.length === 0) return [];
    const { data, error } = await this.supabase
      .from('medidor')
      .select('*')
      .in('id_departamento', departamentos)
      .eq('tipo', servicio);
    if (error) throw error;
    return data || [];
  }

  async obtenerLecturaAlMomento(id_medidor, fechaLimite) {
    // Busca la lectura más reciente con fecha <= fechaLimite
    const fechaStr = toDateOnly(fechaLimite).toISOString().slice(0, 10);
    const { data, error } = await this.supabase
      .from('registro_medidor')
      .select('lectura, fecha, hora, id_registro_medidor')
      .eq('id_medidor', id_medidor)
      .lte('fecha', fechaStr)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data && data[0]) || null;
  }

  async calcularConsumoMedidor(id_medidor, inicio, fin) {
    const inicioLect = await this.obtenerLecturaAlMomento(id_medidor, inicio);
    const finLect = await this.obtenerLecturaAlMomento(id_medidor, fin);
    if (!inicioLect || !finLect) return { consumo: 0, inicioLect, finLect };
    let consumo = Number(finLect.lectura) - Number(inicioLect.lectura);
    if (consumo < 0) consumo = 0; // manejo simple de reseteo/rollover
    return { consumo, inicioLect, finLect };
  }

  async resumenServiciosDePersona(id_persona, mes, anio) {
    const { inicio, fin } = getPeriodo(mes, anio);
    const dptos = await this.obtenerDepartamentosDePersona(id_persona);
    const servicios = ['agua', 'luz', 'gas', 'internet'];

    const resultado = {};
    for (const s of servicios) {
      const medidores = await this.obtenerMedidores(dptos, s);
      let totalConsumo = 0;
      let lecturasUsadas = [];
      for (const m of medidores) {
        const { consumo, inicioLect, finLect } = await this.calcularConsumoMedidor(m.id_medidor, inicio, fin);
        totalConsumo += consumo;
        lecturasUsadas.push({ id_medidor: m.id_medidor, inicioLect, finLect });
      }
      const tarifa = await this.obtenerTarifaActual(s, fin);
      const costo = (tarifa?.valor_unitario || 1) * totalConsumo;
      resultado[s] = { consumo: totalConsumo, costo, tarifa_unitaria: tarifa?.valor_unitario || 1, lecturas: lecturasUsadas };
    }
    return resultado;
  }

  async generarFacturaYDeudaPorServicio({ id_persona, servicio, mes, anio, resumenServicio, generado_por }) {
    const { inicio, fin } = getPeriodo(mes, anio);
    const total = Number(resumenServicio.costo || 0);
    const subtotal = total; // sin desglose de impuestos en este MVP
    const impuestos = 0;
    const tarifa_aplicada = Number(resumenServicio.tarifa_unitaria || 1);

    if (total <= 0) return { success: true, skipped: true };

    // Validar generado_por contra FK de empleado: si la persona no es empleado, usar null
    let generadoPorVal = null;
    try {
      if (generado_por) {
        const empQuery = this.supabase
          .from('empleado')
          .select('id_persona')
          .eq('id_persona', generado_por)
          .limit(1);
        if (typeof empQuery.maybeSingle === 'function') {
          const { data: emp } = await empQuery.maybeSingle();
          if (emp) generadoPorVal = generado_por;
        } else {
          const { data: empArr } = await empQuery;
          if (empArr && empArr[0]) generadoPorVal = generado_por;
        }
      }
    } catch (_) {
      // Si falla la verificación, preferimos dejar null para no romper por FK
      generadoPorVal = null;
    }

    // Crear factura (si no existe)
    const nuevaFactura = {
      id_persona,
      servicio,
      mes,
      anio,
      consumo: Number(resumenServicio.consumo || 0),
      tarifa_aplicada,
      subtotal,
      impuestos,
      total,
      fecha_emision: new Date().toISOString(),
      fecha_vencimiento: new Date(Date.UTC(anio, mes - 1, 25)).toISOString().slice(0, 10),
      estado: 'pendiente',
      generado_por: generadoPorVal
    };

    // Estrategia sin UNIQUE: buscar primero, insertar sólo si no existe;
    // si existe, reutilizar para evitar 409 y duplicados.
    let factura = await this.buscarFacturaExistente(id_persona, servicio, mes, anio);
    if (!factura) {
      const { data: creada, error: insErr } = await this.supabase
        .from('factura')
        .insert([nuevaFactura])
        .select('*')
        .single();
      if (insErr) {
        // Si cayó en conflicto por un índice añadido después, reintentar obteniendo existente
        console.warn('No se pudo insertar factura, intentando recuperar existente:', insErr);
        factura = await this.buscarFacturaExistente(id_persona, servicio, mes, anio);
      } else {
        factura = creada;
      }
    }

    // Guardar lecturas usadas (opcional, si hay)
    if (factura && resumenServicio.lecturas?.length) {
      for (const l of resumenServicio.lecturas) {
        if (!l.inicioLect && !l.finLect) continue;
        await this.supabase.from('factura_lectura').insert([
          {
            id_factura: factura.id_factura,
            lectura_inicio_id: l.inicioLect?.id_registro_medidor || null,
            lectura_fin_id: l.finLect?.id_registro_medidor || null,
            lectura_inicio_valor: l.inicioLect?.lectura ?? null,
            lectura_fin_valor: l.finLect?.lectura ?? null
          }
        ]);
      }
    }

    // Crear deuda vinculada a la persona (para que el residente la vea y pague)
    const concepto = `SERVICIO_BASICO_${servicio.toUpperCase()} ${String(mes).padStart(2, '0')}/${anio}`;
    const descripcion = `Consumo: ${resumenServicio.consumo} @ ${tarifa_aplicada} = ${total}`;
    // Evitar deudas duplicadas por el mismo concepto
    // Buscar deuda existente robustamente (evitar dependencias de maybeSingle en algunas versiones)
    let deudaExiste = null;
    {
      const q = this.supabase
        .from('deuda')
        .select('id_deuda')
        .eq('id_persona', id_persona)
        .eq('concepto', concepto)
        .limit(1);
      if (typeof q.maybeSingle === 'function') {
        const { data } = await q.maybeSingle();
        deudaExiste = data || null;
      } else {
        const { data } = await q;
        deudaExiste = (data && data[0]) || null;
      }
    }

    if (!deudaExiste) {
      const { error: deudaError } = await this.supabase.from('deuda').insert([
        {
          id_persona,
          monto: total,
          fecha: new Date().toISOString().slice(0, 10),
          concepto,
          descripcion,
          estado: 'Pendiente'
        }
      ]);
      if (deudaError) {
        console.error('Error creando deuda:', deudaError);
      }
    }

    // Notificar al usuario (vía tabla notificacion)
    const usuario = await usuarioService.obtenerUsuarioPorPersona(id_persona);
    if (usuario?.success && usuario.data?.id_usuario) {
      try {
        await notificacionesService.crearNotificacion(
          usuario.data.id_usuario,
          'Nueva facturación de servicios básicos',
          `Se generó tu facturación de ${servicio} del mes ${String(mes).padStart(2, '0')}/${anio} por Bs ${total.toFixed(2)}.`
        );
      } catch (e) {
        console.warn('No se pudo crear notificación:', e.message);
      }
    }

    return { success: true, factura };
  }

  async buscarFacturaExistente(id_persona, servicio, mes, anio) {
    // Usar maybeSingle si está disponible para evitar 406 cuando no hay filas
    const query = this.supabase
      .from('factura')
      .select('*')
      .eq('id_persona', id_persona)
      .eq('servicio', servicio)
      .eq('mes', mes)
      .eq('anio', anio)
      .limit(1);
    if (typeof query.maybeSingle === 'function') {
      const { data } = await query.maybeSingle();
      return data || null;
    } else {
      const { data, error } = await query;
      if (error) return null;
      return (data && data[0]) || null;
    }
  }

  async obtenerResidentesActivos() {
    const { data, error } = await this.supabase
      .from('usuario')
      .select('id_usuario, id_persona, username, persona(nombre, apellido)')
      .eq('rol', 'residente')
      .eq('estado', 'activo')
      .order('username');
    if (error) throw error;
    return data || [];
  }

  async resumenGlobal(mes, anio) {
    const residentes = await this.obtenerResidentesActivos();
    const filas = [];
    for (const r of residentes) {
      const resumen = await this.resumenServiciosDePersona(r.id_persona, mes, anio);
      filas.push({
        id_persona: r.id_persona,
        nombre: `${r.persona?.nombre || ''} ${r.persona?.apellido || ''}`.trim() || r.username,
        ...resumen
      });
    }
    return filas;
  }

  async cobrarMesActualParaTodos({ mes, anio, generado_por }) {
    const residentes = await this.obtenerResidentesActivos();
    const resultados = [];
    for (const r of residentes) {
      const resumen = await this.resumenServiciosDePersona(r.id_persona, mes, anio);
      for (const servicio of ['agua', 'luz', 'gas', 'internet']) {
        const resServ = resumen[servicio];
        if (!resServ) continue;
        const res = await this.generarFacturaYDeudaPorServicio({
          id_persona: r.id_persona,
          servicio,
          mes,
          anio,
          resumenServicio: resServ,
          generado_por
        });
        resultados.push({ id_persona: r.id_persona, servicio, ...res });
      }
    }
    return resultados;
  }

  // Marca una factura como pagada usando el concepto de la deuda: 'SERVICIO_BASICO_<SERV> MM/AAAA'
  async marcarFacturaPagadaPorConcepto(concepto, id_persona, id_pago) {
    try {
      if (!concepto || !id_persona) return { success: false };
      const m = concepto.match(/^SERVICIO_BASICO_(\w+)\s+(\d{2})\/(\d{4})/i);
      if (!m) return { success: false };
      const servicio = m[1].toLowerCase();
      const mes = Number(m[2]);
      const anio = Number(m[3]);

      const { data: factura, error } = await this.supabase
        .from('factura')
        .select('*')
        .eq('id_persona', id_persona)
        .eq('servicio', servicio)
        .eq('mes', mes)
        .eq('anio', anio)
        .single();
      if (error || !factura) return { success: false };

      await this.supabase
        .from('factura')
        .update({ estado: 'pagada' })
        .eq('id_factura', factura.id_factura);

      if (id_pago) {
        await this.supabase
          .from('pago_factura')
          .insert([{ id_pago, id_factura: factura.id_factura, monto_aplicado: factura.total }]);
      }
      return { success: true };
    } catch (e) {
      console.warn('No se pudo marcar factura pagada desde deuda:', e.message);
      return { success: false };
    }
  }
}

const facturaService = new FacturaService();
export default facturaService;
