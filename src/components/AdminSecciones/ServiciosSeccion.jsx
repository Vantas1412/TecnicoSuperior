// src/components/AdminSecciones/ServiciosSeccion.jsx
import React, { useState, useEffect } from 'react';
import servicioService from '../../services/servicioService';
import ticketService from '../../services/TicketService';
import empleadoService from '../../services/empleadoService';

const ServiciosSeccion = () => {
  const [servicios, setServicios] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketsSinAsignar, setTicketsSinAsignar] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModalServicio, setShowModalServicio] = useState(false);
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  
  const [nuevoServicio, setNuevoServicio] = useState({
    tipo_servicio: '' // Cambiado de 'tipo' a 'tipo_servicio'
  });

  // Cargar todos los datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [resultadoServicios, resultadoTickets, resultadoTicketsSinAsignar, resultadoEmpleados] = await Promise.all([
        servicioService.obtenerServicios(),
        ticketService.obtenerTickets(),
        ticketService.obtenerTicketsSinAsignar(),
        empleadoService.obtenerEmpleados()
      ]);

      console.log('Servicios cargados:', resultadoServicios);
      console.log('Tickets cargados:', resultadoTickets);
      console.log('Tickets sin asignar:', resultadoTicketsSinAsignar);

      if (resultadoServicios.success) {
        setServicios(resultadoServicios.data);
      } else {
        console.error('Error al cargar servicios:', resultadoServicios.error);
        setError('Error al cargar servicios: ' + resultadoServicios.error);
      }

      if (resultadoTickets.success) {
        setTickets(resultadoTickets.data);
      } else {
        console.error('Error al cargar tickets:', resultadoTickets.error);
      }

      if (resultadoTicketsSinAsignar.success) {
        setTicketsSinAsignar(resultadoTicketsSinAsignar.data);
      } else {
        console.error('Error al cargar tickets sin asignar:', resultadoTicketsSinAsignar.error);
      }

      if (resultadoEmpleados.success) {
        setEmpleados(resultadoEmpleados.data);
      } else {
        console.error('Error al cargar empleados:', resultadoEmpleados.error);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const tiposServicio = [
    'Mantenimiento General',
    'Limpieza de Áreas Comunes',
    'Reparación de Plomería',
    'Reparación Eléctrica',
    'Jardinería',
    'Seguridad',
    'Pintura',
    'Carpintería',
    'Otro'
  ];

  const estadosTicket = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En Proceso': 'bg-blue-100 text-blue-800',
      'Completado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleAgregarServicio = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!nuevoServicio.tipo_servicio) { // Cambiado de 'tipo' a 'tipo_servicio'
        setError('El tipo de servicio es obligatorio');
        return;
      }

      const resultado = await servicioService.crearServicio(nuevoServicio);
      
      if (resultado.success) {
        setSuccess('Servicio creado exitosamente');
        setShowModalServicio(false);
        setNuevoServicio({ tipo_servicio: '' }); // Cambiado de 'tipo' a 'tipo_servicio'
        await cargarDatos();
      } else {
        setError(resultado.error || 'Error al crear el servicio');
      }
    } catch (err) {
      setError('Error de conexión al crear servicio');
      console.error('Error:', err);
    }
  };

  const handleAsignarEmpleado = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const empleadoId = e.target.empleado.value;
      
      if (!empleadoId) {
        setError('Debe seleccionar un empleado');
        return;
      }

      const resultado = await ticketService.asignarEmpleado(
        ticketSeleccionado.id_ticket,
        empleadoId
      );
      
      if (resultado.success) {
        setSuccess('Empleado asignado exitosamente');
        setShowModalAsignar(false);
        setTicketSeleccionado(null);
        await cargarDatos();
      } else {
        setError(resultado.error || 'Error al asignar empleado');
      }
    } catch (err) {
      setError('Error de conexión al asignar empleado');
      console.error('Error:', err);
    }
  };

  const handleCambiarEstadoTicket = async (id_ticket, nuevoEstado) => {
    try {
      setError('');
      const resultado = await ticketService.cambiarEstado(id_ticket, nuevoEstado);
      
      if (resultado.success) {
        setSuccess('Estado actualizado exitosamente');
        await cargarDatos();
      } else {
        setError(resultado.error || 'Error al cambiar el estado');
      }
    } catch (err) {
      setError('Error de conexión al cambiar estado');
      console.error('Error:', err);
    }
  };

  const handleEliminarServicio = async (idServicio, tipoServicio) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el servicio "${tipoServicio}"?`)) {
      try {
        setError('');
        const resultado = await servicioService.eliminarServicio(idServicio);
        
        if (resultado.success) {
          setSuccess('Servicio eliminado exitosamente');
          await cargarDatos();
        } else {
          setError(resultado.error || 'Error al eliminar el servicio');
        }
      } catch (err) {
        setError('Error de conexión al eliminar servicio');
        console.error('Error:', err);
      }
    }
  };

  const abrirModalAsignar = (ticket) => {
    setTicketSeleccionado(ticket);
    setShowModalAsignar(true);
  };

  // Modal para nuevo servicio
  const ModalNuevoServicio = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Nuevo Servicio</h3>
        </div>
        
        <form onSubmit={handleAgregarServicio} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Servicio *
            </label>
            <select
              value={nuevoServicio.tipo_servicio} // Cambiado de 'tipo' a 'tipo_servicio'
              onChange={(e) => setNuevoServicio({...nuevoServicio, tipo_servicio: e.target.value})} // Cambiado aquí también
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar tipo</option>
              {tiposServicio.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowModalServicio(false);
                setNuevoServicio({ tipo_servicio: '' }); // Cambiado de 'tipo' a 'tipo_servicio'
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Crear Servicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Modal para asignar empleado
  const ModalAsignarEmpleado = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Asignar Empleado</h3>
        </div>
        
        <form onSubmit={handleAsignarEmpleado} className="p-6 space-y-4">
          {ticketSeleccionado && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Ticket: {ticketSeleccionado.id_ticket}</h4>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Servicio:</strong> {ticketSeleccionado.servicio?.tipo_servicio}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <strong>Descripción:</strong> {ticketSeleccionado.descripcion}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Solicitante:</strong> {ticketSeleccionado.persona?.nombre} {ticketSeleccionado.persona?.apellido}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Empleado *
            </label>
            <select
              name="empleado"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map(empleado => (
                <option key={empleado.id_empleado} value={empleado.id_empleado}>
                  {empleado.persona?.nombre} {empleado.persona?.apellido} - {empleado.tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowModalAsignar(false);
                setTicketSeleccionado(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Asignar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Servicios y Tickets</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Servicios y Tickets</h2>
        <button 
          onClick={() => setShowModalServicio(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          + Nuevo Servicio
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError('')} className="float-right text-red-800 hover:text-red-900">×</button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
          <button onClick={() => setSuccess('')} className="float-right text-green-800 hover:text-green-900">×</button>
        </div>
      )}

      {/* Modales */}
      {showModalServicio && <ModalNuevoServicio />}
      {showModalAsignar && <ModalAsignarEmpleado />}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Servicios</h3>
          <p className="text-3xl font-bold text-gray-800">{servicios.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Total Tickets</h3>
          <p className="text-3xl font-bold text-gray-800">{tickets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Sin Asignar</h3>
          <p className="text-3xl font-bold text-gray-800">{ticketsSinAsignar.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Empleados</h3>
          <p className="text-3xl font-bold text-gray-800">{empleados.length}</p>
        </div>
      </div>

      {/* Tickets sin asignar */}
      {ticketsSinAsignar.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              ⚠️ Tickets Sin Asignar ({ticketsSinAsignar.length})
            </h3>
          </div>
          <div className="space-y-3">
            {ticketsSinAsignar.map(ticket => (
              <div key={ticket.id_ticket} className="bg-white rounded-lg p-4 border border-orange-300">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{ticket.servicio?.tipo_servicio}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.descripcion}</p>
                    <div className="text-xs text-gray-500">
                      <span>Solicitante: {ticket.persona?.nombre} {ticket.persona?.apellido}</span>
                      <span className="mx-2">•</span>
                      <span>Fecha: {new Date(ticket.fecha).toLocaleDateString('es-BO')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => abrirModalAsignar(ticket)}
                    className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Asignar Empleado
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de servicios */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Servicios Registrados</h3>
          <button onClick={cargarDatos} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded">
            Actualizar
          </button>
        </div>
        
        {servicios.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay servicios registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {servicios.map(servicio => {
                  const ticketsServicio = tickets.filter(t => t.id_servicio === servicio.id_servicio);
                  return (
                    <tr key={servicio.id_servicio} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {servicio.id_servicio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {servicio.tipo_servicio}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>Total: {ticketsServicio.length}</span>
                          <span className="text-orange-600">
                            Pendientes: {ticketsServicio.filter(t => t.estado === 'Pendiente').length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEliminarServicio(servicio.id_servicio, servicio.tipo_servicio)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla de todos los tickets */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Todos los Tickets</h3>
        </div>
        
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay tickets registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado Asignado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map(ticket => (
                  <tr key={ticket.id_ticket} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.id_ticket}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.descripcion}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.servicio?.tipo_servicio || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.persona?.nombre} {ticket.persona?.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ticket.persona?.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.empleado ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.empleado.persona?.nombre} {ticket.empleado.persona?.apellido}
                          </div>
                          <div className="text-xs text-gray-500">
                            {ticket.empleado.tipo}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirModalAsignar(ticket)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Asignar
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={ticket.estado}
                        onChange={(e) => handleCambiarEstadoTicket(ticket.id_ticket, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${getEstadoBadge(ticket.estado)}`}
                      >
                        {estadosTicket.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.fecha).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar este ticket?')) {
                            ticketService.eliminarTicket(ticket.id_ticket).then(() => {
                              setSuccess('Ticket eliminado');
                              cargarDatos();
                            });
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiciosSeccion;