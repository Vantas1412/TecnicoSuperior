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
  const { user } = useAuth();
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  
  // Datos de los gráficos específicos para empleados
  const [tareasCompletadas, setTareasCompletadas] = useState([]);
  const [horasTrabajadas, setHorasTrabajadas] = useState([]);
  const [productividad, setProductividad] = useState([]);
  const [estadisticasEmpleado, setEstadisticasEmpleado] = useState({});

  useEffect(() => {
    loadDataEmpleado();
  }, [anioSeleccionado]);

  const loadDataEmpleado = async () => {
    setLoading(true);
    try {
      // Simulando datos específicos del empleado
      const tareasData = [
        { mes: 1, completadas: 12, pendientes: 3 },
        { mes: 2, completadas: 15, pendientes: 2 },
        { mes: 3, completadas: 18, pendientes: 1 },
        { mes: 4, completadas: 14, pendientes: 4 },
        { mes: 5, completadas: 16, pendientes: 2 },
        { mes: 6, completadas: 20, pendientes: 0 }
      ];

      const horasData = [
        { semana: 'Sem 1', horas: 40 },
        { semana: 'Sem 2', horas: 42 },
        { semana: 'Sem 3', horas: 38 },
        { semana: 'Sem 4', horas: 45 },
        { semana: 'Sem 5', horas: 41 }
      ];

      const productividadData = [
        { tipo: 'Alta', cantidad: 45 },
        { tipo: 'Media', cantidad: 30 },
        { tipo: 'Baja', cantidad: 25 }
      ];

      const stats = {
        tareasTotales: 85,
        tareasCompletadas: 75,
        eficiencia: '88%',
        horasMes: 166
      };

      setTareasCompletadas(tareasData);
      setHorasTrabajadas(horasData);
      setProductividad(productividadData);
      setEstadisticasEmpleado(stats);

    } catch (error) {
      console.error('Error cargando datos del empleado:', error);
    } finally {
      setLoading(false);
    }
  };

  const tareasMensualesData = tareasCompletadas.map(item => ({
    mes: MESES[item.mes - 1],
    completadas: item.completadas,
    pendientes: item.pendientes
  }));

  if (loading) {
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mi Dashboard</h1>
          <p className="text-gray-600 mt-2">Resumen de mi desempeño y actividades</p>
        </div>

        {/* Estadísticas rápidas del empleado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Tareas</h3>
            <p className="text-3xl font-bold text-gray-800">
              {estadisticasEmpleado.tareasTotales || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Completadas</h3>
            <p className="text-3xl font-bold text-gray-800">
              {estadisticasEmpleado.tareasCompletadas || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Eficiencia</h3>
            <p className="text-3xl font-bold text-gray-800">
              {estadisticasEmpleado.eficiencia || '0%'}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Horas/Mes</h3>
            <p className="text-3xl font-bold text-gray-800">
              {estadisticasEmpleado.horasMes || 0}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tareas Completadas vs Pendientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Tareas Completadas vs Pendientes
            </h2>
            {tareasMensualesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tareasMensualesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="mes" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completadas" fill="#10b981" name="Completadas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendientes" fill="#ef4444" name="Pendientes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Horas Trabajadas por Semana */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Horas Trabajadas por Semana
            </h2>
            {horasTrabajadas.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={horasTrabajadas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="semana" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="horas" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Horas"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Nivel de Productividad */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Nivel de Productividad
          </h2>
          {productividad.length > 0 ? (
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productividad}
                    dataKey="cantidad"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.tipo}: ${entry.cantidad}%`}
                  >
                    {productividad.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No hay datos disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSeccion;