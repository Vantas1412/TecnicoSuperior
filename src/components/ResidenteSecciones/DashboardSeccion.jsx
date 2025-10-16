// src/components/ResidenteSecciones/DashboardSeccion.jsx
import React, { useEffect, useMemo, useState } from 'react';
import dashboardService from '../../services/DashboardService.js';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const monthOptions = [{ value: 0, label: 'Todos' }, ...MONTHS_ES.map((m, i) => ({ value: i + 1, label: m }))];

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
);

const Pill = ({ children }) => (
  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
    {children}
  </span>
);

const toMoney = (n) =>
  (typeof n === 'number' ? n : Number(n || 0)).toLocaleString('es-BO', { style: 'currency', currency: 'BOB', maximumFractionDigits: 2 });

/** Helpers de agregación */
const fmtDate = (d) => {
  // d es 'YYYY-MM-DD' o Date
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return d;
  return date.toISOString().slice(0, 10);
};

function aggregateMedidorByYearOrMonth(rows, year, month) {
  // rows: [{fecha, hora, lectura, unidad, tipo}, ...]
  // Si month === 0 -> por MES (1..12). Si month != 0 -> por DÍA dentro del mes.
  const map = new Map();
  for (const r of rows) {
    const f = new Date(r.fecha);
    if (Number.isNaN(f.getTime())) continue;
    if (year && f.getFullYear() !== Number(year)) continue;
    if (month && month !== 0 && (f.getMonth() + 1) !== Number(month)) continue;

    if (month === 0) {
      const key = f.getMonth() + 1; // 1..12
      const prev = map.get(key) || { mes: key, lectura: 0, count: 0, unidad: r.unidad };
      prev.lectura += Number(r.lectura || 0);
      prev.count += 1;
      map.set(key, prev);
    } else {
      const key = fmtDate(f);
      const prev = map.get(key) || { dia: key, lectura: 0, count: 0, unidad: r.unidad };
      prev.lectura += Number(r.lectura || 0);
      prev.count += 1;
      map.set(key, prev);
    }
  }

  const arr = Array.from(map.values()).sort((a, b) => {
    if (month === 0) return a.mes - b.mes;
    return new Date(a.dia) - new Date(b.dia);
  });

  // Si quieres promedio por bucket en lugar de suma, cambia aquí:
  // prev.lectura = prev.lectura / prev.count
  return arr;
}

function aggregateAreasFromVisitas(visitas, year, month) {
  // visitas: [{ nombre_area, anio, mes, total_visitas }]
  const map = new Map();
  for (const v of visitas) {
    if (year && v.anio !== Number(year)) continue;
    if (month && month !== 0 && v.mes !== Number(month)) continue;
    const key = v.nombre_area;
    map.set(key, (map.get(key) || 0) + Number(v.total_visitas || 0));
  }
  return Array.from(map.entries())
    .map(([nombre_area, total]) => ({ nombre_area, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12); // top 12
}

/**
 * Dashboard con carrusel de gráficos (Recharts)
 * Props:
 *  - idPersona: string (ej. "AC001")
 *  - anioInicial: number
 */
const DashboardSeccion = ({ idPersona = 'AC001', anioInicial = new Date().getFullYear() }) => {
  const [anio, setAnio] = useState(anioInicial);
  const [mes, setMes] = useState(0); // 0 = todos
  const [anioOptions, setAnioOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Datos brutos
  const [visitasMensualesPersona, setVisitasMensualesPersona] = useState([]);
  const [regLuz, setRegLuz] = useState([]);
  const [regAgua, setRegAgua] = useState([]);
  const [regGas, setRegGas] = useState([]);
  const [ingresosTotales, setIngresosTotales] = useState([]);
  const [gastosTotales, setGastosTotales] = useState([]);

  // Para tarjetas
  const totalIngresosAnio = useMemo(() => {
    const arr = ingresosTotales?.filter(x => !anio || x.anio === anio) || [];
    return arr.reduce((acc, it) => acc + Number(it.total || 0), 0);
  }, [ingresosTotales, anio]);

  const totalGastosAnio = useMemo(() => {
    const arr = gastosTotales?.filter(x => !anio || x.anio === anio) || [];
    return arr.reduce((acc, it) => acc + Number(it.total || 0), 0);
  }, [gastosTotales, anio]);

  const saldoAnio = useMemo(() => totalIngresosAnio - totalGastosAnio, [totalIngresosAnio, totalGastosAnio]);

  // Derivados para gráficos
  const dataLuz = useMemo(() => aggregateMedidorByYearOrMonth(regLuz, anio, mes), [regLuz, anio, mes]);
  const dataAgua = useMemo(() => aggregateMedidorByYearOrMonth(regAgua, anio, mes), [regAgua, anio, mes]);
  const dataGas = useMemo(() => aggregateMedidorByYearOrMonth(regGas, anio, mes), [regGas, anio, mes]);
  const dataAreas = useMemo(() => aggregateAreasFromVisitas(visitasMensualesPersona, anio, mes), [visitasMensualesPersona, anio, mes]);

  const ejeXKey = mes === 0 ? 'mes' : 'dia';
  const ejeXLabel = mes === 0 ? 'Mes' : 'Día';

  // Carrusel
  const slides = [
    { key: 'luz', title: 'Medidor Luz', data: dataLuz, unidad: dataLuz[0]?.unidad || 'u' },
    { key: 'agua', title: 'Medidor Agua', data: dataAgua, unidad: dataAgua[0]?.unidad || 'u' },
    { key: 'gas', title: 'Medidor Gas', data: dataGas, unidad: dataGas[0]?.unidad || 'u' },
    { key: 'areas', title: 'Áreas más concurridas', data: dataAreas },
  ];
  const [slideIndex, setSlideIndex] = useState(0);
  const nextSlide = () => setSlideIndex((i) => (i + 1) % slides.length);
  const prevSlide = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);

  // Años disponibles
  useEffect(() => {
    (async () => {
      const resp = await dashboardService.getAniosDisponibles();
      if (resp.success) {
        setAnioOptions(resp.data);
        if (resp.data?.length && !resp.data.includes(anioInicial)) {
          setAnio(resp.data[0]);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga datos
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        vmp,
        luz,
        agua,
        gas,
        ingresos,
        gastos,
      ] = await Promise.all([
        dashboardService.getVisitasMensualesPorPersona({ idPersona }),
        dashboardService.getRegistrosMedidor({ idPersona, tipo: 'Luz' }),
        dashboardService.getRegistrosMedidor({ idPersona, tipo: 'Agua' }),
        dashboardService.getRegistrosMedidor({ idPersona, tipo: 'Gas' }),
        dashboardService.getIngresosTotales(anio),
        dashboardService.getGastosTotales(anio),
      ]);

      if (!vmp.success) throw new Error(vmp.error || 'Error visitas');
      if (!luz.success) throw new Error(luz.error || 'Error luz');
      if (!agua.success) throw new Error(agua.error || 'Error agua');
      if (!gas.success) throw new Error(gas.error || 'Error gas');
      if (!ingresos.success) throw new Error(ingresos.error || 'Error ingresos');
      if (!gastos.success) throw new Error(gastos.error || 'Error gastos');

      setVisitasMensualesPersona(vmp.data);
      setRegLuz(luz.data);
      setRegAgua(agua.data);
      setRegGas(gas.data);
      setIngresosTotales(ingresos.data);
      setGastosTotales(gastos.data);
    } catch (e) {
      setError(e.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, idPersona]);

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard del Residente</h2>
        <div className="flex gap-3">
          {/* Año */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Año</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {anioOptions.length === 0 && <option value={anio}>{anio}</option>}
              {anioOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {/* Mes */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Mes</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas rápidas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo del Año</p>
                <p className={`text-2xl font-bold ${saldoAnio >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {toMoney(saldoAnio)}
                </p>
                <p className="text-xs text-gray-500">Ingresos: {toMoney(totalIngresosAnio)} · Gastos: {toMoney(totalGastosAnio)}</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medidores</p>
                <p className="text-2xl font-bold text-gray-800">{['Luz','Agua','Gas'].map((x)=>x[0]).join(' / ')}</p>
                <p className="text-xs text-gray-500">Filtrando por {mes === 0 ? `Año ${anio}` : `${MONTHS_ES[mes-1]} ${anio}`}</p>
              </div>
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Áreas</p>
                <p className="text-2xl font-bold text-gray-800">{dataAreas.length}</p>
                <p className="text-xs text-gray-500">Top áreas por visitas</p>
              </div>
              <span className="text-2xl">📍</span>
            </div>
          </div>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Carrusel de gráficos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Gráficos</h3>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
              aria-label="Anterior"
            >
              ◀
            </button>
            <button
              onClick={nextSlide}
              className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
              aria-label="Siguiente"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex gap-2 mb-4">
          {slides.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setSlideIndex(i)}
              className={`px-2 py-1 text-xs rounded-full border ${
                slideIndex === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Contenido del slide */}
        <div className="w-full">
          {loading ? (
            <Skeleton className="h-72" />
          ) : (
            <>
              {/* Slides de Medidor */}
              {(slides[slideIndex].key === 'luz' || slides[slideIndex].key === 'agua' || slides[slideIndex].key === 'gas') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">
                      {slides[slideIndex].title} — {mes === 0 ? `Por mes (${anio})` : `Por día (${MONTHS_ES[mes - 1]} ${anio})`}
                    </div>
                    <Pill>Unidad: {slides[slideIndex].unidad}</Pill>
                  </div>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={slides[slideIndex].data}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={ejeXKey} tickFormatter={(v) => (ejeXKey === 'mes' ? MONTHS_ES[(v - 1) % 12]?.slice(0, 3) : v)} />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(v) => (ejeXKey === 'mes' ? MONTHS_ES[(v - 1) % 12] : v)}
                          formatter={(v) => [v, 'Lectura']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="lectura" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Slide de Áreas */}
              {slides[slideIndex].key === 'areas' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">
                      Áreas con más visitas — {mes === 0 ? `Año ${anio}` : `${MONTHS_ES[mes - 1]} ${anio}`}
                    </div>
                    <Pill>ID Persona: {idPersona}</Pill>
                  </div>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={slides[slideIndex].data}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre_area" interval={0} angle={-15} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip formatter={(v) => [v, 'Visitas']} />
                        <Legend />
                        <Bar dataKey="total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="text-xs text-gray-500">
        * Los gráficos de medidor agregan <b>suma</b> de lecturas por período. Cambia a promedio dividiendo por <code>count</code> en <code>aggregateMedidorByYearOrMonth</code> si lo prefieres.
      </div>
    </div>
  );
};

export default DashboardSeccion;
