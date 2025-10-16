import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/DashboardService';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DashboardSeccion = () => {
  const { user, logout } = useAuth();
  const [anioSeleccionado, setAnioSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(0); // 0 = Todos
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Datos
  const [estadisticas, setEstadisticas] = useState({});
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [estacionamientoDia, setEstacionamientoDia] = useState([]);
  const [estacionamientoHora, setEstacionamientoHora] = useState([]);
  const [estacionamientoSalidaHora, setEstacionamientoSalidaHora] = useState([]);
  const [areasConcurridas, setAreasConcurridas] = useState([]);
  const [pagosPorMes, setPagosPorMes] = useState([]);
  const [visitasPorDia, setVisitasPorDia] = useState([]);

  // Helpers
  const formatCurrency = (value) => `Bs ${Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
  const formatYAxisLabel = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return Number(value || 0).toFixed(0);
  };

  // Rellenar meses 1..12 con 0 si faltan
  const fillByMonth = (rows, keyTotal = 'total') => {
    const map = new Map(rows.map(r => [Number(r.mes), r[keyTotal] ?? 0]));
    return Array.from({ length: 12 }, (_, i) => {
      const mesNum = i + 1;
      return { mes: MESES[i], mesNum, [keyTotal]: Number(map.get(mesNum) || 0) };
    });
  };

  // Rellenar horas 0..23 con 0 si faltan
  const fillByHour = (rows, keyHour = 'hora24', keyCount = 'nrocoches') => {
    const map = new Map(rows.map(r => [Number(r[keyHour]), Number(r[keyCount] || 0)]));
    return Array.from({ length: 24 }, (_, h) => {
      return { hora24: h, horaEtiqueta: `${String(h).padStart(2,'0')}:00`, [keyCount]: map.get(h) || 0 };
    });
  };

  // Cargar años disponibles
  useEffect(() => {
    (async () => {
      const result = await dashboardService.getAniosDisponibles();
      if (result.success && result.data.length > 0) {
        setAniosDisponibles(result.data);
        setAnioSeleccionado(result.data[0]);
      } else {
        setAnioSeleccionado(new Date().getFullYear());
      }
    })();
  }, []);

  // Cargar datos cuando cambia el año
  useEffect(() => {
    if (!anioSeleccionado) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [
          estadisticasRes,
          ingresosRes,
          gastosRes,
          visitasRes,
          estDiaRes,
          estHoraRes,
          estSalidaHoraRes,
          areasRes,
          pagosRes,
          visitasDiaRes
        ] = await Promise.all([
          dashboardService.getEstadisticasGenerales(),
          dashboardService.getIngresosTotales(anioSeleccionado),
          dashboardService.getGastosTotales(anioSeleccionado),
          dashboardService.getVisitasPorMesYAnio(anioSeleccionado),
          dashboardService.getEstacionamientoPorDiaSemana(), // no filtra por año
          dashboardService.getEstacionamientoEntradaPorHora(), // no filtra por año
          dashboardService.getEstacionamientoSalidaPorHora(),  // no filtra por año
          dashboardService.getAreasConcurridas(), // sin año
          dashboardService.getPagosPorMesYAnio(anioSeleccionado),
          dashboardService.getVisitasPorDiaMesAnio(anioSeleccionado)
        ]);

        if (estadisticasRes.success) setEstadisticas(estadisticasRes.data);
        if (ingresosRes.success) setIngresos(ingresosRes.data || []);
        if (gastosRes.success) setGastos(gastosRes.data || []);
        if (visitasRes.success) setVisitas(visitasRes.data || []);
        if (estDiaRes.success) setEstacionamientoDia(estDiaRes.data || []);
        if (estHoraRes.success) setEstacionamientoHora(estHoraRes.data || []);
        if (estSalidaHoraRes.success) setEstacionamientoSalidaHora(estSalidaHoraRes.data || []);
        if (areasRes.success) setAreasConcurridas(areasRes.data || []);
        if (pagosRes.success) setPagosPorMes(pagosRes.data || []);
        if (visitasDiaRes.success) setVisitasPorDia(visitasDiaRes.data || []);

      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [anioSeleccionado]);

  // === Transformaciones con memo ===

  // Ingresos vs Gastos (relleno 12 meses, filtro por mes si aplica)
  const ingresosGastosData = useMemo(() => {
    const inc = fillByMonth(ingresos, 'total');
    const gas = fillByMonth(gastos, 'total');

    const merged = inc.map((i, idx) => ({
      mes: i.mes,
      mesNum: i.mesNum,
      ingresos: i.total,
      gastos: gas[idx]?.total ?? 0
    }));

    return mesSeleccionado === 0
      ? merged
      : merged.filter(r => r.mesNum === mesSeleccionado);
  }, [ingresos, gastos, mesSeleccionado]);

  // Áreas: ordenar por visitas desc y top 6
  const areasVisitadasData = useMemo(() => {
    return [...(areasConcurridas || [])]
      .sort((a, b) => Number(b.nro_visitas || 0) - Number(a.nro_visitas || 0))
      .slice(0, 6);
  }, [areasConcurridas]);

  // Estacionamiento (rellenar 0..23 y combinar)
  const estacionamientoCombinado = useMemo(() => {
    const entradas = fillByHour(estacionamientoHora, 'hora24', 'nrocoches');
    const salidas  = fillByHour(estacionamientoSalidaHora, 'hora24', 'nrocoches');
    const mapSal = new Map(salidas.map(s => [s.hora24, s.nrocoches]));
    return entradas.map(e => ({
      hora: e.horaEtiqueta,
      entradas: e.nrocoches,
      salidas: mapSal.get(e.hora24) || 0
    }));
  }, [estacionamientoHora, estacionamientoSalidaHora]);

  // Pagos por mes (rellenar 12, filtrar por mes si aplica)
  const pagosData = useMemo(() => {
    const base = fillByMonth(pagosPorMes, 'total').map(r => ({ ...r, total: r.total }));
    return mesSeleccionado === 0
      ? base
      : base.filter(r => r.mesNum === mesSeleccionado);
  }, [pagosPorMes, mesSeleccionado]);

  const handleLogout = () => logout();

  if (loading && !anioSeleccionado) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con filtros */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Analítico</h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, {user?.persona?.nombre || user?.username}!
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Año */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Año:</label>
              <select
                value={anioSeleccionado || ''}
                onChange={(e) => setAnioSeleccionado(e.target.value ? Number(e.target.value) : null)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los años</option>
                {aniosDisponibles.map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            {/* Mes */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Mes:</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Todos</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right text-red-800 hover:text-red-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando datos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estadísticas rápidas (sin tabla de tickets) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Residentes</h3>
                <p className="text-3xl font-bold text-gray-800">{estadisticas.totalResidentes || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Empleados</h3>
                <p className="text-3xl font-bold text-gray-800">{estadisticas.totalEmpleados || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Tickets Pendientes</h3>
                <p className="text-3xl font-bold text-gray-800">{estadisticas.ticketsPendientes || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Departamentos Ocupados</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas.deptosOcupados || 0} / {estadisticas.totalDepartamentos || 0}
                </p>
              </div>
            </div>

            {/* Defs para gradientes (reutilizables) */}
            <svg width="0" height="0">
              <defs>
                <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.25" />
                </linearGradient>
                <linearGradient id="gradPagos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>

            {/* Ingresos vs Gastos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ingresos vs Gastos Mensuales {anioSeleccionado && `- ${anioSeleccionado}`}
                {mesSeleccionado !== 0 && ` ( ${MESES[mesSeleccionado - 1]} )`}
              </h2>
              {ingresosGastosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={ingresosGastosData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="url(#gradIngresos)" 
                      strokeWidth={2}
                      name="Ingresos"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="url(#gradGastos)" 
                      strokeWidth={2}
                      name="Gastos"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Áreas + Estacionamiento por día */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Áreas más concurridas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Áreas Más Concurridas
                </h2>
                {areasVisitadasData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={areasVisitadasData}
                        dataKey="nro_visitas"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        outerRadius={105}
                        label={(entry) => `${entry.nombre}: ${entry.nro_visitas}`}
                      >
                        {areasVisitadasData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, _name, { payload }) => {
                          const total = areasVisitadasData.reduce((a, b) => a + Number(b.nro_visitas || 0), 0) || 1;
                          const pct = ((Number(v || 0) / total) * 100).toFixed(1) + '%';
                          return [`${v} (${pct})`, payload?.nombre || 'Área'];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No hay datos disponibles</p>
                  </div>
                )}
              </div>

              {/* Estacionamiento por día de semana */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Uso de Estacionamiento por Día
                </h2>
                {estacionamientoDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={estacionamientoDia} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="dia_semana" 
                        stroke="#6b7280" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="nroautos" fill="#3b82f6" name="Vehículos" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estacionamiento: Entradas vs Salidas por hora */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Flujo de Estacionamiento: Entradas vs Salidas por Hora
              </h2>
              {estacionamientoCombinado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estacionamientoCombinado} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="hora" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="salidas" fill="#ef4444" name="Salidas" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Visitas por día de la semana */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Visitas por Día de la Semana
              </h2>
              {visitasPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={visitasPorDia} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="dia_semana" 
                      stroke="#6b7280" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="nrovisitas" fill="#f59e0b" name="Visitas" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Pagos realizados por mes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Pagos Realizados por Mes {anioSeleccionado && `- ${anioSeleccionado}`}
                {mesSeleccionado !== 0 && ` ( ${MESES[mesSeleccionado - 1]} )`}
              </h2>
              {pagosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pagosData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#6b7280"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="url(#gradPagos)" 
                      strokeWidth={2}
                      name="Total Pagado"
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Resumen Financiero Comparativo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Resumen Financiero Mensual {anioSeleccionado && `- ${anioSeleccionado}`}
                {mesSeleccionado !== 0 && ` ( ${MESES[mesSeleccionado - 1]} )`}
              </h2>
              {ingresosGastosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ingresosGastosData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="mes" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="url(#gradIngresos)" name="Ingresos" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gastos" fill="url(#gradGastos)" name="Gastos" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSeccion;
