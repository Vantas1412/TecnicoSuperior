import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import evidenciaService from '../../services/EvidenciaTrabajoService'; // Nuevo servicio

const MandarEvidencia = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'exito' o 'error'
  const [evidenciasRecientes, setEvidenciasRecientes] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_evidencia: 'foto',
    fecha: new Date().toISOString().split('T')[0],
    archivos: []
  });

  const [archivosPreviews, setArchivosPreviews] = useState([]);

  // Función para mostrar mensajes
  const mostrarMensaje = (mensaje, tipo = 'exito') => {
    setMensaje(mensaje);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(''), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tipos de archivo
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/avi',
      'video/mov'
    ];
    
    const validFiles = files.filter(file => {
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      mostrarMensaje(
        'Algunos archivos no son válidos. Solo se permiten imágenes (JPG, PNG, GIF), documentos (PDF, DOC, DOCX) y videos (MP4, AVI, MOV) hasta 10MB',
        'error'
      );
    }

    setFormData(prev => ({
      ...prev,
      archivos: [...prev.archivos, ...validFiles]
    }));

    // Crear previews para imágenes
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setArchivosPreviews(prev => [...prev, {
            name: file.name,
            url: e.target.result,
            type: 'image',
            fileObject: file
          }]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        setArchivosPreviews(prev => [...prev, {
          name: file.name,
          type: 'video',
          icon: '🎬',
          fileObject: file
        }]);
      } else {
        setArchivosPreviews(prev => [...prev, {
          name: file.name,
          type: 'document',
          icon: getFileIcon(file.name),
          fileObject: file
        }]);
      }
    });
  };

  const getFileIcon = (filename) => {
    if (filename.toLowerCase().endsWith('.pdf')) return '📕';
    if (filename.toLowerCase().endsWith('.doc') || filename.toLowerCase().endsWith('.docx')) return '📘';
    return '📄';
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== index)
    }));
    setArchivosPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // En la función handleSubmit, actualiza esta parte:
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar que el empleado exista
      if (!user?.empleado?.id_empleado) {
        throw new Error('No se pudo identificar al empleado. Por favor, contacte al administrador.');
      }

      console.log('Datos del formulario:', formData);
      console.log('ID Empleado:', user.empleado.id_empleado);

      // Crear objeto de evidencia para enviar a la BD
      const evidenciaData = {
        id_empleado: user.empleado.id_empleado,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo_evidencia: formData.tipo_evidencia,
        fecha_evidencia: formData.fecha,
        archivos: formData.archivos
      };

      console.log('Enviando datos al servicio:', evidenciaData);

      // Enviar evidencia al servicio
      const result = await evidenciaService.crearEvidencia(evidenciaData);
      
      console.log('Respuesta del servicio:', result);
      
      if (result.success) {
        mostrarMensaje('✅ Evidencia enviada correctamente y guardada en el sistema');
        
        // Reset form
        setFormData({
          titulo: '',
          descripcion: '',
          tipo_evidencia: 'foto',
          fecha: new Date().toISOString().split('T')[0],
          archivos: []
        });
        setArchivosPreviews([]);
        
        // Recargar evidencias recientes
        cargarEvidenciasRecientes();
      } else {
        throw new Error(result.error || 'Error al enviar la evidencia al servidor');
      }
      
    } catch (error) {
      console.error('Error completo enviando evidencia:', error);
      mostrarMensaje(`❌ ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarEvidenciasRecientes = async () => {
    if (!user?.empleado?.id_empleado) return;
    
    try {
      const result = await evidenciaService.obtenerEvidenciasPorEmpleado(user.empleado.id_empleado);
      if (result.success) {
        setEvidenciasRecientes(result.data || []);
      }
    } catch (error) {
      console.error('Error cargando evidencias recientes:', error);
    }
  };

  const isFormValid = formData.titulo.trim() && formData.descripcion.trim() && formData.archivos.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mandar Evidencia</h1>
          <p className="text-gray-600 mt-2">Sube fotos y documentos como evidencia de tu trabajo</p>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg ${
            tipoMensaje === 'exito' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del empleado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Información del Remitente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-700">Empleado</label>
                  <p className="text-blue-900 font-semibold">
                    {user?.persona?.nombre} {user?.persona?.apellido}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Cargo</label>
                  <p className="text-blue-900 font-semibold">
                    {user?.empleado?.tipo || 'Empleado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">ID Empleado</label>
                  <p className="text-blue-900 font-semibold">
                    {user?.empleado?.id_empleado || 'No disponible'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Fecha de Envío</label>
                  <p className="text-blue-900 font-semibold">
                    {new Date().toLocaleDateString('es-BO')}
                  </p>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la Evidencia *
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Limpieza área común - Edificio A"
                  required
                />
              </div>

              <div>
                <label htmlFor="tipo_evidencia" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evidencia *
                </label>
                <select
                  id="tipo_evidencia"
                  name="tipo_evidencia"
                  value={formData.tipo_evidencia}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="foto">Fotografía</option>
                  <option value="documento">Documento</option>
                  <option value="video">Video</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de la Evidencia *
              </label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe detalladamente la evidencia que estás enviando, incluyendo ubicación, hora, y cualquier información relevante..."
                required
              />
            </div>

            {/* Subida de archivos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivos de Evidencia *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.mp4,.avi,.mov"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <span>📎</span>
                  <span>Seleccionar Archivos</span>
                </label>
                <p className="text-gray-500 mt-2 text-sm">
                  Formatos permitidos: JPG, PNG, GIF, PDF, DOC, DOCX, MP4, AVI, MOV (Máx. 10MB por archivo)
                </p>
              </div>
            </div>

            {/* Previews de archivos */}
            {archivosPreviews.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Archivos seleccionados ({archivosPreviews.length}):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archivosPreviews.map((preview, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 relative">
                      {preview.type === 'image' ? (
                        <div className="text-center">
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="h-24 w-full object-cover rounded-md mb-2"
                          />
                          <p className="text-xs text-gray-600 truncate">{preview.name}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-3xl mb-2">{preview.icon}</div>
                          <p className="text-xs text-gray-600 truncate">{preview.name}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">Importante</h4>
                  <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                    <li>Asegúrate de que las fotos sean claras y muestren el trabajo realizado</li>
                    <li>Los documentos deben estar legibles y completos</li>
                    <li>Incluye fecha y hora en la descripción si es relevante</li>
                    <li>El tamaño máximo por archivo es 10MB</li>
                    <li>La evidencia será revisada por administración</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  isFormValid && !loading
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>Enviar Evidencia</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Historial reciente */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Evidencias Enviadas Recientemente</h3>
            <button
              onClick={cargarEvidenciasRecientes}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Actualizar
            </button>
          </div>
          
          {evidenciasRecientes.length > 0 ? (
            <div className="space-y-4">
              {evidenciasRecientes.map((evidencia) => (
                <div key={evidencia.id_evidencia_trabajo} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{evidencia.titulo}</h4>
                      <p className="text-sm text-gray-600 mt-1">{evidencia.descripcion}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Tipo: {evidencia.tipo_evidencia}</span>
                        <span>Fecha: {new Date(evidencia.fecha_evidencia).toLocaleDateString('es-BO')}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          evidencia.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                          evidencia.estado === 'revisado' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {evidencia.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay evidencias enviadas recientemente</p>
              <p className="text-gray-400 text-sm mt-2">
                Las evidencias que envíes aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MandarEvidencia;