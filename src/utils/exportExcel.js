// src/utils/exportExcel.js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const cur = (n) => Number(n || 0);
const dataUrlToBase64 = (dataUrl) => (dataUrl || '').split(',')[1] || '';

export async function exportFinanzasExcel(finanzas, opts = {}) {
  const { titulo = 'Informe Financiero', autor = 'Admin', charts = {} } = opts;

  const wb = new ExcelJS.Workbook();
  wb.creator = autor;
  wb.created = new Date();

  // ======== Hoja KPIs ========
  const wsKPI = wb.addWorksheet('KPIs');
  wsKPI.mergeCells('A1:D1');
  wsKPI.getCell('A1').value = titulo;
  wsKPI.getCell('A1').font = { bold: true, size: 16 };
  wsKPI.addRow([]);

  wsKPI.addRow(['Ingresos', 'Egresos', 'Ganancia', 'Pérdida']);
  wsKPI.addRow([
    cur(finanzas.ingresos),
    cur(finanzas.egresos),
    cur(finanzas.ganancia),
    cur(finanzas.perdida),
  ]);
  wsKPI.getRow(3).font = { bold: true };

  if (finanzas.deudasPendientes != null || finanzas.egresosProyectados != null || finanzas.gananciaProyectada != null) {
    wsKPI.addRow([]);
    wsKPI.addRow(['Deudas pendientes', cur(finanzas.deudasPendientes)]);
    if (finanzas.egresosProyectados != null) wsKPI.addRow(['Egresos proyectados', cur(finanzas.egresosProyectados)]);
    if (finanzas.gananciaProyectada != null) wsKPI.addRow(['Ganancia proyectada', cur(finanzas.gananciaProyectada)]);
  }

  // ======== Helpers para tablas ========
  const addTableFromObject = (sheet, title, obj) => {
    const start = sheet.lastRow?.number ? sheet.lastRow.number + 2 : 1;
    sheet.addRow([]);
    sheet.mergeCells(`A${start}:B${start}`);
    sheet.getCell(`A${start}`).value = title;
    sheet.getCell(`A${start}`).font = { bold: true };
    sheet.addRow(['Descripción','Total (Bs)']);
    sheet.getRow(start+1).font = { bold: true };
    Object.entries(obj).forEach(([k, v]) => sheet.addRow([k, cur(v)]));
    sheet.columns = [{ width: 50 }, { width: 18 }];
  };

  const d = finanzas?.desglose || {};
  const wsRes = wb.addWorksheet('Resumen');
  if ((d.porMes || []).length) {
    wsRes.addRow(['Mes','Ingresos','Egresos','Balance']).font = { bold: true };
    d.porMes.forEach(r=>wsRes.addRow([r.mes, cur(r.ingresos), cur(r.egresos), cur(r.balance)]));
    wsRes.columns = [{ width: 12 },{ width: 18 },{ width: 18 },{ width: 18 }];
  }

  addTableFromObject(wsRes, 'Ingresos por concepto', d.ingresosPorConcepto || {});
  addTableFromObject(wsRes, 'Ingresos por método', d.ingresosPorMetodo || {});
  addTableFromObject(wsRes, 'Egresos por categoría', d.egresosPorCategoria || {});

  // TOPs
  const wsTop = wb.addWorksheet('TOPs');
  wsTop.addRow(['Top conceptos de ingreso']).font = { bold: true };
  wsTop.addRow(['Concepto','Total (Bs)']).font = { bold: true };
  (d.topConceptosIngreso || []).forEach(t=>wsTop.addRow([t.concepto, cur(t.total)]));
  wsTop.addRow([]);
  wsTop.addRow(['Top gastos (pagos no-admin)']).font = { bold: true };
  wsTop.addRow(['Concepto','Total (Bs)']).font = { bold: true };
  (d.topEgresosPagos || []).forEach(t=>wsTop.addRow([t.concepto, cur(t.total)]));
  wsTop.addRow([]);
  wsTop.addRow(['Top deudas pendientes']).font = { bold: true };
  wsTop.addRow(['Persona','Concepto','Monto (Bs)']).font = { bold: true };
  (d.topDeudasPendientes || []).forEach(t=>wsTop.addRow([t.persona, t.concepto, cur(t.monto)]));

  wsTop.columns = [{ width: 40 }, { width: 30 }, { width: 18 }];

  // Detalles
  const wsDetI = wb.addWorksheet('Detalle Ingresos');
  wsDetI.addRow(['Fecha','Concepto','Método','Monto']).font = { bold: true };
  (d.detalle?.ingresos_pagos || []).forEach(p=>{
    wsDetI.addRow([p.fecha, p.concepto, p.metodo, cur(p.monto)]);
  });
  wsDetI.columns = [{ width: 14 }, { width: 40 }, { width: 16 }, { width: 18 }];

  const wsDetG = wb.addWorksheet('Detalle Gastos');
  wsDetG.addRow(['Fecha','Concepto','Método','Monto']).font = { bold: true };
  (d.detalle?.egresos_pagos || []).forEach(p=>{
    wsDetG.addRow([p.fecha, p.concepto, p.metodo, cur(p.monto)]);
  });
  wsDetG.columns = [{ width: 14 }, { width: 40 }, { width: 16 }, { width: 18 }];

  const wsS = wb.addWorksheet('Sueldos');
  wsS.addRow(['Fecha','Empleado','Monto']).font = { bold: true };
  (d.detalle?.sueldos || []).forEach(s=>{
    wsS.addRow([s.fecha, s.empleado, cur(s.monto)]);
  });
  wsS.columns = [{ width: 14 }, { width: 40 }, { width: 18 }];

  const wsD = wb.addWorksheet('Deudas');
  wsD.addRow(['Fecha','Concepto','Estado','Monto']).font = { bold: true };
  (d.detalle?.deudas_pagadas || []).forEach(x=>{
    wsD.addRow([x.fecha, x.concepto, 'Pagado', cur(x.monto)]);
  });
  (d.detalle?.deudas_pendientes || []).forEach(x=>{
    wsD.addRow([x.fecha, x.concepto, 'Pendiente', cur(x.monto)]);
  });
  wsD.columns = [{ width: 14 }, { width: 40 }, { width: 16 }, { width: 18 }];

  // Hoja de Gráficos (imágenes PNG capturadas)
  const wsG = wb.addWorksheet('Gráficos');
  let row = 1;
  const putImg = (dataUrl, caption) => {
    if (!dataUrl) return;
    wsG.mergeCells(`A${row}:F${row}`);
    wsG.getCell(`A${row}`).value = caption;
    wsG.getCell(`A${row}`).font = { bold: true };
    row += 1;
    const imgId = wb.addImage({ base64: dataUrlToBase64(dataUrl), extension: 'png' });
    wsG.addImage(imgId, { tl: { col: 0, row }, ext: { width: 900, height: 360 } });
    row += 24;
  };
  putImg(charts.resumenMensual, 'Gráfico — Resumen mensual');
  putImg(charts.ingresosConcepto, 'Gráfico — Ingresos por concepto');
  putImg(charts.egresosCategoria, 'Gráfico — Egresos por categoría');

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `Informe_Finanzas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
