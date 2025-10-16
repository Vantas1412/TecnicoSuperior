import React, { useEffect, useState } from 'react';
import { fetchAnnouncements } from '../services/SupabaseService';
import { useAuth } from '../hooks/useAuth';

const AnnouncementsBoard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  // Para simplificar el manejo de avisos en un entorno donde la tabla `aviso_visto` puede no
  // coincidir con el esquema local, mantenemos un estado local de avisos vistos pero no
  // realizamos llamadas al backend para marcarlos. Esto evita errores de tipo UUID al
  // interactuar con supabase.
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    const getAnnouncements = async () => {
      try {
        const data = await fetchAnnouncements();
        setAnnouncements(data);
        // En esta versión no consultamos la tabla aviso_visto para evitar problemas de tipos.
        setViewedIds([]);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    getAnnouncements();
  }, [user?.id_usuario]);

  // Cuando el usuario haga clic en un aviso, simplemente lo marcamos como leído en el estado local.
  const handleView = (id_aviso) => {
    if (!user?.id_usuario) return;
    // Evitar duplicados en local
    if (!viewedIds.includes(id_aviso)) {
      setViewedIds((prev) => [...prev, id_aviso]);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Muro de Anuncios</h2>
      {announcements.length > 0 ? (
        <ul>
          {announcements.map((announcement) => {
            const isRead = viewedIds.includes(announcement.id_aviso);
            return (
              <li
                key={announcement.id_aviso}
                className={`mb-2 border-b pb-2 cursor-pointer ${isRead ? 'opacity-60' : ''}`}
                onClick={() => handleView(announcement.id_aviso)}
              >
                <h3 className="font-semibold flex items-center">
                  {announcement.titulo}
                  {!isRead && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" title="Nuevo"></span>
                  )}
                </h3>
                <p>{announcement.contenido}</p>
                <small className="text-gray-500">
                  {new Date(announcement.fecha).toLocaleString()}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No hay anuncios disponibles.</p>
      )}
    </div>
  );
};

export default AnnouncementsBoard;