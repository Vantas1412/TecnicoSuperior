// src/components/ResidenteSecciones/MantenimientoSeccion.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TicketService from '../../services/TicketService';
import ServicioService from '../../services/ServicioService';

const MantenimientoSeccion = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviciosLoading, setServiciosLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nuevoTicket, setNuevoTicket] = useState({
    id_servicio: '',
    descripcion: ''
  });

  useEffect(() => {
    cargarServicios();
    cargarTickets();
  }, [user?.id_persona]);

  const cargarServicios = async () => {
    try {
      setServiciosLoading(true);
      const result = await ServicioService.obtenerServicios();
      
      if (result.success) {
        setServicios(result.data || []);
      } else {
        console.error('Error al cargar servicios:', result.error);
        setError('Error al cargar los servicios disponibles');
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setError('Error al cargar los servicios disponibles');
    } finally {
      setServiciosLoading(false);
    }
  };

  const cargarTickets = async () => {
    if (!user?.id_persona) return;
    
    setLoading(true);
    setError('');

    try {
      const resultTickets = await TicketService.obtenerTickets();
      if (resultTickets.success) {
        // Filtrar solo los tickets del residente actual
        const ticketsDelResidente = resultTickets.data.filter(
          ticket => ticket.id_persona === user.id_persona
        );
        setTickets(ticketsDelResidente);
      } else {
        console.error('Error al cargar tickets:', resultTickets.error);
        setError('Error al cargar las solicitudes existentes');
      }
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      setError('Error al cargar las solicitudes existentes');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatos = async () => {
    await Promise.all([cargarServicios(), cargarTickets()]);
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    
    if (!nuevoTicket.id_servicio || !nuevoTicket.descripcion) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const ticketData = {
        id_persona: user.id_persona,
        id_servicio: nuevoTicket.id_servicio,
        descripcion: nuevoTicket.descripcion,
        estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0]
        // El tipo se asignará automáticamente por el trigger
      };

      const resultado = await TicketService.crearTicket(ticketData);
      
      if (resultado.success) {
        setSuccess('Ticket creado exitosamente. Será asignado a un empleado pronto.');
        setNuevoTicket({
          id_servicio: '',
          descripcion: ''
        });
        // Recargar la lista de tickets
        await cargarTickets();
      } else {
        setError(resultado.error || 'Error al crear el ticket');
      }

    } catch (error) {
      console.error('Error al crear ticket:', error);
      setError('Error al crear el ticket. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServicioNombre = (id_servicio) => {
    const servicio = servicios.find(s => s.id_servicio === id_servicio);
    return servicio ? servicio.tipo_servicio : 'Servicio no encontrado';
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Mantenimiento</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Formulario para nuevo ticket */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Solicitud</h3>
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Servicio <span className="text-red-500">*</span>
            </label>
            {serviciosLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-gray-500">Cargando servicios...</span>
              </div>
            ) : (
              <>
                <select
                  value={nuevoTicket.id_servicio}
                  onChange={(e) => setNuevoTicket({...nuevoTicket, id_servicio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id_servicio} value={servicio.id_servicio}>
                      {servicio.tipo_servicio}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {servicios.length} servicios disponibles. El tipo de ticket se asignará automáticamente.
                </p>
              </>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Problema <span className="text-red-500">*</span>
            </label>
            <textarea
              value={nuevoTicket.descripcion}
              onChange={(e) => setNuevoTicket({...nuevoTicket, descripcion: e.target.value})}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Describe el problema en detalle. Incluye ubicación específica, síntomas, y cualquier información relevante..."
              required
              disabled={loading || serviciosLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || serviciosLoading || !nuevoTicket.id_servicio || !nuevoTicket.descripcion}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creando solicitud...
              </>
            ) : (
              'Crear Solicitud de Mantenimiento'
            )}
          </button>
        </form>
      </div>

      {/* Información de servicios disponibles */}
      {servicios.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">📋 Servicios Disponibles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {servicios.map(servicio => (
              <div key={servicio.id_servicio} className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-700">{servicio.tipo_servicio}</span>
                <span className="text-xs text-gray-500 font-mono">({servicio.id_servicio})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de tickets existentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Mis Solicitudes</h3>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-500">
              {tickets.length} solicitud{tickets.length !== 1 ? 'es' : ''}
            </span>
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id_ticket} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800 text-lg">
                        {getServicioNombre(ticket.id_servicio)}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.tipo === 'Limpieza' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {ticket.tipo || 'Por asignar'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{ticket.descripcion}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                      <div>
                        <span className="font-medium">Fecha:</span> {ticket.fecha}
                      </div>
                      <div>
                        <span className="font-medium">Ticket ID:</span> {ticket.id_ticket}
                      </div>
                      <div>
                        <span className="font-medium">Servicio:</span> {ticket.id_servicio}
                      </div>
                      {ticket.fechafin && (
                        <div>
                          <span className="font-medium">Completado:</span> {ticket.fechafin}
                        </div>
                      )}
                    </div>

                    {ticket.empleado && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <span className="font-medium">Empleado asignado:</span>{' '}
                        {ticket.empleado.persona?.nombre} {ticket.empleado.persona?.apellido} 
                        {ticket.empleado.tipo && ` (${ticket.empleado.tipo})`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Creado el {new Date(ticket.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  
                  {ticket.estado === 'Pendiente' && (
                    <div className="text-xs text-orange-600 font-medium">
                      Esperando asignación de empleado
                    </div>
                  )}
                  
                  {ticket.estado === 'En Proceso' && (
                    <div className="text-xs text-blue-600 font-medium">
                      En proceso de reparación
                    </div>
                  )}
                  
                  {ticket.estado === 'Completado' && (
                    <div className="text-xs text-green-600 font-medium">
                      Completado satisfactoriamente
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🔧</div>
            <p className="text-gray-500 text-lg mb-2">No hay solicitudes de mantenimiento</p>
            <p className="text-gray-400 text-sm">Crea tu primera solicitud usando el formulario superior</p>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Proceso de Solicitud</h4>
          <ul className="text-blue-700 space-y-1">
            <li>1. Creas la solicitud</li>
            <li>2. Se asigna automáticamente el tipo</li>
            <li>3. Un empleado es asignado</li>
            <li>4. Seguimiento del progreso</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">⏱️ Tiempos de Respuesta</h4>
          <ul className="text-green-700 space-y-1">
            <li><strong>Alta:</strong> 24-48 horas</li>
            <li><strong>Media:</strong> 3-5 días</li>
            <li><strong>Baja:</strong> 5-7 días</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">ℹ️ Información</h4>
          <p className="text-purple-700">
            <strong>Servicios cargados:</strong> {servicios.length}
            <br />
            <strong>ID Residente:</strong> {user?.id_persona}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MantenimientoSeccion;