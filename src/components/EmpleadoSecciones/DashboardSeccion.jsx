import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/DashboardService';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DashboardSeccion = () => {
  const { user } = useAuth();

  // Filtros
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mesInicio, setMesInicio] = useState(1);
  const [mesFin, setMesFin] = useState(new Date().getMonth() + 1);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [loadingSQL, setLoadingSQL] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Series de gráficos
  const [horasExtraDia, setHorasExtraDia] = useState([]); // [{ name:'YYYY-MM-DD', horas_extra }]
  const [tardePorMes, setTardePorMes] = useState([]);     // [{ name:'YYYY-MM', veces_tarde }]

  // id_empleado desde el usuario autenticado (ajusta si tu shape cambia)
  const idEmpleado = useMemo(
    () => user?.empleado?.id_empleado || user?.empleado?.id || null,
    [user]
  );

  // helpers
  const pad2 = (n) => String(n).padStart(2, '0');

  const rango = useMemo(() => {
    const desde = `${anio}-${pad2(mesInicio)}-01`;
    const lastDay = new Date(anio, mesFin, 0).getDate();
    const hasta = `${anio}-${pad2(mesFin)}-${pad2(lastDay)}`;
    return { desde, hasta };
  }, [anio, mesInicio, mesFin]);

  const fetchData = async () => {
    if (!idEmpleado) {
      setErrorMsg('No se encontró el id_empleado del usuario autenticado.');
      setHorasExtraDia([]);
      setTardePorMes([]);
      return;
    }
    setErrorMsg('');
    setLoadingSQL(true);
    try {
      const [h, t] = await Promise.all([
        dashboardService.getHorasExtraPorDia({
          idEmpleado,
          desde: rango.desde,
          hasta: rango.hasta,
          shape: 'recharts'
        }),
        dashboardService.getVecesTardePorMes({
          idEmpleado,
          desde: rango.desde,
          hasta: rango.hasta,
          shape: 'recharts'
        })
      ]);

      setHorasExtraDia(h.success ? h.data : []);
      setTardePorMes(t.success ? t.data : []);

      if (!h.success || !t.success) {
        setErrorMsg(h.error || t.error || 'No se pudieron cargar todos los datos.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Ocurrió un error al obtener los datos.');
      setHorasExtraDia([]);
      setTardePorMes([]);
    } finally {
      setLoading(false);
      setLoadingSQL(false);
    }
  };

  // Carga inicial + cuando cambien el id o el rango
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEmpleado, rango.desde, rango.hasta]);

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mi Dashboard</h1>
          <p className="text-gray-600 mt-2">Resumen de horas extra y llegadas tarde</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Año</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-gray-800"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              >
                {Array.from({ length: 7 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Mes inicio</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-gray-800"
                value={mesInicio}
                onChange={(e) => setMesInicio(Number(e.target.value))}
              >
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{pad2(i+1)} - {m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Mes fin</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-gray-800"
                value={mesFin}
                onChange={(e) => setMesFin(Number(e.target.value))}
              >
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{pad2(i+1)} - {m}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          {/* Rango seleccionado */}
          <div className="mt-3 text-sm text-gray-600">
            Rango: <span className="font-medium text-gray-800">{rango.desde}</span> a{' '}
            <span className="font-medium text-gray-800">{rango.hasta}</span>
            {loadingSQL && <span className="ml-3 text-blue-600">Actualizando…</span>}
          </div>

          {errorMsg && (
            <div className="mt-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}
        </div>

        {/* SOLO DOS GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1) Horas extra por día */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Horas Extra por Día</h2>
            {horasExtraDia.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={horasExtraDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" />
                  <Tooltip formatter={(v) => [`${v} h`, 'Horas extra']} labelFormatter={(l) => `Fecha: ${l}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="horas_extra"
                    name="Horas extra"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Sin datos en el rango seleccionado</p>
              </div>
            )}
          </div>

          {/* 2) Veces que llegó tarde por mes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Llegadas Tarde por Mes</h2>
            {tardePorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={tardePorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Veces tarde']} labelFormatter={(l) => `Mes: ${l}`} />
                  <Legend />
                  <Bar dataKey="veces_tarde" name="Veces tarde" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Sin datos en el rango seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSeccion;
