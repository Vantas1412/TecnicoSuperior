// src/components/AdminSecciones/AreasReservasSeccion.jsx
import React, { useState, useEffect } from 'react';
import reservaService from '../../services/ReservaService';
import areaComunService from '../../services/AreaComunService';
import toast from 'react-hot-toast';

const AreasReservasSeccion = () => {
  const [tabActiva, setTabActiva] = useState('reservas'); // 'reservas', 'areas', 'estadisticas'
  const [reservas, setReservas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    id_area: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  // Estados para modales
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todas las reservas
      const resultReservas = await reservaService.obtenerReservasCompletas();
      if (resultReservas.success) {
        setReservas(resultReservas.data || []);
      }

      // Cargar todas las áreas
      const resultAreas = await areaComunService.obtenerTodasAreas();
      if (resultAreas.success) {
        setAreas(resultAreas.data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobarReserva = async (idReserva) => {
    try {
      const resultado = await reservaService.aprobarReserva(idReserva);
      if (resultado.success) {
        toast.success('Reserva aprobada exitosamente');
        cargarDatos();
      } else {
        toast.error(resultado.error || 'Error al aprobar la reserva');
      }
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error('Error al aprobar la reserva');
    }
  };

  const handleRechazarReserva = async () => {
    if (!motivoRechazo.trim()) {
      toast.error('Debes ingresar un motivo de rechazo');
      return;
    }

    try {
      const resultado = await reservaService.rechazarReserva(
        reservaSeleccionada.id_reserva,
        motivoRechazo
      );
      
      if (resultado.success) {
        toast.success('Reserva rechazada');
        setModalRechazoAbierto(false);
        setMotivoRechazo('');
        cargarDatos();
      } else {
        toast.error(resultado.error || 'Error al rechazar la reserva');
      }
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error('Error al rechazar la reserva');
    }
  };

  const abrirModalRechazo = (reserva) => {
    setReservaSeleccionada(reserva);
    setModalRechazoAbierto(true);
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Aprobada': 'bg-green-100 text-green-800 border-green-300',
      'Rechazada': 'bg-red-100 text-red-800 border-red-300',
      'Cancelada': 'bg-gray-100 text-gray-800 border-gray-300',
      'Completada': 'bg-blue-100 text-blue-800 border-blue-300',
      'En Uso': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.slice(0, 5);
  };

  const reservasFiltradas = reservas.filter(reserva => {
    if (filtros.estado && reserva.estado !== filtros.estado) return false;
    if (filtros.id_area && reserva.id_registro_area !== filtros.id_area) return false;
    if (filtros.fecha_desde && reserva.fecha_reservacion < filtros.fecha_desde) return false;
    if (filtros.fecha_hasta && reserva.fecha_reservacion > filtros.fecha_hasta) return false;
    return true;
  });

  const estadisticas = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === 'Pendiente').length,
    aprobadas: reservas.filter(r => r.estado === 'Aprobada').length,
    rechazadas: reservas.filter(r => r.estado === 'Rechazada').length,
    completadas: reservas.filter(r => r.estado === 'Completada').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Cargando información...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Gestión de Áreas Comunes</h2>
        <p className="text-gray-600 mt-1">Administración de reservas y áreas comunes del condominio</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setTabActiva('reservas')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                tabActiva === 'reservas'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Gestión de Reservas
            </button>
            <button
              onClick={() => setTabActiva('areas')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                tabActiva === 'areas'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏢 Gestión de Áreas
            </button>
            <button
              onClick={() => setTabActiva('estadisticas')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                tabActiva === 'estadisticas'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Estadísticas
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* TAB: GESTIÓN DE RESERVAS */}
          {tabActiva === 'reservas' && (
            <div>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Completada">Completada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
                  <select
                    value={filtros.id_area}
                    onChange={(e) => setFiltros({ ...filtros, id_area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas</option>
                    {areas.map(area => (
                      <option key={area.id_area} value={area.id_area}>
                        {area.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                  <input
                    type="date"
                    value={filtros.fecha_desde}
                    onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                  <input
                    type="date"
                    value={filtros.fecha_hasta}
                    onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Resumen rápido */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-800">{estadisticas.total}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-800">{estadisticas.pendientes}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">Aprobadas</p>
                  <p className="text-2xl font-bold text-green-800">{estadisticas.aprobadas}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-800">{estadisticas.rechazadas}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">Completadas</p>
                  <p className="text-2xl font-bold text-blue-800">{estadisticas.completadas}</p>
                </div>
              </div>

              {/* Tabla de reservas */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Residente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          No hay reservas con los filtros seleccionados
                        </td>
                      </tr>
                    ) : (
                      reservasFiltradas.map((reserva) => (
                        <tr key={reserva.id_reserva} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                            {reserva.id_reserva}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reserva.nombre_residente} {reserva.apellido_residente}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reserva.telefono_residente}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{reserva.nombre_area}</div>
                            <div className="text-sm text-gray-500">{reserva.ubicacion_area}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatearFecha(reserva.fecha_reservacion)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatearHora(reserva.hora_inicio)} - {formatearHora(reserva.hora_fin)}
                            </div>
                            <div className="text-xs text-orange-600">
                              +limpieza: {formatearHora(reserva.hora_fin_con_limpieza)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getEstadoBadge(reserva.estado)}`}>
                              {reserva.estado}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {reserva.estado === 'Pendiente' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAprobarReserva(reserva.id_reserva)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                                >
                                  ✓ Aprobar
                                </button>
                                <button
                                  onClick={() => abrirModalRechazo(reserva)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                                >
                                  ✗ Rechazar
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setReservaSeleccionada(reserva);
                                setModalDetalleAbierto(true);
                              }}
                              className="mt-1 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GESTIÓN DE ÁREAS */}
          {tabActiva === 'areas' && (
            <div>
              <p className="text-gray-600 text-center py-8">
                Módulo de gestión de áreas en desarrollo... 🚧
              </p>
            </div>
          )}

          {/* TAB: ESTADÍSTICAS */}
          {tabActiva === 'estadisticas' && (
            <div>
              <p className="text-gray-600 text-center py-8">
                Módulo de estadísticas en desarrollo... 📊
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle de Reserva */}
      {modalDetalleAbierto && reservaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Detalle de Reserva</h3>
                <button
                  onClick={() => setModalDetalleAbierto(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Reserva</p>
                    <p className="font-mono font-semibold">{reservaSeleccionada.id_reserva}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getEstadoBadge(reservaSeleccionada.estado)}`}>
                      {reservaSeleccionada.estado}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Información del Residente</h4>
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {reservaSeleccionada.nombre_residente} {reservaSeleccionada.apellido_residente}</p>
                  <p className="text-sm"><span className="font-medium">Teléfono:</span> {reservaSeleccionada.telefono_residente}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Información del Área</h4>
                  <p className="text-sm"><span className="font-medium">Área:</span> {reservaSeleccionada.nombre_area}</p>
                  <p className="text-sm"><span className="font-medium">Ubicación:</span> {reservaSeleccionada.ubicacion_area}</p>
                  <p className="text-sm"><span className="font-medium">Capacidad:</span> {reservaSeleccionada.capacidad_area} personas</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Horario</h4>
                  <p className="text-sm"><span className="font-medium">Fecha:</span> {formatearFecha(reservaSeleccionada.fecha_reservacion)}</p>
                  <p className="text-sm"><span className="font-medium">Hora inicio:</span> {formatearHora(reservaSeleccionada.hora_inicio)}</p>
                  <p className="text-sm"><span className="font-medium">Hora fin:</span> {formatearHora(reservaSeleccionada.hora_fin)}</p>
                  <p className="text-sm text-orange-600"><span className="font-medium">Fin con limpieza:</span> {formatearHora(reservaSeleccionada.hora_fin_con_limpieza)}</p>
                </div>

                {reservaSeleccionada.estado_entrega && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Estado de Entrega</h4>
                    <p className="text-sm"><span className="font-medium">Estado:</span> {reservaSeleccionada.estado_entrega}</p>
                    {reservaSeleccionada.descripcion_entrega && (
                      <p className="text-sm"><span className="font-medium">Descripción:</span> {reservaSeleccionada.descripcion_entrega}</p>
                    )}
                    {reservaSeleccionada.entregado_a_nombre && (
                      <p className="text-sm"><span className="font-medium">Recibido por:</span> {reservaSeleccionada.entregado_a_nombre}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setModalDetalleAbierto(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {modalRechazoAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Rechazar Reserva</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Reserva de: <span className="font-medium">{reservaSeleccionada?.nombre_residente} {reservaSeleccionada?.apellido_residente}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Área: <span className="font-medium">{reservaSeleccionada?.nombre_area}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows="4"
                  placeholder="Explica por qué se rechaza esta reserva..."
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setModalRechazoAbierto(false);
                    setMotivoRechazo('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazarReserva}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={!motivoRechazo.trim()}
                >
                  Rechazar Reserva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreasReservasSeccion;
