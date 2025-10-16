import { toPng } from 'html-to-image';

/**
 * Convierte un nodo (que contiene un gráfico Recharts) a PNG base64
 * @param {HTMLElement} node - ref.current del contenedor del gráfico
 * @param {object} opts - { width, height, pixelRatio }
 * @returns {Promise<string>} dataURL (image/png)
 */
export async function captureChartNode(node, opts = {}) {
  if (!node) throw new Error('Nodo del gráfico no encontrado');
  const {
    width = node.clientWidth || 900,
    height = node.clientHeight || 420,
    pixelRatio = 2,
    backgroundColor = '#ffffff',
  } = opts;

  // Oculta tooltips / animaciones para snapshot limpio
  const filter = (n) => {
    const cls = (n.className || '').toString();
    // Recharts tooltips suelen ser divs flotantes fuera del svg;
    // si envuelves todo en un contenedor, esto evita capturarlos.
    return !cls.includes('recharts-tooltip-wrapper');
  };

  return await toPng(node, {
    cacheBust: true,
    pixelRatio,
    style: { backgroundColor, width: `${width}px`, height: `${height}px` },
    filter,
  });
}

/**
 * Captura varios gráficos por sus refs y devuelve el objeto charts para exportadores
 */
export async function getChartsFromRefs({
  resumenMensualRef,
  ingresosConceptoRef,
  egresosCategoriaRef,
}) {
  const charts = {};
  if (resumenMensualRef?.current) {
    charts.resumenMensual = await captureChartNode(resumenMensualRef.current);
  }
  if (ingresosConceptoRef?.current) {
    charts.ingresosConcepto = await captureChartNode(ingresosConceptoRef.current);
  }
  if (egresosCategoriaRef?.current) {
    charts.egresosCategoria = await captureChartNode(egresosCategoriaRef.current);
  }
  return charts;
}
