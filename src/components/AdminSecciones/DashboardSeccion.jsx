import React, { useState, useEffect } from 'react';
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
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Datos de los gráficos
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
  const [ticketsRecientes, setTicketsRecientes] = useState([]);

  // Cargar años disponibles al inicio
  useEffect(() => {
    const loadAnios = async () => {
      const result = await dashboardService.getAniosDisponibles();
      if (result.success && result.data.length > 0) {
        setAniosDisponibles(result.data);
        setAnioSeleccionado(result.data[0]);
      } else {
        setAnioSeleccionado(new Date().getFullYear());
      }
    };
    loadAnios();
  }, []);

  // Cargar datos cuando cambia el año
  useEffect(() => {
    if (anioSeleccionado) {
      loadData();
    }
  }, [anioSeleccionado]);

  const loadData = async () => {
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
        visitasDiaRes,
        ticketsRes
      ] = await Promise.all([
        dashboardService.getEstadisticasGenerales(),
        dashboardService.getIngresosTotales(anioSeleccionado),
        dashboardService.getGastosTotales(anioSeleccionado),
        dashboardService.getVisitasPorMesYAnio(anioSeleccionado),
        dashboardService.getEstacionamientoPorDiaSemana(anioSeleccionado),
        dashboardService.getEstacionamientoEntradaPorHora(anioSeleccionado),
        dashboardService.getEstacionamientoSalidaPorHora(anioSeleccionado),
        dashboardService.getAreasConcurridas(anioSeleccionado),
        dashboardService.getPagosPorMesYAnio(anioSeleccionado),
        dashboardService.getVisitasPorDiaMesAnio(anioSeleccionado),
        dashboardService.getTicketsRecientes(5)
      ]);

      if (estadisticasRes.success) setEstadisticas(estadisticasRes.data);
      if (ingresosRes.success) setIngresos(ingresosRes.data);
      if (gastosRes.success) setGastos(gastosRes.data);
      if (visitasRes.success) setVisitas(visitasRes.data);
      if (estDiaRes.success) setEstacionamientoDia(estDiaRes.data);
      if (estHoraRes.success) setEstacionamientoHora(estHoraRes.data);
      if (estSalidaHoraRes.success) setEstacionamientoSalidaHora(estSalidaHoraRes.data);
      if (areasRes.success) setAreasConcurridas(areasRes.data);
      if (pagosRes.success) setPagosPorMes(pagosRes.data);
      if (visitasDiaRes.success) setVisitasPorDia(visitasDiaRes.data);
      if (ticketsRes.success) setTicketsRecientes(ticketsRes.data);

    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para gráfico de ingresos vs gastos
  const ingresosGastosData = MESES.map((mes, idx) => {
    const mesNum = idx + 1;
    const ingreso = ingresos.find(i => i.mes === mesNum);
    const gasto = gastos.find(g => g.mes === mesNum);
    
    return {
      mes,
      ingresos: ingreso?.total || 0,
      gastos: gasto?.total || 0
    };
  });

  // Preparar datos para áreas más visitadas (top 6)
  const areasVisitadasData = areasConcurridas.slice(0, 6);

  // Preparar datos de estacionamiento combinado (entrada vs salida por hora)
  const estacionamientoCombinado = estacionamientoHora.map(entrada => {
    const salida = estacionamientoSalidaHora.find(s => s.hora24 === entrada.hora24);
    return {
      hora: `${entrada.hora24}:00`,
      entradas: entrada.nrocoches || 0,
      salidas: salida?.nrocoches || 0
    };
  });

  const formatCurrency = (value) => {
    return `Bs ${Number(value).toLocaleString('es-BO', { maximumFractionDigits: 0 })}`;
  };

  const formatYAxisLabel = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const handleLogout = () => {
    logout();
  };

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
        {/* Header con filtro */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Analítico</h1>
            <p className="text-gray-600 mt-2">
              Bienvenido, {user?.persona?.nombre || user?.username}!
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Selector de año */}
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
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Residentes</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas.totalResidentes || 0}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Total Empleados</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas.totalEmpleados || 0}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Tickets Pendientes</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas.ticketsPendientes || 0}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Departamentos Ocupados</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {estadisticas.deptosOcupados || 0} / {estadisticas.totalDepartamentos || 0}
                </p>
              </div>
            </div>

            {/* Gráfico de Ingresos vs Gastos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ingresos vs Gastos Mensuales {anioSeleccionado && `- ${anioSeleccionado}`}
              </h2>
              {ingresosGastosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={ingresosGastosData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="mes" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Ingresos"
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gastos" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Gastos"
                      dot={{ fill: '#ef4444', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Gráficos lado a lado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Áreas más concurridas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Áreas Más Concurridas {anioSeleccionado && `- ${anioSeleccionado}`}
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
                        outerRadius={100}
                        label={(entry) => `${entry.nombre}: ${entry.nro_visitas}`}
                      >
                        {areasVisitadasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
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
                      <Bar dataKey="nroautos" fill="#3b82f6" name="Vehículos" radius={[4, 4, 0, 0]} />
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
                Flujo de Estacionamiento: Entradas vs Salidas por Hora {anioSeleccionado && `- ${anioSeleccionado}`}
              </h2>
              {estacionamientoCombinado.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={estacionamientoCombinado} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="hora" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="salidas" fill="#ef4444" name="Salidas" radius={[4, 4, 0, 0]} />
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
                Visitas por Día de la Semana {anioSeleccionado && `- ${anioSeleccionado}`}
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
                    <Bar dataKey="nrovisitas" fill="#f59e0b" name="Visitas" radius={[4, 4, 0, 0]} />
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
              </h2>
              {pagosPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pagosPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#6b7280"
                      tickFormatter={(mes) => MESES[mes - 1]}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(mes) => `Mes: ${MESES[mes - 1]}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Total Pagado"
                      dot={{ fill: '#8b5cf6', r: 4 }}
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
              </h2>
              {ingresosGastosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ingresosGastosData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="mes" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tickFormatter={formatYAxisLabel} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">No hay datos disponibles</p>
                </div>
              )}
            </div>

            {/* Tickets Recientes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ticketsRecientes && ticketsRecientes.length > 0 ? (
                      ticketsRecientes.map((ticket) => (
                        <tr key={ticket.id_ticket} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{ticket.id_ticket}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{ticket.servicio?.tipo_servicio}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {ticket.persona?.nombre} {ticket.persona?.apellido}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                              ticket.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ticket.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(ticket.fecha).toLocaleDateString('es-BO')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No hay tickets recientes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSeccion;