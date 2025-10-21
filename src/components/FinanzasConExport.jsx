import React, { useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getChartsFromRefs } from '../utils/captureRecharts';
import { exportFinanzasPDF } from '../utils/exportPdf';
import { exportFinanzasExcel } from '../utils/exportExcel';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORS = ['#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#84cc16','#ec4899'];

export default function FinanzasConExport({ data }) {
  const resumenMensualRef = useRef(null);
  const ingresosConceptoRef = useRef(null);
  const egresosCategoriaRef = useRef(null);

  const porMes = data?.desglose?.porMes ?? [];
  const ingresosPorConcepto = data?.desglose?.ingresosPorConcepto ?? {};
  const egresosPorCategoria = data?.desglose?.egresosPorCategoria ?? {};

  const donaIngresos = Object.entries(ingresosPorConcepto).map(([name, value]) => ({ name, value }));
  const donaEgresos = Object.entries(egresosPorCategoria).map(([name, value]) => ({ name, value }));

  async function handleExport(tipo) {
    const charts = await getChartsFromRefs({ resumenMensualRef, ingresosConceptoRef, egresosCategoriaRef });

    if (tipo === 'pdf') {
      exportFinanzasPDF(data, {
        titulo: 'Informe Financiero — Condominio X',
        autor: 'Admin',
        descripcion: 'Resumen y detalle del periodo con gráficos (Recharts).',
        charts,
      });
    } else {
      exportFinanzasExcel(data, {
        titulo: 'Informe Financiero — Condominio X',
        autor: 'Admin',
        charts,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen mensual (Barras) */}
      <div ref={resumenMensualRef} className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Resumen mensual</h3>
        <div style={{ width: '100%', height: 350 }}>
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
      </div>

      {/* Dona: Ingresos por concepto */}
      <div ref={ingresosConceptoRef} className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Ingresos por concepto</h3>
        <div style={{ width: '100%', height: 320 }}>
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
      </div>

      {/* Dona: Egresos por categoría */}
      <div ref={egresosCategoriaRef} className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Egresos por categoría</h3>
        <div style={{ width: '100%', height: 320 }}>
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

      {/* Botones exportar */}
      <div className="flex gap-3">
        <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          📄 Exportar PDF (Recharts)
        </button>
        <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
          📊 Exportar Excel (Recharts)
        </button>
      </div>
    </div>
  );
}
