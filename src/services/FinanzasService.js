// src/services/FinanzasService.js
import pagoService from './PagoService';
import sueldoService from './SueldoService';
import deudaService from './DeudaService';
import realizaService from './RealizaService';       // 👈 nuevo
import personaService from './PersonaService';       // 👈 opcional (nombres en desgloses)

const ADMIN_ID = 'CG001'; // 👈 pagos del admin: id_beneficiario === ADMIN_ID
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const toNumber = (v) => Number.parseFloat(v ?? 0) || 0;
const parseISO = (s) => new Date(s);
const y = (d) => d.getFullYear();
const m = (d) => d.getMonth() + 1;

const inYearMonth = (fecha, { anio, mes }) => {
  if (!fecha) return false;
  const d = parseISO(fecha);
  if (Number.isFinite(anio) && y(d) !== anio) return false;
  if (Number.isFinite(mes) && mes >= 1 && mes <= 12 && m(d) !== mes) return false;
  return true;
};

const sumBy = (arr, fn) => arr.reduce((acc, it) => acc + (fn(it) || 0), 0);
const groupSum = (arr, keyFn, amountFn) => {
  const out = {};
  for (const it of arr) {
    const k = keyFn(it) ?? 'N/A';
    out[k] = (out[k] || 0) + (amountFn(it) || 0);
  }
  return out;
};
const monthsSkeleton = () => Array.from({ length: 12 }, (_, i) => ({ mesNum: i + 1, mes: MESES[i], ingresos: 0, egresos: 0, balance: 0 }));

class FinanzasService {
  async getResumen({ anio = null, mes = null, incluirPendientes = false } = {}) {
    // Traemos datos base
    const [pagosRes, sueldosRes, deudasRes, realizaRes, personasRes] = await Promise.all([
      pagoService.obtenerPagos(),
      sueldoService.obtenerSueldos(),
      deudaService.obtenerDeudas(),
      realizaService.obtenerRealizas(),     // 👈 relación pagador/beneficiario-pago
      personaService.obtenerPersonas().catch(() => ({ success: true, data: [] })) // opcional
    ]);

    if (!pagosRes.success || !sueldosRes.success || !deudasRes.success || !realizaRes.success) {
      return { success: false, error: 'Error obteniendo datos base', data: null };
    }

    // Tabla de personas (para nombres en el desglose)
    const personaById = new Map((personasRes.data || []).map(p => [p.id_persona, p]));

    // Filtrar por periodo
    const pagosAll = pagosRes.data.filter(p => inYearMonth(p.fecha, { anio, mes }));
    const sueldos = sueldosRes.data.filter(s => inYearMonth(s.fecha, { anio, mes }));
    const deudas = deudasRes.data.filter(d => inYearMonth(d.fecha, { anio, mes }));
    const realiza = realizaRes.data.filter(r => {
      // filtrar realiza en función del pago asociado (si hay pagos fuera del periodo, no cuentan)
      return pagosAll.some(p => p.id_pago === r.id_pago);
    });

    // === Clasificación de pagos según 'realiza' ===
    // Regla: si existe un registro realiza cuyo id_beneficiario === ADMIN_ID para ese id_pago => INGRESO
    // En cualquier otro caso => EGRESO (gasto)
    const pagosPorId = new Map(pagosAll.map(p => [p.id_pago, p]));
    const beneficiariosPorPago = new Map(); // id_pago -> Set(id_beneficiario)
    for (const r of realiza) {
      if (!beneficiariosPorPago.has(r.id_pago)) beneficiariosPorPago.set(r.id_pago, new Set());
      beneficiariosPorPago.get(r.id_pago).add(r.id_beneficiario);
    }

    const pagosIngresos = [];
    const pagosEgresos = [];
    for (const p of pagosAll) {
      const beneficiarios = beneficiariosPorPago.get(p.id_pago) || new Set();
      if (beneficiarios.has(ADMIN_ID)) {
        pagosIngresos.push(p);
      } else {
        pagosEgresos.push(p);
      }
    }

    // Totales base con nueva regla
    const ingresos = sumBy(pagosIngresos, p => toNumber(p.monto));

    // Egresos = sueldos + deudas pagadas + pagos que NO son del admin (gasto)
    const egresosSueldos = sumBy(sueldos, s => toNumber(s.monto));
    const deudasPagadasArr = deudas.filter(d => (d.estado || '').toLowerCase() === 'pagado');
    const deudasPendientesArr = deudas.filter(d => (d.estado || '').toLowerCase() === 'pendiente');

    const egresosDeudasPagadas = sumBy(deudasPagadasArr, d => toNumber(d.monto));
    const egresosPagosNoAdmin = sumBy(pagosEgresos, p => toNumber(p.monto)); // 👈 NUEVO componente de egreso

    const egresos = egresosSueldos + egresosDeudasPagadas + egresosPagosNoAdmin;
    const deudasPendientes = sumBy(deudasPendientesArr, d => toNumber(d.monto));

    const ganancia = ingresos - egresos;
    const perdida = ganancia < 0 ? Math.abs(ganancia) : 0;

    const egresosProyectados = incluirPendientes ? egresos + deudasPendientes : egresos;
    const gananciaProyectada = ingresos - egresosProyectados;

    // ==== DESGLOSE ====

    // Ingresos por concepto / método (solo de pagosIngresos)
    const ingresosPorConcepto = groupSum(pagosIngresos, p => p.concepto || 'Sin concepto', p => toNumber(p.monto));
    const ingresosPorMetodo   = groupSum(pagosIngresos, p => p.metodo_pago || 'Otro',     p => toNumber(p.monto));

    // Egresos por categoría (incluye pagos no-admin)
    const egresosPorCategoria = {
      'Gastos (pagos no-admin)': egresosPagosNoAdmin,
      Sueldos: egresosSueldos,
      'Deudas Pagadas': egresosDeudasPagadas,
      ...(incluirPendientes ? { 'Deudas Pendientes (proyectadas)': deudasPendientes } : {})
    };

    // Top conceptos de ingreso
    const topConceptosIngreso = Object.entries(ingresosPorConcepto)
      .map(([concepto, total]) => ({ concepto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top egresos por concepto desde pagos no-admin (útil para ver en qué se va la plata)
    const egresosPagosPorConcepto = groupSum(pagosEgresos, p => p.concepto || 'Gasto', p => toNumber(p.monto));
    const topEgresosPagos = Object.entries(egresosPagosPorConcepto)
      .map(([concepto, total]) => ({ concepto, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top deudas pendientes
    const topDeudasPendientes = [...deudasPendientesArr]
      .map(d => ({
        id_deuda: d.id_deuda,
        persona: d?.persona?.nombre
          ? `${d.persona.nombre} ${d.persona.apellido || ''}`.trim()
          : d.id_persona,
        concepto: d.concepto || 'Deuda',
        fecha: d.fecha,
        monto: toNumber(d.monto)
      }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5);

    // Por mes (si se pasa anio, sin mezclar)
    let porMes = [];
    if (Number.isFinite(anio) && !Number.isFinite(mes)) {
      const base = monthsSkeleton();
      for (const p of pagosIngresos) {
        const mm = m(parseISO(p.fecha));
        base[mm - 1].ingresos += toNumber(p.monto);
      }
      for (const s of sueldos) {
        const mm = m(parseISO(s.fecha));
        base[mm - 1].egresos += toNumber(s.monto);
      }
      for (const d of deudasPagadasArr) {
        const mm = m(parseISO(d.fecha));
        base[mm - 1].egresos += toNumber(d.monto);
      }
      for (const p of pagosEgresos) {
        const mm = m(parseISO(p.fecha));
        base[mm - 1].egresos += toNumber(p.monto);
      }
      porMes = base.map(r => ({ ...r, balance: r.ingresos - r.egresos }));
    }

    // Detalle
    const detalle = {
      ingresos_pagos: pagosIngresos.map(p => ({
        id_pago: p.id_pago,
        fecha: p.fecha,
        concepto: p.concepto || '—',
        metodo: p.metodo_pago || '—',
        monto: toNumber(p.monto),
      })),
      egresos_pagos: pagosEgresos.map(p => ({
        id_pago: p.id_pago,
        fecha: p.fecha,
        concepto: p.concepto || '—',
        metodo: p.metodo_pago || '—',
        monto: toNumber(p.monto),
      })),
      sueldos: sueldos.map(s => ({
        id_sueldo: s.id_sueldo,
        fecha: s.fecha,
        empleado: s?.empleado?.id_empleado || '—',
        monto: toNumber(s.monto)
      })),
      deudas_pagadas: deudasPagadasArr.map(d => ({
        id_deuda: d.id_deuda, fecha: d.fecha, concepto: d.concepto || '—', monto: toNumber(d.monto)
      })),
      deudas_pendientes: deudasPendientesArr.map(d => ({
        id_deuda: d.id_deuda, fecha: d.fecha, concepto: d.concepto || '—', monto: toNumber(d.monto)
      })),
    };

    // (Opcional) enriquecer detalle ingresos/egresos con pagador/beneficiario
    // usando realiza + personaService
    const realizaByPago = new Map();
    for (const r of realiza) {
      if (!realizaByPago.has(r.id_pago)) realizaByPago.set(r.id_pago, []);
      realizaByPago.get(r.id_pago).push(r);
    }
    const nameOf = (id) => {
      const p = personaById.get(id);
      return p ? `${p.nombre} ${p.apellido || ''}`.trim() : id;
    };
    for (const item of [...detalle.ingresos_pagos, ...detalle.egresos_pagos]) {
      const rels = realizaByPago.get(item.id_pago) || [];
      item.relaciones = rels.map(r => ({
        id_realiza: r.id_realiza,
        pagador: nameOf(r.id_pagador),
        beneficiario: nameOf(r.id_beneficiario),
      }));
    }

    return {
      success: true,
      data: {
        filtros: { anio, mes, incluirPendientes },

        // Totales con la nueva lógica
        ingresos,
        egresos,
        ganancia,
        perdida,

        // Pendientes y proyección
        deudasPendientes,
        egresosProyectados,
        gananciaProyectada,

        // Conteos base
        bases: {
          pagos_total_periodo: pagosAll.length,
          pagos_ingreso: pagosIngresos.length,
          pagos_gasto: pagosEgresos.length,
          sueldos: sueldos.length,
          deudas: deudas.length
        },

        // DESGLOSE
        desglose: {
          ingresosPorConcepto,
          ingresosPorMetodo,
          egresosPorCategoria,
          topConceptosIngreso,
          topEgresosPagos,       // 👈 nuevo
          topDeudasPendientes,
          porMes,                // [{mesNum, mes, ingresos, egresos, balance}] si anio está definido
          detalle,               // listas para tabla
        },
      }
    };
  }
}

const finanzasService = new FinanzasService();
export default finanzasService;
