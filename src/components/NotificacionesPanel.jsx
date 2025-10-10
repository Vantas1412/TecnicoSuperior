import { useState, useEffect } from 'react';
import usuariosService from '../services/UsuarioService.js';
import notificacionesService from '../services/notificacionesService.js';

export default function NotificacionesPanel({ usuarioActualId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [destinatario, setDestinatario] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    // Cargar usuarios
    async function cargarUsuarios() {
      const res = await usuariosService.obtenerUsuarios();
      if (res.success) setUsuarios(res.data);
    }
    cargarUsuarios();

    // Cargar notificaciones existentes
    async function cargarNotificaciones() {
      const res = await notificacionesService.obtenerNotificacionesPorUsuario(usuarioActualId);
      if (res.success) setNotificaciones(res.data);
    }
    cargarNotificaciones();

    // Suscripción en tiempo real a nuevas notificaciones
    const subscription = notificacionesService.suscribirseNuevas(usuarioActualId, (nuevaNotificacion) => {
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
    });

    // Cleanup
    return () => {
      if (subscription) notificacionesService.supabase.removeChannel(subscription);
    };
  }, [usuarioActualId]);

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
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Panel de envío */}
      <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem', borderRadius: '10px' }}>
        <h2>Enviar Notificación</h2>
        <div>
          <label>Destinatario:</label>
          <select value={destinatario} onChange={e => setDestinatario(e.target.value)}>
            <option value="">Selecciona un usuario</option>
            {usuarios.map(u => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Título:</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} />
        </div>
        <div>
          <label>Mensaje:</label>
          <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} />
        </div>
        <button onClick={enviarNotificacion}>Enviar</button>
      </div>

      {/* Panel de notificaciones */}
      <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem', borderRadius: '10px' }}>
        <h2>Mis Notificaciones</h2>
        {notificaciones.length === 0 ? (
          <p>No hay notificaciones</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {notificaciones.map(n => (
              <li
                key={n.id_notificacion}
                style={{
                  borderBottom: '1px solid #ddd',
                  marginBottom: '0.5rem',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{n.titulo}</strong>: {n.mensaje} <br />
                  <small>{new Date(n.fecha_creacion).toLocaleString()}</small>
                </div>
                <button
                  onClick={() => eliminarNotificacion(n.id_notificacion)}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
