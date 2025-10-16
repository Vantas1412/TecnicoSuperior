// src/components/AdminSecciones/NotificacionesSeccion.jsx
import React, { useState, useEffect } from 'react';
import notificacionesService from '../../services/notificacionesService';

const NotificacionesSeccion = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipoDestino: 'todos',
    usuarioEspecifico: '',
    titulo: '',
    mensaje: ''
  });

  // Agregar tipo_destino a cada notificación basado en el rol del usuario
  const agregarTipoDestino = async (notificaciones) => {
    const notificacionesConTipo = await Promise.all(
      notificaciones.map(async (notif) => {
        try {
          // Obtener información del usuario
          const { data: usuario, error } = await notificacionesService.supabase
            .from('usuario')
            .select('rol')
            .eq('id_usuario', notif.id_usuario)
            .single();

          if (error || !usuario) {
            return { ...notif, tipo_destino: 'desconocido' };
          }

          // Determinar tipo_destino basado en el rol
          let tipo_destino = 'individual';
          if (usuario.rol === 'residente') {
            tipo_destino = 'residente_especifico';
          } else if (usuario.rol === 'empleado') {
            tipo_destino = 'empleado_especifico';
          } else if (usuario.rol === 'admin') {
            tipo_destino = 'admin';
          }

          return { ...notif, tipo_destino };
        } catch (err) {
          console.error('Error al obtener tipo de usuario:', err);
          return { ...notif, tipo_destino: 'desconocido' };
        }
      })
    );

    return notificacionesConTipo;
  };

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar notificaciones
      const resultadoNotificaciones = await notificacionesService.obtenerTodasNotificaciones();
      if (!resultadoNotificaciones.success) {
        throw new Error(resultadoNotificaciones.error || 'Error al cargar notificaciones');
      }

      // Agregar tipo_destino a las notificaciones
      const notificacionesConTipo = await agregarTipoDestino(resultadoNotificaciones.data || []);
      setNotificaciones(notificacionesConTipo);

    } catch (err) {
      setError(err.message || 'Error de conexión al cargar datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar residentes y empleados cuando se abra el formulario
  const cargarPersonas = async () => {
    try {
      setLoadingPersonas(true);
      setError('');
      
      const [resultadoResidentes, resultadoEmpleados] = await Promise.all([
        notificacionesService.obtenerResidentes(),
        notificacionesService.obtenerEmpleados()
      ]);

      if (resultadoResidentes.success) {
        setResidentes(resultadoResidentes.data || []);
      } else {
        console.error('Error al cargar residentes:', resultadoResidentes.error);
      }

      if (resultadoEmpleados.success) {
        setEmpleados(resultadoEmpleados.data || []);
      } else {
        console.error('Error al cargar empleados:', resultadoEmpleados.error);
      }

    } catch (err) {
      console.error('Error al cargar personas:', err);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingPersonas(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cuando se abra el formulario, cargar las personas
  useEffect(() => {
    if (showForm) {
      cargarPersonas();
    }
  }, [showForm]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (!formData.titulo.trim() || !formData.mensaje.trim()) {
        setError('Título y mensaje son obligatorios');
        return;
      }

      let resultado;

      switch (formData.tipoDestino) {
        case 'todos':
          resultado = await notificacionesService.crearNotificacionGlobal(
            formData.titulo,
            formData.mensaje
          );
          break;

        case 'todos_residentes':
          resultado = await notificacionesService.crearNotificacionTodosResidentes(
            formData.titulo,
            formData.mensaje
          );
          break;

        case 'todos_empleados':
          resultado = await notificacionesService.crearNotificacionTodosEmpleados(
            formData.titulo,
            formData.mensaje
          );
          break;

        case 'residente_especifico':
          if (!formData.usuarioEspecifico) {
            setError('Debe seleccionar un residente');
            return;
          }
          resultado = await notificacionesService.crearNotificacionIndividual(
            formData.usuarioEspecifico,
            formData.titulo,
            formData.mensaje,
            'residente_especifico'
          );
          break;

        case 'empleado_especifico':
          if (!formData.usuarioEspecifico) {
            setError('Debe seleccionar un empleado');
            return;
          }
          resultado = await notificacionesService.crearNotificacionIndividual(
            formData.usuarioEspecifico,
            formData.titulo,
            formData.mensaje,
            'empleado_especifico'
          );
          break;

        default:
          setError('Tipo de destino no válido');
          return;
      }

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al enviar notificación');
      }

      setSuccess('Notificación enviada correctamente');
      setShowForm(false);
      setFormData({
        tipoDestino: 'todos',
        usuarioEspecifico: '',
        titulo: '',
        mensaje: ''
      });
      await cargarDatos();
    } catch (err) {
      setError(err.message || 'Error de conexión al enviar notificación');
    }
  };

  // Manejar eliminación
  const handleEliminar = async (id_notificacion) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      return;
    }

    try {
      setError('');
      const resultado = await notificacionesService.eliminarNotificacion(id_notificacion);
      
      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al eliminar notificación');
      }

      setSuccess('Notificación eliminada correctamente');
      await cargarDatos();
    } catch (err) {
      setError(err.message || 'Error de conexión al eliminar notificación');
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const fechaNotif = new Date(fecha);
    const diffMs = ahora - fechaNotif;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) return 'Ahora mismo';
    if (diffMinutos < 60) return `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return fechaNotif.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obtener descripción del destino
  const getDescripcionDestino = (notificacion) => {
    const tipos = {
      'todos': 'Todos los usuarios',
      'todos_residentes': 'Todos los residentes',
      'todos_empleados': 'Todos los empleados',
      'residente_especifico': 'Residente específico',
      'empleado_especifico': 'Empleado específico',
      'admin': 'Administrador',
      'desconocido': 'Usuario individual'
    };
    
    return tipos[notificacion.tipo_destino] || notificacion.tipo_destino;
  };

  // Obtener color según el tipo de destino
  const getColorNotificacion = (tipo_destino) => {
    const colores = {
      'todos_residentes': { border: 'border-blue-500', bg: 'bg-blue-50' },
      'todos_empleados': { border: 'border-green-500', bg: 'bg-green-50' },
      'residente_especifico': { border: 'border-blue-400', bg: 'bg-blue-50' },
      'empleado_especifico': { border: 'border-green-400', bg: 'bg-green-50' },
      'todos': { border: 'border-purple-500', bg: 'bg-purple-50' },
      'admin': { border: 'border-orange-500', bg: 'bg-orange-50' }
    };
    return colores[tipo_destino] || { border: 'border-gray-500', bg: 'bg-gray-50' };
  };

  // Obtener texto del badge según el tipo de destino
  const getBadgeText = (tipo_destino) => {
    const textos = {
      'todos': 'Global',
      'todos_residentes': 'Todos Residentes',
      'todos_empleados': 'Todos Empleados',
      'residente_especifico': 'Residente',
      'empleado_especifico': 'Empleado',
      'admin': 'Admin',
      'desconocido': 'Individual'
    };
    return textos[tipo_destino] || tipo_destino;
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Centro de Notificaciones</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Centro de Notificaciones</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          + Nueva Notificación
        </button>
      </div>

      {/* Mensajes de éxito y error */}
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

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
          <button 
            onClick={() => setSuccess('')}
            className="float-right text-green-800 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Notificación</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selección de destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destino de la notificación *
              </label>
              <select
                value={formData.tipoDestino}
                onChange={(e) => setFormData({...formData, tipoDestino: e.target.value, usuarioEspecifico: ''})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="todos">Todos los usuarios (Global)</option>
                <option value="todos_residentes">Todos los residentes</option>
                <option value="todos_empleados">Todos los empleados</option>
                <option value="residente_especifico">Residente específico</option>
                <option value="empleado_especifico">Empleado específico</option>
              </select>
            </div>

            {/* Selección de usuario específico */}
            {(formData.tipoDestino === 'residente_especifico' || formData.tipoDestino === 'empleado_especifico') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.tipoDestino === 'residente_especifico' ? 'Seleccionar residente' : 'Seleccionar empleado'} *
                </label>
                {loadingPersonas ? (
                  <div className="text-sm text-gray-500">Cargando opciones...</div>
                ) : (
                  <select
                    value={formData.usuarioEspecifico}
                    onChange={(e) => setFormData({...formData, usuarioEspecifico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una opción</option>
                    {formData.tipoDestino === 'residente_especifico' 
                      ? residentes.map(residente => (
                          <option key={residente.id_usuario} value={residente.id_usuario}>
                            {residente.nombre} {residente.apellido} - {residente.username}
                          </option>
                        ))
                      : empleados.map(empleado => (
                          <option key={empleado.id_usuario} value={empleado.id_usuario}>
                            {empleado.nombre} {empleado.apellido} - {empleado.cargo}
                          </option>
                        ))
                    }
                  </select>
                )}
              </div>
            )}

            {/* Título y mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                placeholder="Título de la notificación"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje *
              </label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => setFormData({...formData, mensaje: e.target.value})}
                placeholder="Contenido del mensaje"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    tipoDestino: 'todos',
                    usuarioEspecifico: '',
                    titulo: '',
                    mensaje: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingPersonas}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPersonas ? 'Cargando...' : 'Enviar Notificación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Historial de Notificaciones ({notificaciones.length})
          </h3>
          <button 
            onClick={cargarDatos}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors duration-200"
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        
        {notificaciones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay notificaciones registradas
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notificaciones.map((notificacion) => {
              const color = getColorNotificacion(notificacion.tipo_destino);
              return (
                <div 
                  key={notificacion.id_notificacion}
                  className={`p-4 border-l-4 ${color.border} ${color.bg}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{notificacion.titulo}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notificacion.tipo_destino.includes('residente') 
                            ? 'bg-blue-100 text-blue-800'
                            : notificacion.tipo_destino.includes('empleado')
                            ? 'bg-green-100 text-green-800'
                            : notificacion.tipo_destino === 'todos'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getBadgeText(notificacion.tipo_destino)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notificacion.mensaje}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>Destino: {getDescripcionDestino(notificacion)}</span>
                        <span className="mx-2">•</span>
                        <span>Usuario: {notificacion.id_usuario || 'Múltiples'}</span>
                        <span className="mx-2">•</span>
                        <span>{formatearFecha(notificacion.fecha_creacion)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEliminar(notificacion.id_notificacion)}
                        className="text-red-600 hover:text-red-900 text-sm transition-colors duration-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacionesSeccion;