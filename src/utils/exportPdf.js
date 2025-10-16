// src/utils/exportPdf.js
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs as pdfMakeVfs } from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfMakeVfs;

const cur = (n) => `Bs ${Number(n || 0).toLocaleString('es-BO')}`;

export function exportFinanzasPDF(data, opts = {}) {
  const {
    titulo = 'Informe Financiero',
    autor = 'Admin',
    descripcion = 'Resumen del periodo',
    charts = {}
  } = opts;

  const {
    ingresos, egresos, ganancia, perdida,
    deudasPendientes, egresosProyectados, gananciaProyectada,
    bases = {},
    desglose = {}
  } = data || {};

  const {
    porMes = [],
    ingresosPorConcepto = {},
    ingresosPorMetodo = {},
    egresosPorCategoria = {},
    topConceptosIngreso = [],
    topEgresosPagos = [],
    topDeudasPendientes = [],
    detalle = {}
  } = desglose;

  const rowsFromObj = (obj) => [
    ['Descripción', 'Total (Bs)'],
    ...Object.entries(obj).map(([k, v]) => [k, Number(v).toLocaleString('es-BO')]),
  ];

  const secCharts = [];
  if (charts.resumenMensual) {
    secCharts.push(
      { text: '\nGráfico — Resumen mensual', style: 'subheader' },
      { image: charts.resumenMensual, fit: [520, 260], margin: [0, 5, 0, 10] }
    );
  }
  if (charts.ingresosConcepto) {
    secCharts.push(
      { text: 'Gráfico — Ingresos por concepto', style: 'subheader' },
      { image: charts.ingresosConcepto, fit: [520, 260], margin: [0, 5, 0, 10] }
    );
  }
  if (charts.egresosCategoria) {
    secCharts.push(
      { text: 'Gráfico — Egresos por categoría', style: 'subheader' },
      { image: charts.egresosCategoria, fit: [520, 260], margin: [0, 5, 0, 10] }
    );
  }

  const doc = {
    info: { title: titulo, author: autor, subject: 'Finanzas' },
    content: [
      { text: titulo, style: 'header' },
      { text: descripcion, margin: [0, 0, 0, 8] },

      { text: 'Resumen (KPIs)', style: 'subheader' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Ingresos', cur(ingresos)],
            ['Egresos', cur(egresos)],
            ['Ganancia', cur(ganancia)],
            ['Pérdida',  cur(perdida)],
          ],
        },
        margin: [0, 0, 0, 8]
      },

      (deudasPendientes || egresosProyectados || gananciaProyectada) ? {
        table: {
          widths: ['*', '*'],
          body: [
            ['Deudas pendientes', cur(deudasPendientes)],
            ...(egresosProyectados != null ? [['Egresos proyectados', cur(egresosProyectados)]] : []),
            ...(gananciaProyectada != null ? [['Ganancia proyectada', cur(gananciaProyectada)]] : []),
          ]
        },
        margin: [0, 0, 0, 10]
      } : {},

      { text: 'Ingresos por concepto', style: 'subheader' },
      { table: { widths: ['70%', '30%'], body: rowsFromObj(ingresosPorConcepto) }, margin: [0,0,0,8] },

      { text: 'Ingresos por método de pago', style: 'subheader' },
      { table: { widths: ['70%', '30%'], body: rowsFromObj(ingresosPorMetodo) }, margin: [0,0,0,8] },

      { text: 'Egresos por categoría', style: 'subheader' },
      { table: { widths: ['70%', '30%'], body: rowsFromObj(egresosPorCategoria) }, margin: [0,0,0,8] },

      // Gráficos
      ...secCharts,

      // TOPs
      { text: '\nTop conceptos de ingreso', style: 'subheader' },
      {
        table: {
          widths: ['70%','30%'],
          body: [['Concepto','Total (Bs)'], ...topConceptosIngreso.map(t=>[t.concepto, Number(t.total).toLocaleString('es-BO')])]
        },
        margin: [0,0,0,8]
      },

      { text: 'Top gastos (pagos no-admin)', style: 'subheader' },
      {
        table: {
          widths: ['70%','30%'],
          body: [['Concepto','Total (Bs)'], ...topEgresosPagos.map(t=>[t.concepto, Number(t.total).toLocaleString('es-BO')])]
        },
        margin: [0,0,0,8]
      },

      { text: 'Top deudas pendientes', style: 'subheader' },
      {
        table: {
          widths: ['55%','30%','15%'],
          body: [['Persona','Concepto','Monto'], ...topDeudasPendientes.map(t=>[t.persona, t.concepto, Number(t.monto).toLocaleString('es-BO')])]
        },
        margin: [0,0,0,8]
      },

      // Resumen por mes
      porMes.length ? { text: 'Resumen por mes', style: 'subheader' } : {},
      porMes.length ? {
        table: {
          widths: ['*','*','*','*'],
          body: [
            ['Mes','Ingresos','Egresos','Balance'],
            ...porMes.map(r=>[
              r.mes,
              Number(r.ingresos).toLocaleString('es-BO'),
              Number(r.egresos).toLocaleString('es-BO'),
              Number(r.balance).toLocaleString('es-BO'),
            ])
          ]
        },
        margin: [0,0,0,10]
      } : {},

      // Detalles
      { text: 'Detalle — Ingresos (pagos al admin)', style: 'subheader' },
      {
        table: {
          widths: ['18%','52%','15%','15%'],
          body: [
            ['Fecha','Concepto','Método','Monto'],
            ...(detalle.ingresos_pagos || []).map(p=>[
              new Date(p.fecha).toLocaleDateString('es-BO'),
              p.concepto,
              p.metodo,
              Number(p.monto).toLocaleString('es-BO')
            ])
          ]
        },
        margin: [0,0,0,8]
      },

      { text: 'Detalle — Gastos (pagos no-admin)', style: 'subheader' },
      {
        table: {
          widths: ['18%','52%','15%','15%'],
          body: [
            ['Fecha','Concepto','Método','Monto'],
            ...(detalle.egresos_pagos || []).map(p=>[
              new Date(p.fecha).toLocaleDateString('es-BO'),
              p.concepto,
              p.metodo,
              Number(p.monto).toLocaleString('es-BO')
            ])
          ]
        },
        margin: [0,0,0,8]
      },

      { text: 'Detalle — Sueldos', style: 'subheader' },
      {
        table: {
          widths: ['20%','60%','20%'],
          body: [
            ['Fecha','Empleado','Monto'],
            ...(detalle.sueldos || []).map(s=>[
              new Date(s.fecha).toLocaleDateString('es-BO'),
              s.empleado,
              Number(s.monto).toLocaleString('es-BO')
            ])
          ]
        },
        margin: [0,0,0,8]
      },

      { text: 'Detalle — Deudas', style: 'subheader' },
      {
        table: {
          widths: ['18%','52%','15%','15%'],
          body: [
            ['Fecha','Concepto','Estado','Monto'],
            ...(detalle.deudas_pagadas || []).map(d=>[
              new Date(d.fecha).toLocaleDateString('es-BO'),
              d.concepto,
              'Pagado',
              Number(d.monto).toLocaleString('es-BO')
            ]),
            ...(detalle.deudas_pendientes || []).map(d=>[
              new Date(d.fecha).toLocaleDateString('es-BO'),
              d.concepto,
              'Pendiente',
              Number(d.monto).toLocaleString('es-BO')
            ])
          ]
        },
        margin: [0,0,0,10]
      },

      { text: `Registros — Pagos: ${bases.pagos_total_periodo} (ingresos: ${bases.pagos_ingreso}, gastos: ${bases.pagos_gasto}) · Sueldos: ${bases.sueldos} · Deudas: ${bases.deudas}`, fontSize: 9, margin: [0,0,0,10] },
      { text: 'Generado el ' + new Date().toLocaleDateString('es-BO'), style: 'footer' },
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 6] },
      footer: { fontSize: 10, italics: true, alignment: 'right', margin: [0, 20, 0, 0] },
    },
    defaultStyle: { fontSize: 10 },
    pageMargins: [40, 40, 40, 40],
  };

  pdfMake.createPdf(doc).download(`Informe_Finanzas_${new Date().toISOString().slice(0,10)}.pdf`);
}
