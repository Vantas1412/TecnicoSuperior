// src/components/EmpleadoSecciones/VerTareas.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ticketService from '../../services/TicketService';

const VerTareas = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [error, setError] = useState('');

  // Función para manejar el logout
  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (user && user.empleado) {
      loadTareas();
    }
  }, [user]);

  const loadTareas = async () => {
    setLoading(true);
    setError('');
    try {
      // Verificar que user y user.empleado existan
      if (!user || !user.empleado || !user.empleado.id_empleado) {
        setError('No se pudo obtener la información del empleado. Contacte al administrador.');
        setLoading(false);
        return;
      }

      console.log('ID Empleado:', user.empleado.id_empleado);
      console.log('User completo:', user);

      // Usar el método que agregamos al TicketService
      const result = await ticketService.obtenerTicketsPorEmpleadoCompleto(user.empleado.id_empleado);
      
      if (result.success) {
        setTareas(result.data || []);
      } else {
        setError('Error al cargar las tareas: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      setError('Error al conectar con el servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tareasFiltradas = tareas.filter(tarea => {
    if (filtro === 'todas') return true;
    if (filtro === 'pendientes') return tarea.estado === 'Pendiente' || tarea.estado === 'En Proceso';
    if (filtro === 'completadas') return tarea.estado === 'Completado';
    return true;
  });

  const getEstadoBadge = (estado) => {
    const estados = {
      'Pendiente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'En Proceso': { color: 'bg-blue-100 text-blue-800', label: 'En Proceso' },
      'Completado': { color: 'bg-green-100 text-green-800', label: 'Completado' },
      'Cancelado': { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    };
    return estados[estado] || estados.Pendiente;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No asignada';
    return new Date(fecha).toLocaleDateString('es-BO');
  };

  const handleRecargar = () => {
    loadTareas();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con botón SALIR */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mis Tareas</h1>
            <p className="text-gray-600 mt-2">Gestiona y realiza seguimiento de tus tareas asignadas</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <span>🚪</span>
            <span>SALIR</span>
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <div className="flex space-x-2">
                <button 
                  onClick={handleRecargar}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Reintentar
                </button>
                <button 
                  onClick={() => setError('')}
                  className="text-red-800 hover:text-red-900 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información del empleado */}
        {user && user.empleado && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Información del Empleado</h3>
                <p className="text-gray-600">
                  <strong>Nombre:</strong> {user.persona?.nombre} {user.persona?.apellido}
                </p>
                <p className="text-gray-600">
                  <strong>Cargo:</strong> {user.empleado.tipo}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>ID Empleado:</strong> {user.empleado.id_empleado}
                </p>
                <p className="text-gray-600">
                  <strong>Contrato:</strong> {user.empleado.tipo_de_contrato}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Teléfono:</strong> {user.persona?.telefono || 'No registrado'}
                </p>
                <p className="text-gray-600">
                  <strong>Email:</strong> {user.correo_electronico}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'todas' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas las Tareas
            </button>
            <button
              onClick={() => setFiltro('pendientes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'pendientes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tareas Pendientes
            </button>
            <button
              onClick={() => setFiltro('completadas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtro === 'completadas' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tareas Completadas
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Tareas</h3>
            <p className="text-3xl font-bold text-gray-800">{tareas.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Completadas</h3>
            <p className="text-3xl font-bold text-gray-800">
              {tareas.filter(t => t.estado === 'Completado').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pendientes</h3>
            <p className="text-3xl font-bold text-gray-800">
              {tareas.filter(t => t.estado !== 'Completado').length}
            </p>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Asignación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Finalización
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tareasFiltradas.map((tarea) => {
                  const estadoBadge = getEstadoBadge(tarea.estado);
                  
                  return (
                    <tr key={tarea.id_ticket} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-md">
                          {tarea.descripcion}
                        </div>
                        {tarea.persona && (
                          <div className="text-xs text-gray-500 mt-1">
                            Solicitante: {tarea.persona.nombre} {tarea.persona.apellido}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tarea.tipo}
                        {tarea.servicio && (
                          <div className="text-xs text-gray-400">
                            {tarea.servicio.tipo_servicio}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge.color}`}>
                          {estadoBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFecha(tarea.fecha)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFecha(tarea.fechafin)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tareasFiltradas.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay tareas que mostrar</p>
              <p className="text-gray-400 text-sm mt-2">
                {filtro === 'completadas' 
                  ? 'No hay tareas completadas' 
                  : filtro === 'pendientes'
                  ? 'No hay tareas pendientes'
                  : 'No tienes tareas asignadas'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerTareas;