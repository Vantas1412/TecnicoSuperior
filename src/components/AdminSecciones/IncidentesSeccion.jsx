// src/components/AdminSecciones/IncidentesSeccion.jsx
import React, { useState, useEffect } from 'react';
import incidenteService from '../../services/IncidenteService';
import personaService from '../../services/PersonaService';
import areaComunService from '../../services/AreaComunService';

const IncidentesSeccion = () => {
  const [incidentes, setIncidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [personas, setPersonas] = useState([]);
  const [areasComunes, setAreasComunes] = useState([]);
  
  // Estado para el nuevo incidente
  const [nuevoIncidente, setNuevoIncidente] = useState({
    tipo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    estado: 'Pendiente'
  });
  const [personasAfectadas, setPersonasAfectadas] = useState([]);
  const [areasAfectadas, setAreasAfectadas] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [descripcionEvidencia, setDescripcionEvidencia] = useState('');

  const cargarIncidentes = async () => {
    try {
      setLoading(true);
      setError('');

      const resultado = await incidenteService.obtenerIncidentesConDepartamentos();
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al cargar incidentes');
      }

      setIncidentes(resultado.data);

      const resultadoEstadisticas = await incidenteService.obtenerEstadisticasIncidentes();
      if (resultadoEstadisticas.success) {
        setEstadisticas(resultadoEstadisticas.data);
      }
    } catch (err) {
      setError(err.message || 'Error de conexión al cargar incidentes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosFormulario = async () => {
    try {
      // Cargar personas
      const resultadoPersonas = await personaService.obtenerPersonas();
      if (resultadoPersonas.success) {
        setPersonas(resultadoPersonas.data);
      }

      // Cargar áreas comunes
      const resultadoAreas = await areaComunService.obtenerAreasComunes();
      if (resultadoAreas.success) {
        setAreasComunes(resultadoAreas.data);
      }
    } catch (err) {
      console.error('Error al cargar datos del formulario:', err);
    }
  };

  useEffect(() => {
    cargarIncidentes();
    cargarDatosFormulario();
  }, []);

  const handleAgregarPersonaAfectada = (idPersona) => {
    if (idPersona && !personasAfectadas.includes(idPersona)) {
      setPersonasAfectadas([...personasAfectadas, idPersona]);
    }
  };

  const handleQuitarPersonaAfectada = (idPersona) => {
    setPersonasAfectadas(personasAfectadas.filter(id => id !== idPersona));
  };

  const handleAgregarAreaAfectada = (idArea) => {
    if (idArea && !areasAfectadas.includes(idArea)) {
      setAreasAfectadas([...areasAfectadas, idArea]);
    }
  };

  const handleQuitarAreaAfectada = (idArea) => {
    setAreasAfectadas(areasAfectadas.filter(id => id !== idArea));
  };

  const handleAgregarEvidencia = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const nuevasEvidencias = files.map(file => ({
        file,
        descripcion: descripcionEvidencia || `Evidencia: ${file.name}`
      }));
      setEvidencias([...evidencias, ...nuevasEvidencias]);
      setDescripcionEvidencia(''); // Limpiar descripción después de agregar
    }
  };

  const handleQuitarEvidencia = (index) => {
    setEvidencias(evidencias.filter((_, i) => i !== index));
  };

  const handleSubmitIncidente = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validaciones básicas
      if (!nuevoIncidente.tipo || !nuevoIncidente.descripcion) {
        setError('Tipo y descripción son obligatorios');
        return;
      }

      // Preparar datos de evidencias (opcional)
      const evidenciasData = evidencias.map(evidenciaItem => ({
        descripcion: evidenciaItem.descripcion,
        urlfoto: evidenciaItem.file ? URL.createObjectURL(evidenciaItem.file) : null
      }));

      const incidenteData = {
        incidente: nuevoIncidente,
        personasAfectadas: personasAfectadas,
        areasAfectadas: areasAfectadas,
        evidencias: evidenciasData
      };

      const resultado = await incidenteService.crearIncidente(incidenteData);
      
      if (resultado.success) {
        setShowModal(false);
        resetFormulario();
        await cargarIncidentes();
      } else {
        setError(resultado.error || 'Error al crear el incidente');
      }
    } catch (err) {
      setError('Error de conexión al crear incidente');
      console.error('Error:', err);
    }
  };

  const resetFormulario = () => {
    setNuevoIncidente({
      tipo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      estado: 'Pendiente'
    });
    setPersonasAfectadas([]);
    setAreasAfectadas([]);
    setEvidencias([]);
    setDescripcionEvidencia('');
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En Proceso': 'bg-blue-100 text-blue-800',
      'Resuelto': 'bg-green-100 text-green-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTipoBadge = (tipo) => {
    const estilos = {
      'Ruido excesivo': 'bg-red-100 text-red-800',
      'Fuga de agua': 'bg-blue-100 text-blue-800',
      'Electricidad': 'bg-yellow-100 text-yellow-800',
      'Limpieza': 'bg-green-100 text-green-800',
      'Seguridad': 'bg-purple-100 text-purple-800'
    };
    return estilos[tipo] || 'bg-gray-100 text-gray-800';
  };

  const handleCambiarEstado = async (idIncidente, nuevoEstado) => {
    try {
      const resultado = await incidenteService.cambiarEstadoIncidente(idIncidente, nuevoEstado);
      if (resultado.success) {
        await cargarIncidentes();
      } else {
        setError(resultado.error || 'Error al cambiar el estado');
      }
    } catch (err) {
      setError('Error de conexión al cambiar estado');
      console.error('Error:', err);
    }
  };

  const incidentesFiltrados = filtroEstado === 'todos' 
    ? incidentes 
    : incidentes.filter(incidente => incidente.estado === filtroEstado);

  // Modal para registrar incidente
  const ModalRegistroIncidente = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Reportar Nuevo Incidente</h3>
        </div>
        
        <form onSubmit={handleSubmitIncidente} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información básica del incidente */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Información del Incidente</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={nuevoIncidente.tipo}
                  onChange={(e) => setNuevoIncidente({...nuevoIncidente, tipo: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Ruido excesivo">Ruido excesivo</option>
                  <option value="Fuga de agua">Fuga de agua</option>
                  <option value="Electricidad">Electricidad</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Fecha y Hora</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={nuevoIncidente.fecha}
                  onChange={(e) => setNuevoIncidente({...nuevoIncidente, fecha: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  value={nuevoIncidente.hora}
                  onChange={(e) => setNuevoIncidente({...nuevoIncidente, hora: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              value={nuevoIncidente.descripcion}
              onChange={(e) => setNuevoIncidente({...nuevoIncidente, descripcion: e.target.value})}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa el incidente en detalle..."
              required
            />
          </div>

          {/* Personas Afectadas */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Personas Afectadas</h4>
            <div className="space-y-3">
              <select
                onChange={(e) => handleAgregarPersonaAfectada(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar persona afectada</option>
                {personas.map(persona => (
                  <option key={persona.id_persona} value={persona.id_persona}>
                    {persona.nombre} {persona.apellido} {persona.departamento && `- Depto. ${persona.departamento.tipo}`}
                  </option>
                ))}
              </select>
              
              <div className="flex flex-wrap gap-2">
                {personasAfectadas.map(idPersona => {
                  const persona = personas.find(p => p.id_persona === idPersona);
                  return persona ? (
                    <div key={idPersona} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      {persona.nombre} {persona.apellido}
                      <button
                        type="button"
                        onClick={() => handleQuitarPersonaAfectada(idPersona)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Áreas Afectadas */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Áreas Comunes Afectadas</h4>
            <div className="space-y-3">
              <select
                onChange={(e) => handleAgregarAreaAfectada(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar área común afectada</option>
                {areasComunes.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nombre} - {area.tipo}
                  </option>
                ))}
              </select>
              
              <div className="flex flex-wrap gap-2">
                {areasAfectadas.map(idArea => {
                  const area = areasComunes.find(a => a.id_area === idArea);
                  return area ? (
                    <div key={idArea} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                      {area.nombre}
                      <button
                        type="button"
                        onClick={() => handleQuitarAreaAfectada(idArea)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Evidencias (Opcional) */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Evidencias (Opcional)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la evidencia</label>
                <input
                  type="text"
                  value={descripcionEvidencia}
                  onChange={(e) => setDescripcionEvidencia(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la evidencia..."
                />
              </div>
              
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleAgregarEvidencia}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <div className="text-sm text-gray-500">
                Las evidencias son opcionales. Puede subir fotos, videos o documentos.
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              {evidencias.map((evidenciaItem, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-sm text-gray-600">{evidenciaItem.file.name}</span>
                    {evidenciaItem.descripcion && (
                      <div className="text-xs text-gray-500">{evidenciaItem.descripcion}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuitarEvidencia(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Reportar Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Incidentes</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando incidentes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Incidentes</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          + Reportar Incidente
        </button>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-800 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Modal de registro */}
      {showModal && <ModalRegistroIncidente />}

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Incidentes</h3>
            <p className="text-3xl font-bold text-gray-800">{estadisticas.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Pendientes</h3>
            <p className="text-3xl font-bold text-gray-800">{estadisticas.porEstado.Pendiente || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">En Proceso</h3>
            <p className="text-3xl font-bold text-gray-800">{estadisticas.porEstado['En Proceso'] || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Resueltos</h3>
            <p className="text-3xl font-bold text-gray-800">{estadisticas.porEstado.Resuelto || 0}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
          {['todos', 'Pendiente', 'En Proceso', 'Resuelto'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                filtroEstado === estado
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {estado === 'todos' ? 'Todos' : estado}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de incidentes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Incidentes {filtroEstado !== 'todos' && `- ${filtroEstado}`}
          </h3>
          <button 
            onClick={cargarIncidentes}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors duration-200"
          >
            Actualizar
          </button>
        </div>
        
        {incidentesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay incidentes {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : 'registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incidente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personas Afectadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Áreas Afectadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidentesFiltrados.map((incidente) => (
                  <tr key={incidente.id_incidente} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoBadge(incidente.tipo)}`}>
                            {incidente.tipo}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {incidente.descripcion}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {incidente.id_incidente}
                        </div>
                        {incidente.evidencias.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {incidente.evidencias.length} evidencia(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {incidente.personas_afectadas.length > 0 ? (
                        <div className="space-y-1">
                          {incidente.personas_afectadas.slice(0, 3).map((persona, index) => (
                            <div key={index} className="text-sm text-gray-900">
                              {persona.nombre} {persona.apellido}
                              {persona.departamento && (
                                <div className="text-xs text-gray-500">
                                  Depto. {persona.departamento.tipo} - Piso {persona.departamento.piso}
                                </div>
                              )}
                            </div>
                          ))}
                          {incidente.personas_afectadas.length > 3 && (
                            <div className="text-xs text-blue-600">
                              +{incidente.personas_afectadas.length - 3} más
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No especificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {incidente.areas_afectadas.length > 0 ? (
                        <div className="space-y-1">
                          {incidente.areas_afectadas.slice(0, 2).map((area, index) => (
                            <div key={index} className="text-sm text-gray-900">
                              {area.nombre}
                              <div className="text-xs text-gray-500">{area.tipo}</div>
                            </div>
                          ))}
                          {incidente.areas_afectadas.length > 2 && (
                            <div className="text-xs text-blue-600">
                              +{incidente.areas_afectadas.length - 2} más
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No especificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(incidente.fecha).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {incidente.hora}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(incidente.estado)}`}>
                        {incidente.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {incidente.estado === 'Pendiente' && (
                          <button
                            onClick={() => handleCambiarEstado(incidente.id_incidente, 'En Proceso')}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            Iniciar
                          </button>
                        )}
                        {incidente.estado === 'En Proceso' && (
                          <button
                            onClick={() => handleCambiarEstado(incidente.id_incidente, 'Resuelto')}
                            className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          >
                            Resolver
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                          Ver Detalles
                        </button>
                      </div>
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

export default IncidentesSeccion;