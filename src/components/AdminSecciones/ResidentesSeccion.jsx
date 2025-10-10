// src/components/AdminSecciones/ResidentesSeccion.jsx
import React, { useState, useEffect } from 'react';
import residenteService from '../../services/residenteService';
import viveService from '../../services/ViveService';
import departamentoService from '../../services/DepartamentoService';
import personaService from '../../services/PersonaService';

// Modal para agregar nuevo residente
const ModalAgregarResidente = ({ isOpen, onClose, onSuccess }) => {
  const [personasDisponibles, setPersonasDisponibles] = useState([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState('');
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [estado, setEstado] = useState('activo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarPersonasDisponibles();
      setPersonaSeleccionada('');
      setFechaRegistro(new Date().toISOString().split('T')[0]);
      setEstado('activo');
      setError('');
    }
  }, [isOpen]);

  const cargarPersonasDisponibles = async () => {
    try {
      const resultado = await personaService.obtenerPersonasNoResidentes();
      if (resultado.success) {
        setPersonasDisponibles(resultado.data);
      } else {
        setError('Error al cargar personas disponibles');
      }
    } catch (err) {
      setError('Error de conexión al cargar personas');
      console.error('Error:', err);
    }
  };

  const handleAgregarResidente = async () => {
    if (!personaSeleccionada) {
      setError('Por favor seleccione una persona');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // El ID del residente se generará automáticamente por el trigger en la base de datos
      const nuevoResidente = {
        id_persona: personaSeleccionada,
        fecha_registro: fechaRegistro,
        estado: estado
        // No incluimos id_residente, lo generará el trigger automáticamente
      };

      const resultado = await residenteService.crearResidente(nuevoResidente);
      
      if (resultado.success) {
        onSuccess();
        onClose();
      } else {
        setError(resultado.error || 'Error al crear el residente');
      }
    } catch (err) {
      setError('Error de conexión al crear residente');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Agregar Nuevo Residente
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Persona *
            </label>
            <select
              value={personaSeleccionada}
              onChange={(e) => setPersonaSeleccionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione una persona</option>
              {personasDisponibles.map((persona) => (
                <option key={persona.id_persona} value={persona.id_persona}>
                  {persona.nombre} {persona.apellido} ({persona.id_persona})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Solo se muestran personas que aún no son residentes
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Registro *
            </label>
            <input
              type="date"
              value={fechaRegistro}
              onChange={(e) => setFechaRegistro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarResidente}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Residente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para asignar departamento (existente)
const ModalAsignarDepartamento = ({ isOpen, onClose, residente, onSuccess }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarDepartamentos();
      setDepartamentoSeleccionado('');
      setError('');
    }
  }, [isOpen]);

  const cargarDepartamentos = async () => {
    const resultado = await departamentoService.obtenerDepartamentos();
    if (resultado.success) {
      setDepartamentos(resultado.data);
    }
  };

  const handleAsignar = async () => {
    if (!departamentoSeleccionado) {
      setError('Por favor seleccione un departamento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generar ID único para vive
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const nuevoIdVive = `VIV${timestamp}${random}`;

      const nuevaAsignacion = {
        id_vive: nuevoIdVive,
        id_residente: residente.id_residente,
        id_departamento: departamentoSeleccionado,
        fecha_ini: fechaInicio,
        fecha_fin: null
      };

      const resultado = await viveService.crearVive(nuevaAsignacion);
      
      if (resultado.success) {
        onSuccess();
        onClose();
      } else {
        setError(resultado.error || 'Error al asignar departamento');
      }
    } catch (err) {
      setError('Error de conexión al asignar departamento');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">
            Asignar Departamento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Residente
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">
                {residente?.persona?.nombre} {residente?.persona?.apellido}
              </div>
              <div className="text-sm text-gray-500">
                ID: {residente?.id_residente}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento *
            </label>
            <select
              value={departamentoSeleccionado}
              onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un departamento</option>
              {departamentos.map((dep) => (
                <option key={dep.id_departamento} value={dep.id_departamento}>
                  {dep.id_departamento} - Piso {dep.piso} - {dep.tipo} ({dep.nro_cuartos} cuartos)
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAsignar}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResidentesSeccion = () => {
  const [residentes, setResidentes] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [residenteSeleccionado, setResidenteSeleccionado] = useState(null);

  // Cargar residentes y asignaciones
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [residentesResult, vivesResult] = await Promise.all([
        residenteService.obtenerResidentes(),
        viveService.obtenerVives()
      ]);
      
      if (residentesResult.success) {
        setResidentes(residentesResult.data);
      } else {
        setError(residentesResult.error || 'Error al cargar los residentes');
      }

      if (vivesResult.success) {
        setAsignaciones(vivesResult.data);
      }
    } catch (err) {
      setError('Error de conexión al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Obtener departamento activo de un residente
  const obtenerDepartamentoActivo = (idResidente) => {
    const asignacion = asignaciones.find(
      a => a.id_residente === idResidente && a.fecha_fin === null
    );
    return asignacion?.id_departamento || null;
  };

  // Obtener asignación activa de un residente
  const obtenerAsignacionActiva = (idResidente) => {
    return asignaciones.find(
      a => a.id_residente === idResidente && a.fecha_fin === null
    );
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'activo': 'bg-green-100 text-green-800',
      'inactivo': 'bg-red-100 text-red-800',
      'pendiente': 'bg-yellow-100 text-yellow-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleEliminarResidente = async (idResidente, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al residente ${nombre}?`)) {
      try {
        const resultado = await residenteService.eliminarResidente(idResidente);
        
        if (resultado.success) {
          cargarDatos();
        } else {
          setError(resultado.error || 'Error al eliminar el residente');
        }
      } catch (err) {
        setError('Error de conexión al eliminar residente');
        console.error('Error:', err);
      }
    }
  };

  const handleCambiarEstado = async (idResidente, nuevoEstado) => {
    try {
      const resultado = await residenteService.editarResidente(idResidente, { 
        estado: nuevoEstado 
      });
      
      if (resultado.success) {
        cargarDatos();
      } else {
        setError(resultado.error || 'Error al cambiar el estado');
      }
    } catch (err) {
      setError('Error de conexión al cambiar estado');
      console.error('Error:', err);
    }
  };

  const handleAsignarDepartamento = (residente) => {
    setResidenteSeleccionado(residente);
    setModalAsignarOpen(true);
  };

  const handleEliminarAsignacion = async (idResidente, nombreResidente) => {
    const asignacion = obtenerAsignacionActiva(idResidente);
    
    if (!asignacion) {
      setError('No se encontró asignación activa para este residente');
      return;
    }

    if (window.confirm(`¿Deseas eliminar la asignación del departamento ${asignacion.id_departamento} para ${nombreResidente}?`)) {
      try {
        const resultado = await viveService.eliminarVive(asignacion.id_vive);
        
        if (resultado.success) {
          cargarDatos();
        } else {
          setError(resultado.error || 'Error al eliminar la asignación');
        }
      } catch (err) {
        setError('Error de conexión al eliminar asignación');
        console.error('Error:', err);
      }
    }
  };

  const handleAgregarResidente = () => {
    setModalAgregarOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Residentes</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando residentes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Residentes</h2>
        <button 
          onClick={handleAgregarResidente}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          + Agregar Residente
        </button>
      </div>

      {/* Mostrar error si existe */}
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

      {/* Resto del código de la tabla y estadísticas se mantiene igual */}
      {/* ... (el resto del código de la tabla y estadísticas permanece igual) */}

      {/* Tabla de residentes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Lista de Residentes</h3>
          <button 
            onClick={cargarDatos}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors duration-200"
          >
            🔄 Actualizar
          </button>
        </div>
        
        {residentes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay residentes registrados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Residente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {residentes.map((residente) => {
                  const departamento = obtenerDepartamentoActivo(residente.id_residente);
                  const asignacion = obtenerAsignacionActiva(residente.id_residente);
                  
                  return (
                    <tr key={residente.id_residente} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {residente.persona?.nombre || 'N/A'} {residente.persona?.apellido || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {residente.id_residente}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {residente.persona?.email || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {residente.persona?.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {departamento ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              🏠 {departamento}
                            </span>
                            {asignacion && (
                              <div className="text-xs text-gray-500 mt-1">
                                Desde: {new Date(asignacion.fecha_ini).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(residente.estado)}`}>
                          {residente.estado || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {residente.fecha_registro ? new Date(residente.fecha_registro).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleCambiarEstado(
                                residente.id_residente, 
                                residente.estado === 'activo' ? 'inactivo' : 'activo'
                              )}
                              className={`${
                                residente.estado === 'activo' 
                                  ? 'text-yellow-600 hover:text-yellow-900' 
                                  : 'text-green-600 hover:text-green-900'
                              } transition-colors duration-200`}
                            >
                              {residente.estado === 'activo' ? '⏸️ Desactivar' : '▶️ Activar'}
                            </button>
                            <button 
                              onClick={() => handleEliminarResidente(
                                residente.id_residente,
                                residente.persona?.nombre || 'este residente'
                              )}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                          <div className="flex space-x-2">
                            {departamento ? (
                              <>
                                <button
                                  onClick={() => handleAsignarDepartamento(residente)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                >
                                  🔄 Reasignar
                                </button>
                                <button
                                  onClick={() => handleEliminarAsignacion(
                                    residente.id_residente,
                                    residente.persona?.nombre || 'este residente'
                                  )}
                                  className="text-orange-600 hover:text-orange-900 transition-colors duration-200"
                                >
                                  ❌ Quitar Depto
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleAsignarDepartamento(residente)}
                                className="text-green-600 hover:text-green-900 transition-colors duration-200"
                              >
                                ➕ Asignar Depto
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Información de paginación */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{residentes.length}</span> residentes
            </div>
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalAgregarResidente
        isOpen={modalAgregarOpen}
        onClose={() => setModalAgregarOpen(false)}
        onSuccess={cargarDatos}
      />

      <ModalAsignarDepartamento
        isOpen={modalAsignarOpen}
        onClose={() => setModalAsignarOpen(false)}
        residente={residenteSeleccionado}
        onSuccess={cargarDatos}
      />
    </div>
  );
};

export default ResidentesSeccion;