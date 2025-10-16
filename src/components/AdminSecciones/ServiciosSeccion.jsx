// src/components/AdminSecciones/ServiciosSeccion.jsx
import React, { useState, useEffect } from 'react';
import servicioService from '../../services/servicioService';
import ticketService from '../../services/TicketService';
// Importamos la información de empresas para mostrar la compañía asociada a cada servicio.
import empresaService from '../../services/EmpresaService';

const ServiciosSeccion = () => {
  const [servicios, setServicios] = useState([]);
  const [tickets, setTickets] = useState([]);
  // Eliminamos estados relacionados con asignaciones y empleados para reflejar el nuevo flujo.
  // const [ticketsSinAsignar, setTicketsSinAsignar] = useState([]);
  // const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModalServicio, setShowModalServicio] = useState(false);
  // Ya no existe el modal de asignar empleado porque el administrador sólo visualiza tickets.
  // const [showModalAsignar, setShowModalAsignar] = useState(false);
  // const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  
  const [nuevoServicio, setNuevoServicio] = useState({
    tipo_servicio: ''
  });
  // Mapa para asociar cada id_servicio con el nombre de la empresa correspondiente.
  const [empresasPorServicio, setEmpresasPorServicio] = useState({});

  // Cargar todos los datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Sólo obtenemos servicios y tickets.  Ya no cargamos tickets sin asignar ni empleados
      const [resultadoServicios, resultadoTickets] = await Promise.all([
        servicioService.obtenerServicios(),
        ticketService.obtenerTickets()
      ]);

      console.log('Servicios cargados:', resultadoServicios);
      console.log('Tickets cargados:', resultadoTickets);

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

  // Cuando la lista de tickets cambia, obtenemos la empresa asociada a cada servicio.
  useEffect(() => {
    const obtenerEmpresas = async () => {
      const map = {};
      for (const ticket of tickets) {
        const idServ = ticket.id_servicio;
        if (idServ && !map[idServ]) {
          try {
            const res = await empresaService.obtenerEmpresaPorServicio(idServ);
            if (res.success) {
              map[idServ] = res.data.nombre;
            }
          } catch (err) {
            console.error('Error obteniendo empresa para servicio', idServ, err);
          }
        }
      }
      setEmpresasPorServicio(map);
    };
    if (tickets.length > 0) {
      obtenerEmpresas();
    } else {
      setEmpresasPorServicio({});
    }
  }, [tickets]);

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

  // Eliminamos las funciones de asignación de empleados y cambio de estado, ya que
  // el administrador sólo visualiza los tickets y no puede asignarlos ni modificarlos.

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

      {/* Modal para crear un nuevo servicio */}
      {showModalServicio && <ModalNuevoServicio />}

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
          <h3 className="text-gray-600 text-sm font-medium mb-2">Pendientes</h3>
          <p className="text-3xl font-bold text-gray-800">{tickets.filter(t => t.estado === 'Pendiente').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Empresas</h3>
          <p className="text-3xl font-bold text-gray-800">{Object.keys(empresasPorServicio).length}</p>
        </div>
      </div>

      {/* El bloque de tickets sin asignar se ha eliminado. Los tickets se gestionan directamente por la empresa asociada al servicio. */}

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

      {/* Tabla de todos los tickets (solo lectura) */}
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
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  {/* Se elimina la columna de acciones en la tabla de tickets */}
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
                        <div>
                          {empresasPorServicio[ticket.id_servicio] ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">Empresa</div>
                              <div className="text-xs text-gray-500">{empresasPorServicio[ticket.id_servicio]}</div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Sin empresa</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getEstadoBadge(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.fecha).toLocaleDateString('es-BO')}
                    </td>
                    {/* La columna de acciones se deja vacía ya que no se permite editar ni eliminar tickets */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"></td>
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