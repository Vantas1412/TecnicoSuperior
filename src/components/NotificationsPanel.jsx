import React, { useEffect, useState } from 'react';
import { fetchNotifications } from '../services/SupabaseService';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const getNotifications = async () => {
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    getNotifications();
  }, []);

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Notificaciones</h2>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id_notificacion} className="mb-2 border-b pb-2">
              <h3 className="font-semibold">{notification.titulo}</h3>
              <p>{notification.mensaje}</p>
              <small className="text-gray-500">{new Date(notification.fecha_creacion).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay notificaciones disponibles.</p>
      )}
    </div>
  );
};

export default NotificationsPanel;