// src/components/CreateAnnouncementForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createAnnouncement } from '../services/SupabaseService';
import notificacionesService from '../services/notificacionesService';
// ...existing code...

/**
 * Formulario para que el administrador cree un nuevo aviso (anuncio).
 * Después de guardar el aviso en la base de datos, envía notificaciones a todos
 * los residentes y empleados, y envía correos electrónicos a los destinatarios.
 */
const CreateAnnouncementForm = () => {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    if (!titulo || !contenido) {
      setMensaje('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      // Crear el aviso en la base de datos. El campo id_emisor está asociado a la tabla
      // `empleado` por una clave foránea en la base de datos. Como los administradores
      // pueden no estar registrados en esa tabla, enviamos null para evitar violaciones
      // de clave foránea. Si deseas guardar el emisor en otra columna sin restricción,
      // deberás ajustar la base de datos en consecuencia.
      await createAnnouncement({ titulo, contenido, id_emisor: null });
      // Enviar notificaciones a residentes y empleados
      await notificacionesService.crearNotificacionTodosResidentes(titulo, contenido);
      await notificacionesService.crearNotificacionTodosEmpleados(titulo, contenido);
      // Enviar correos
  // EmailService eliminado: aquí puedes integrar el nuevo sistema de email si es necesario
      setMensaje('Aviso enviado correctamente.');
      // Limpiar el formulario
      setTitulo('');
      setContenido('');
    } catch (err) {
      console.error('Error al enviar el aviso:', err);
      setMensaje('Ocurrió un error al enviar el aviso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
      <h3 className="text-lg font-semibold mb-2">Crear nuevo aviso</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="Título del aviso"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          className="w-full border border-gray-300 rounded px-2 py-1"
          placeholder="Contenido del aviso"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={4}
        />
        {mensaje && (
          <p className="text-sm text-red-600">{mensaje}</p>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Publicar aviso'}
        </button>
      </form>
    </div>
  );
};

export default CreateAnnouncementForm;