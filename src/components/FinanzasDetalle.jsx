// src/components/FinanzasDetalle.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import finanzasService from '../services/FinanzasService';
import dashboardService from '../services/DashboardService';
import { exportFinanzasExcel } from '../utils/exportExcel';
import { exportFinanzasPDF } from '../utils/exportPdf';
import { getChartsFromRefs } from '../utils/captureRecharts';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORS = ['#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#84cc16','#ec4899'];

const formatCurrency = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
const formatDate = (iso) => {
  try { return new Date(iso).toLocaleDateString('es-BO'); } catch { return iso || '—'; }
};

export default function FinanzasDetalle() {
  const [anio, setAnio] = useState();
  const [mes, setMes] = useState(0); // 0 = todos
  const [incluirPend, setIncluirPend] = useState(false);
  const [anios, setAnios] = useState([]);

  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  // Refs para CAPTURAR gráficos (contenedores ocultos)
  const resumenMensualRef = useRef(null);
  const ingresosConceptoRef = useRef(null);
  const egresosCategoriaRef = useRef(null);

  // Cargar años disponibles
  useEffect(() => {
    (async () => {
      const res = await dashboardService.getAniosDisponibles();
      const def = (res.success && res.data.length) ? res.data[0] : new Date().getFullYear();
      setAnios(res.success ? res.data : [def]);
      setAnio(def);
    })();
  }, []);

  // Traer resumen
  useEffect(() => {
    if (!anio) return;
    (async () => {
      setLoading(true); setErr('');
      const r = await finanzasService.getResumen({
        anio,
        mes: mes || null,
        incluirPendientes: incluirPend
      });
      if (!r.success) {
        setErr(r.error || 'No se pudo obtener el resumen');
        setData(null);
      } else {
        setData(r.data);
      }
      setLoading(false);
    })();
  }, [anio, mes, incluirPend]);

  const kpis = useMemo(() => {
    if (!data) return null;
    return [
      { label: 'Ingresos', value: data.ingresos, color: 'border-emerald-500' },
      { label: 'Egresos', value: data.egresos, color: 'border-rose-500' },
      { label: 'Ganancia', value: data.ganancia, color: 'border-blue-600' },
      { label: 'Pérdida', value: data.perdida, color: 'border-amber-600' },
    ];
  }, [data]);

  const porMes = data?.desglose?.porMes || [];
  const ingresosPorConcepto = data?.desglose?.ingresosPorConcepto || {};
  const ingresosPorMetodo = data?.desglose?.ingresosPorMetodo || {};
  const egresosPorCategoria = data?.desglose?.egresosPorCategoria || {};
  const topConceptosIngreso = data?.desglose?.topConceptosIngreso || [];
  const topEgresosPagos = data?.desglose?.topEgresosPagos || [];
  const topDeudasPendientes = data?.desglose?.topDeudasPendientes || [];
  const detalle = data?.desglose?.detalle || {};

  const donaIngresos = Object.entries(ingresosPorConcepto).map(([name, value]) => ({ name, value }));
  const donaEgresos = Object.entries(egresosPorCategoria).map(([name, value]) => ({ name, value }));

  // Helpers para renderizar objetos {clave: total} como filas
  const toRows = (obj) =>
    Object.entries(obj).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);

  // Exportar con gráficos capturados
  async function handleExport(tipo) {
    // Asegura un frame para que Recharts termine de pintar
    await new Promise(requestAnimationFrame);

    const charts = await getChartsFromRefs({
      resumenMensualRef, ingresosConceptoRef, egresosCategoriaRef
    });

    const meta = {
      titulo: `Informe Financiero — ${anio}${mes ? ` / ${MESES[mes-1]}` : ''}`,
      autor: 'Admin',
      descripcion: 'Resumen y detalle del periodo con gráficos (Recharts).',
      charts,
    };

    if (tipo === 'pdf') {
      exportFinanzasPDF(data, meta);
    } else {
      exportFinanzasExcel(data, meta);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Desglose de Finanzas</h2>

      {/* Botones de descarga */}
      {data && (
        <div className="flex gap-3 mb-4">
          <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
            📊 Exportar a Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            📄 Exportar a PDF
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Año</label>
          <select
            value={anio || ''}
            onChange={(e)=>setAnio(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Mes</label>
          <select
            value={mes}
            onChange={(e)=>setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value={0}>Todos</option>
            {MESES.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={incluirPend}
            onChange={(e)=>setIncluirPend(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Incluir deudas pendientes</span>
        </label>
      </div>

      {/* Mensajes */}
      {err && (
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{err}</div>
      )}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando desglose…</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map(k => (
              <div key={k.label} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${k.color}`}>
                <div className="text-sm text-gray-600">{k.label}</div>
                <div className="text-3xl font-bold text-gray-800">{formatCurrency(k.value)}</div>
              </div>
            ))}
          </div>

          {/* Pendientes / Proyección */}
          {(data.deudasPendientes || incluirPend) && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
              <div className="flex flex-wrap gap-6">
                <div>Deudas pendientes: <b>{formatCurrency(data.deudasPendientes)}</b></div>
                {incluirPend && (
                  <>
                    <div>Egresos proyectados: <b>{formatCurrency(data.egresosProyectados)}</b></div>
                    <div>Ganancia proyectada: <b>{formatCurrency(data.gananciaProyectada)}</b></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* DESGLOSE RESUMEN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ingresos por concepto */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingresos por concepto</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {toRows(ingresosPorConcepto).map(r => (
                      <tr key={r.k} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-800">{r.k}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.v)}</td>
                      </tr>
                    ))}
                    {Object.keys(ingresosPorConcepto).length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-500">Sin ingresos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ingresos por método */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingresos por método de pago</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {toRows(ingresosPorMetodo).map(r => (
                      <tr key={r.k} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-800">{r.k}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.v)}</td>
                      </tr>
                    ))}
                    {Object.keys(ingresosPorMetodo).length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-500">Sin ingresos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Egresos por categoría */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Egresos por categoría</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {toRows(egresosPorCategoria).map(r => (
                      <tr key={r.k} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-800">{r.k}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.v)}</td>
                      </tr>
                    ))}
                    {Object.keys(egresosPorCategoria).length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-gray-500">Sin egresos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* TOPs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top conceptos de ingreso</h3>
              <ul className="space-y-2">
                {topConceptosIngreso.map(t => (
                  <li key={t.concepto} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.concepto}</span>
                    <span className="font-medium">{formatCurrency(t.total)}</span>
                  </li>
                ))}
                {topConceptosIngreso.length === 0 && <li className="text-gray-500 text-sm">Sin datos</li>}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top gastos (pagos no-admin)</h3>
              <ul className="space-y-2">
                {topEgresosPagos.map(t => (
                  <li key={t.concepto} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.concepto}</span>
                    <span className="font-medium">{formatCurrency(t.total)}</span>
                  </li>
                ))}
                {topEgresosPagos.length === 0 && <li className="text-gray-500 text-sm">Sin datos</li>}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top deudas pendientes</h3>
              <ul className="space-y-2">
                {topDeudasPendientes.map(t => (
                  <li key={t.id_deuda} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.persona} — {t.concepto}</span>
                    <span className="font-medium">{formatCurrency(t.monto)}</span>
                  </li>
                ))}
                {topDeudasPendientes.length === 0 && <li className="text-gray-500 text-sm">Sin pendientes</li>}
              </ul>
            </div>
          </div>

          {/* Por mes (si hay) */}
          {porMes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen por mes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Egresos</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {porMes.map(r => (
                      <tr key={r.mesNum} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{r.mes}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.ingresos)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.egresos)}</td>
                        <td className={`px-4 py-2 text-sm text-right ${r.balance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {formatCurrency(r.balance)}
                        </td>
                      </tr>
                    ))}
                    {porMes.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DETALLE */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Ingresos - pagos admin */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle — Ingresos (pagos al admin)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(detalle.ingresos_pagos || []).map(p => (
                      <tr key={p.id_pago} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{formatDate(p.fecha)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{p.concepto}</td>
                        <td className="px-4 py-2 text-sm">{p.metodo}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(p.monto)}</td>
                      </tr>
                    ))}
                    {(detalle.ingresos_pagos || []).length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Egresos - pagos no admin */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle — Gastos (pagos no-admin)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(detalle.egresos_pagos || []).map(p => (
                      <tr key={p.id_pago} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{formatDate(p.fecha)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{p.concepto}</td>
                        <td className="px-4 py-2 text-sm">{p.metodo}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(p.monto)}</td>
                      </tr>
                    ))}
                    {(detalle.egresos_pagos || []).length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sueldos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle — Sueldos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(detalle.sueldos || []).length > 0 ? (
                      detalle.sueldos.map(s => (
                        <tr key={s.id_sueldo} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{formatDate(s.fecha)}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{s.empleado}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(s.monto)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deudas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle — Deudas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(detalle.deudas_pagadas || []).map(d => (
                      <tr key={`p-${d.id_deuda}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{formatDate(d.fecha)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{d.concepto}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(d.monto)}</td>
                        <td className="px-4 py-2 text-sm text-emerald-700">Pagado</td>
                      </tr>
                    ))}
                    {(detalle.deudas_pendientes || []).map(d => (
                      <tr key={`x-${d.id_deuda}`} className="hover:bg-gray-50 bg-yellow-50/30">
                        <td className="px-4 py-2 text-sm">{formatDate(d.fecha)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{d.concepto}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(d.monto)}</td>
                        <td className="px-4 py-2 text-sm text-amber-700">Pendiente</td>
                      </tr>
                    ))}
                    {((detalle.deudas_pagadas || []).length + (detalle.deudas_pendientes || []).length) === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Metadatos */}
          <div className="text-xs text-gray-500">
            Registros considerados — Pagos: {data.bases.pagos_total_periodo} (ingresos: {data.bases.pagos_ingreso}, gastos: {data.bases.pagos_gasto}) · Sueldos: {data.bases.sueldos} · Deudas: {data.bases.deudas}
          </div>

          {/* ====== CONTENEDOR OCULTO CON LOS GRÁFICOS PARA EXPORTAR ====== */}
          <div style={{ position:'absolute', left:-99999, top:-99999 }}>
            {/* Resumen mensual (barras) */}
            <div ref={resumenMensualRef} style={{ width: 900, height: 360 }}>
              <ResponsiveContainer>
                <BarChart data={porMes}>
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                  <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
                  <Bar dataKey="balance" fill="#3b82f6" name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dona: Ingresos por concepto */}
            <div ref={ingresosConceptoRef} style={{ width: 900, height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donaIngresos} dataKey="value" nameKey="name" outerRadius={110} label>
                    {donaIngresos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Dona: Egresos por categoría */}
            <div ref={egresosCategoriaRef} style={{ width: 900, height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donaEgresos} dataKey="value" nameKey="name" outerRadius={110} label>
                    {donaEgresos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* ============================================================= */}
        </div>
      )}
    </div>
  );
}
