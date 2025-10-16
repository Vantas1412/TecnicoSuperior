import { useState, useEffect } from 'react';
import usuariosService from '../services/UsuarioService.js';
import notificacionesService from '../services/notificacionesService.js';
import { useAuth } from '../hooks/useAuth';

export default function NotificacionesPanel({ usuarioActualId }) {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [destinatario, setDestinatario] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [notificaciones, setNotificaciones] = useState([]);
  const [filter, setFilter] = useState('all'); // all | unread | read

  useEffect(() => {
    // Cargar usuarios
    async function cargarUsuarios() {
      const res = await usuariosService.obtenerUsuarios();
      if (res.success) setUsuarios(res.data);
    }
    cargarUsuarios();

    // Cargar notificaciones existentes
    async function cargarNotificaciones() {
      if (!usuarioActualId && !user?.id_usuario) return;
      const idToQuery = usuarioActualId || user?.id_usuario;
      const res = await notificacionesService.obtenerNotificacionesPorUsuario(idToQuery);
      if (res.success) setNotificaciones(res.data);
    }
    cargarNotificaciones();

    // Suscripción en tiempo real a nuevas notificaciones
    const idToSub = usuarioActualId || user?.id_usuario;
    const subscription = notificacionesService.suscribirseNuevas(idToSub, (nuevaNotificacion) => {
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
    });

    // Cleanup
    return () => {
      if (subscription) notificacionesService.supabase.removeChannel(subscription);
    };
  }, [usuarioActualId, user?.id_usuario]);

  // 📩 Enviar notificación
  const enviarNotificacion = async () => {
    if (!destinatario || !titulo || !mensaje) return alert('Completa todos los campos');
    const res = await notificacionesService.crearNotificacion(destinatario, titulo, mensaje);
    if (res.success) {
      setTitulo('');
      setMensaje('');
      alert('Notificación enviada');
    } else {
      alert('Error: ' + res.error);
    }
  };

  // 🗑️ Eliminar notificación
  const eliminarNotificacion = async (id_notificacion) => {
    if (!window.confirm('¿Deseas eliminar esta notificación?')) return;
    const res = await notificacionesService.eliminarNotificacion(id_notificacion);
    if (res.success) {
      setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id_notificacion));
    } else {
      alert('Error al eliminar: ' + res.error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Panel de envío */}
      <div className="flex-1 border border-gray-300 p-4 rounded-lg bg-white shadow-md">
        <h2 className="text-xl font-bold mb-4">Enviar Notificación</h2>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Destinatario:</label>
          <select
            className="w-full border rounded p-2"
            value={destinatario}
            onChange={e => setDestinatario(e.target.value)}
          >
            <option value="">Selecciona un usuario</option>
            {usuarios.map(u => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Título:</label>
          <input
            className="w-full border rounded p-2"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">Mensaje:</label>
          <textarea
            className="w-full border rounded p-2"
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          onClick={enviarNotificacion}
        >
          Enviar
        </button>
      </div>

      {/* Panel de notificaciones */}
      <div className="flex-1 border border-gray-300 p-4 rounded-lg bg-white shadow-md">
        <h2 className="text-xl font-bold mb-4">Mis Notificaciones</h2>
        {/* Filtros de notificaciones */}
        <div className="mb-4 flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setFilter('unread')}
          >
            No leídas
          </button>
          <button
            className={`px-3 py-1 rounded ${filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setFilter('read')}
          >
            Leídas
          </button>
        </div>
        {notificaciones.length === 0 ? (
          <p>No hay notificaciones</p>
        ) : (
          <ul className="space-y-3">
            {notificaciones
              .filter(n => {
                if (filter === 'unread') return !n.leido_at;
                if (filter === 'read') return Boolean(n.leido_at);
                return true;
              })
              .map(n => (
                <li
                  key={n.id_notificacion}
                  className="border-b pb-2 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className={`font-semibold ${!n.leido_at ? 'text-gray-800' : 'text-gray-500'}`}>
                      {n.titulo}
                      {!n.leido_at && (
                        <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" title="No leído"></span>
                      )}
                    </div>
                    <p className={`${!n.leido_at ? 'text-gray-700' : 'text-gray-400'} text-sm`}>{n.mensaje}</p>
                    <small className="text-xs text-gray-500">
                      {new Date(n.fecha_creacion).toLocaleString()}
                    </small>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-3">
                    {!n.leido_at && (
                      <button
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={async () => {
                          const res = await notificacionesService.marcarNotificacionLeida(n.id_notificacion);
                          if (res.success) {
                            setNotificaciones(prev => prev.map(notif => notif.id_notificacion === n.id_notificacion ? { ...notif, leido_at: new Date().toISOString() } : notif));
                          }
                        }}
                      >
                        Marcar leída
                      </button>
                    )}
                    <button
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => eliminarNotificacion(n.id_notificacion)}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
