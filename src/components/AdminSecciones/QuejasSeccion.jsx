// src/components/AdminSecciones/QuejasSeccion.jsx
import React, { useState, useEffect } from 'react';
import { fetchComplaints, respondComplaint } from '../../services/SupabaseService';
import emailService from '../../services/EmailService';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sección de administración del buzón de quejas.
 * Permite ver todas las quejas enviadas por residentes, identificar si son anónimas y
 * responderlas. Al responder se actualizan los campos respuesta_admin, respondido_por y respondido_at
 * en la tabla buzon_quejas.
 */
const QuejasSeccion = () => {
  const { user } = useAuth();
  const [quejas, setQuejas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const cargarQuejas = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchComplaints();
      setQuejas(data || []);
    } catch (e) {
      setError('Error al cargar el buzón de quejas');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarQuejas();
  }, []);

  const handleRespuestaChange = (id_queja, value) => {
    setRespuestas(prev => ({ ...prev, [id_queja]: value }));
  };

  const manejarResponder = async (id_queja) => {
    if (!respuestas[id_queja]) return;
    try {
      // Obtener la queja actual para saber si es anónima y quién la envió
      const quejaActual = quejas.find((q) => q.id_queja === id_queja);
      await respondComplaint(id_queja, respuestas[id_queja], user?.id_usuario || null);
      // Si la queja no es anónima y tiene usuario_id, enviar un correo al residente
      if (quejaActual && !quejaActual.anonima && quejaActual.usuario_id) {
        try {
          await emailService.sendComplaintResponseEmail(quejaActual.usuario_id, respuestas[id_queja]);
        } catch (emailErr) {
          console.error('Error enviando correo de respuesta de queja:', emailErr);
        }
      }
      setRespuestas(prev => ({ ...prev, [id_queja]: '' }));
      cargarQuejas();
    } catch (e) {
      console.error('Error al responder la queja:', e);
      setError('No se pudo responder la queja');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Buzón de Quejas</h2>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {quejas.length === 0 ? (
        <p className="text-gray-600">No hay quejas registradas.</p>
      ) : (
        <div className="space-y-4">
          {quejas.map((queja) => (
            <div key={queja.id_queja} className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex justify-between">
                <div>
                  <p className="text-gray-700 mb-1">
                    <strong>Queja:</strong> {queja.descripcion}
                  </p>
                  <p className="text-gray-500 text-sm">
                    <strong>Fecha:</strong> {new Date(queja.fecha).toLocaleString()}
                  </p>
                  <p className="text-gray-500 text-sm">
                    <strong>Usuario:</strong>{' '}
                    {queja.anonima ? 'Anónimo' : queja.usuario_id || 'Desconocido'}
                  </p>
                </div>
              </div>
              {queja.respuesta_admin ? (
                <div className="mt-3">
                  <p className="text-green-700">
                    <strong>Respuesta:</strong> {queja.respuesta_admin}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Respondido el {new Date(queja.respondido_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    placeholder="Escribe tu respuesta..."
                    value={respuestas[queja.id_queja] || ''}
                    onChange={(e) => handleRespuestaChange(queja.id_queja, e.target.value)}
                  />
                  <button
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    onClick={() => manejarResponder(queja.id_queja)}
                  >
                    Enviar respuesta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuejasSeccion;