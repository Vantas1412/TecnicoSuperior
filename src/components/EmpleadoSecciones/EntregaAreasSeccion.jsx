// src/components/EmpleadoSecciones/EntregaAreasSeccion.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import reservaService from '../../services/ReservaService';
import toast from 'react-hot-toast';

const EntregaAreasSeccion = () => {
  const { user, profile } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);
  const [filtro, setFiltro] = useState('pendientes'); // 'todas', 'pendientes', 'entregadas'

  const [formEntrega, setFormEntrega] = useState({
    estado_entrega: '',
    descripcion_entrega: '',
    entregado_a_nombre: ''
  });

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    setLoading(true);
    try {
      // Obtener solo reservas aprobadas (que están listas para entregar)
      const result = await reservaService.obtenerReservasCompletas({
        estado: 'Aprobada'
      });

      if (result.success) {
        setReservas(result.data || []);
      } else {
        toast.error('Error al cargar reservas');
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEntrega = (reserva) => {
    setReservaSeleccionada(reserva);
    setFormEntrega({
      estado_entrega: reserva.estado_entrega || '',
      descripcion_entrega: reserva.descripcion_entrega || '',
      entregado_a_nombre: reserva.entregado_a_nombre || ''
    });
    setMostrandoModal(true);
  };

  const handleRegistrarEntrega = async (e) => {
    e.preventDefault();

    if (!formEntrega.estado_entrega) {
      toast.error('Debes seleccionar un estado de entrega');
      return;
    }

    if (!formEntrega.entregado_a_nombre.trim()) {
      toast.error('Debes ingresar el nombre de quien recibe');
      return;
    }

    try {
      const resultado = await reservaService.registrarEntrega(
        reservaSeleccionada.id_reserva,
        {
          estado_entrega: formEntrega.estado_entrega,
          descripcion_entrega: formEntrega.descripcion_entrega,
          entregado_a_nombre: formEntrega.entregado_a_nombre,
          fecha_entrega: new Date().toISOString(),
          entregado_por: profile?.nombre + ' ' + profile?.apellido || user.email
        }
      );

      if (resultado.success) {
        toast.success('✅ Estado de entrega registrado exitosamente');
        setMostrandoModal(false);
        setReservaSeleccionada(null);
        await cargarReservas();
      } else {
        toast.error(resultado.error || 'Error al registrar la entrega');
      }
    } catch (error) {
      console.error('Error al registrar entrega:', error);
      toast.error('Error al procesar la solicitud');
    }
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Excelente': 'bg-green-100 text-green-800',
      'Bueno': 'bg-blue-100 text-blue-800',
      'Regular': 'bg-yellow-100 text-yellow-800',
      'Malo': 'bg-orange-100 text-orange-800',
      'Dañado': 'bg-red-100 text-red-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const reservasFiltradas = reservas.filter(reserva => {
    if (filtro === 'pendientes') return !reserva.estado_entrega;
    if (filtro === 'entregadas') return reserva.estado_entrega;
    return true; // 'todas'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Mejorado */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
              <span className="text-4xl">🔑</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Entrega de Áreas Comunes</h1>
              <p className="mt-2 text-green-50 text-lg">
                Gestión profesional del estado de entrega y recepción
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-yellow-500 bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-3xl font-bold text-white">{reservas.filter(r => !r.estado_entrega).length}</div>
              <div className="text-yellow-100 text-sm font-semibold">Pendientes</div>
            </div>
            <div className="bg-emerald-500 bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-3xl font-bold text-white">{reservas.filter(r => r.estado_entrega).length}</div>
              <div className="text-emerald-100 text-sm font-semibold">Entregadas</div>
            </div>
            <div className="bg-blue-500 bg-opacity-90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="text-3xl font-bold text-white">{reservas.length}</div>
              <div className="text-blue-100 text-sm font-semibold">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-gray-600 font-medium mr-2">Filtrar por:</span>
          <button
            onClick={() => setFiltro('pendientes')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              filtro === 'pendientes'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>⏳</span>
              <span>Pendientes</span>
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                {reservas.filter(r => !r.estado_entrega).length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setFiltro('entregadas')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              filtro === 'entregadas'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>✅</span>
              <span>Entregadas</span>
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                {reservas.filter(r => r.estado_entrega).length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setFiltro('todas')}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              filtro === 'todas'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📋</span>
              <span>Todas</span>
              <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
                {reservas.length}
              </span>
            </span>
          </button>
          <button
            onClick={cargarReservas}
            className="ml-auto px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Lista de Reservas Mejorada */}
      <div className="grid gap-5">
        {reservasFiltradas.length > 0 ? (
          reservasFiltradas.map(reserva => (
            <div 
              key={reserva.id_reserva} 
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Header de la tarjeta */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-600 rounded-xl p-3">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {reserva.nombre_area}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ID: {reserva.id_reserva}
                      </p>
                    </div>
                  </div>
                  {reserva.estado_entrega && (
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-md ${getEstadoBadge(reserva.estado_entrega)}`}>
                      {reserva.estado_entrega}
                    </span>
                  )}
                </div>
              </div>

              {/* Contenido de la tarjeta */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">👤</span>
                      <span className="text-xs font-semibold text-blue-600 uppercase">Residente</span>
                    </div>
                    <p className="font-bold text-gray-800">{reserva.residente_nombre}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📅</span>
                      <span className="text-xs font-semibold text-purple-600 uppercase">Fecha</span>
                    </div>
                    <p className="font-bold text-gray-800">
                      {new Date(reserva.fecha_reservacion).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🕐</span>
                      <span className="text-xs font-semibold text-orange-600 uppercase">Horario</span>
                    </div>
                    <p className="font-bold text-gray-800">
                      {reserva.hora_inicio?.slice(0,5)} - {reserva.hora_fin?.slice(0,5)}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📞</span>
                      <span className="text-xs font-semibold text-teal-600 uppercase">Teléfono</span>
                    </div>
                    <p className="font-bold text-gray-800">{reserva.residente_telefono || 'N/A'}</p>
                  </div>
                </div>

                {reserva.estado_entrega && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📋</span>
                      <h4 className="font-bold text-green-800">Información de Entrega</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-green-700 block mb-1">RECIBIDO POR:</span>
                        <span className="font-bold text-gray-800">{reserva.entregado_a_nombre}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-green-700 block mb-1">FECHA DE ENTREGA:</span>
                        <span className="font-bold text-gray-800">
                          {new Date(reserva.fecha_entrega).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                    {reserva.descripcion_entrega && (
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <span className="text-xs font-semibold text-green-700 block mb-1">OBSERVACIONES:</span>
                        <p className="text-gray-700 italic text-sm">"{reserva.descripcion_entrega}"</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => abrirModalEntrega(reserva)}
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-105 ${
                      reserva.estado_entrega
                        ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{reserva.estado_entrega ? '📝' : '🔑'}</span>
                      <span>{reserva.estado_entrega ? 'Editar Entrega' : 'Registrar Entrega'}</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">
                {filtro === 'pendientes' ? '⏳' : filtro === 'entregadas' ? '✅' : '📋'}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              No hay reservas {filtro === 'pendientes' ? 'pendientes de entrega' : filtro === 'entregadas' ? 'entregadas' : 'disponibles'}
            </h3>
            <p className="text-gray-500 text-lg">
              {filtro === 'pendientes' && 'Todas las áreas han sido entregadas o no hay reservas aprobadas'}
              {filtro === 'entregadas' && 'Aún no se han registrado entregas de áreas'}
              {filtro === 'todas' && 'No hay reservas aprobadas en el sistema'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Registro de Entrega Mejorado */}
      {mostrandoModal && reservaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="bg-gradient-to-br from-green-500 via-green-600 to-teal-600 text-white p-8 relative overflow-hidden flex-shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-white bg-opacity-20 rounded-xl p-3 backdrop-blur-sm">
                    <span className="text-4xl">🔑</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Registrar Estado de Entrega</h2>
                    <p className="text-green-100 mt-1 text-lg">
                      {reservaSeleccionada.nombre_area}
                    </p>
                  </div>
                </div>
                <div className="bg-green-700 bg-opacity-40 backdrop-blur-sm rounded-xl p-4 mt-3 border border-green-400 border-opacity-30">
                  <p className="font-bold text-white text-lg">👤 {reservaSeleccionada.residente_nombre}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegistrarEntrega} className="p-8 space-y-6 flex-grow overflow-y-auto">
              {/* Estado de Entrega Mejorado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Estado de Entrega *
                </label>
                <select
                  value={formEntrega.estado_entrega}
                  onChange={(e) => setFormEntrega({...formEntrega, estado_entrega: e.target.value})}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-lg font-medium bg-gray-50 hover:bg-white"
                  required
                >
                  <option value="">Seleccionar estado...</option>
                  <option value="Excelente">🟢 Excelente - Todo en perfecto estado</option>
                  <option value="Bueno">🔵 Bueno - Estado satisfactorio</option>
                  <option value="Regular">🟡 Regular - Estado aceptable</option>
                  <option value="Malo">🟠 Malo - Requiere atención</option>
                  <option value="Dañado">🔴 Dañado - Daños significativos</option>
                </select>
              </div>

              {/* Nombre de quien recibe Mejorado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Recibido por (Nombre completo) *
                </label>
                <input
                  type="text"
                  value={formEntrega.entregado_a_nombre}
                  onChange={(e) => setFormEntrega({...formEntrega, entregado_a_nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-200 text-lg bg-gray-50 hover:bg-white"
                  required
                />
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>Nombre del empleado o persona que está recibiendo el área común</span>
                </p>
              </div>

              {/* Descripción/Observaciones Mejorado */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                  Observaciones
                </label>
                <textarea
                  value={formEntrega.descripcion_entrega}
                  onChange={(e) => setFormEntrega({...formEntrega, descripcion_entrega: e.target.value})}
                  placeholder="Describe cualquier observación relevante sobre el estado del área..."
                  rows="4"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-200 resize-none bg-gray-50 hover:bg-white"
                />
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <span>📝</span>
                  <span>Opcional: Detalles sobre daños, limpieza, objetos olvidados, etc.</span>
                </p>
              </div>

              {/* Info de la reserva Mejorada */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                  <span>📋</span>
                  <span>Información de la Reserva</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 block mb-1">FECHA</span>
                    <span className="text-gray-800 font-bold">{new Date(reservaSeleccionada.fecha_reservacion).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 block mb-1">HORARIO</span>
                    <span className="text-gray-800 font-bold">{reservaSeleccionada.hora_inicio?.slice(0,5)} - {reservaSeleccionada.hora_fin?.slice(0,5)}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 block mb-1">RESIDENTE</span>
                    <span className="text-gray-800 font-bold">{reservaSeleccionada.residente_nombre}</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <span className="text-xs font-bold text-blue-600 block mb-1">TELÉFONO</span>
                    <span className="text-gray-800 font-bold">{reservaSeleccionada.residente_telefono || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Botones Mejorados */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setMostrandoModal(false);
                    setReservaSeleccionada(null);
                  }}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-sm hover:shadow-md"
                >
                  ❌ Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ✅ Registrar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntregaAreasSeccion;
