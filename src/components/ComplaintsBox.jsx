import React, { useState, useEffect } from 'react';
import { submitComplaint, fetchComplaintsByUser } from '../services/SupabaseService';
import { useAuth } from '../hooks/useAuth';

const ComplaintsBox = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    const getComplaints = async () => {
      try {
        // Obtener sólo las quejas del usuario actual, si existe
        if (user?.id_usuario) {
          const data = await fetchComplaintsByUser(user.id_usuario);
          setComplaints(data);
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    };

    getComplaints();
  }, [user?.id_usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComplaint.trim()) return;
    try {
      // Siempre registrar el ID del usuario para mantener la relación, pero usar el flag anonima
      const complaint = {
        descripcion: newComplaint,
        usuario_id: user?.id_usuario || null,
        fecha: new Date().toISOString(),
        anonima: isAnonymous,
      };
      await submitComplaint(complaint);
      setNewComplaint('');
      setIsAnonymous(false);
      // Recargar sólo las quejas del usuario
      if (user?.id_usuario) {
        const updatedComplaints = await fetchComplaintsByUser(user.id_usuario);
        setComplaints(updatedComplaints);
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Buzón de Quejas</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Escribe tu queja aquí..."
          value={newComplaint}
          onChange={(e) => setNewComplaint(e.target.value)}
        ></textarea>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <label htmlFor="anonymous" className="ml-2">Enviar de forma anónima</label>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Enviar Queja
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-2">Mis Quejas</h3>
      {complaints.length > 0 ? (
        <ul>
          {complaints.map((complaint) => (
            <li key={complaint.id_queja} className="mb-2 border-b pb-2">
              <p className="mb-1">{complaint.descripcion}</p>
              <small className="text-gray-500 block">
                {complaint.anonima ? 'Anónimo' : `Usuario: ${user?.username || user?.id_usuario}`}
                {' '}– {new Date(complaint.fecha).toLocaleString()}
              </small>
              {/* Mostrar la respuesta del administrador si existe */}
              {complaint.respuesta_admin && (
                <div className="mt-1 text-sm text-green-700">
                  <strong>Respuesta:</strong> {complaint.respuesta_admin}
                  <br />
                  <span className="text-xs text-gray-500">Respondido el {new Date(complaint.respondido_at).toLocaleString()}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay quejas registradas.</p>
      )}
    </div>
  );
};

export default ComplaintsBox;