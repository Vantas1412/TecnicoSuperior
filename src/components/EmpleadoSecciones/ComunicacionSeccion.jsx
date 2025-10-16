// src/components/EmpleadoSecciones/ComunicacionSeccion.jsx
import React, { useState } from 'react';
import AnnouncementsBoard from '../AnnouncementsBoard';
import NotificacionesPanel from '../NotificacionesPanel';
import Polls from '../Polls';
import RoleBasedChat from '../RoleBasedChat';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sección de comunicación para empleados. Proporciona acceso al muro de anuncios,
 * notificaciones, votaciones y chat. Utiliza pestañas para cambiar entre cada herramienta.
 */
const EmpleadoComunicacionSeccion = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('anuncios');

  const tabs = [
    { id: 'anuncios', label: 'Anuncios' },
    { id: 'notificaciones', label: 'Notificaciones' },
    { id: 'votaciones', label: 'Votaciones' },
    { id: 'chat', label: 'Chat' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'anuncios':
        return <AnnouncementsBoard />;
      case 'notificaciones':
        return <NotificacionesPanel usuarioActualId={user?.id_usuario} />;
      case 'votaciones':
        return <Polls />;
      case 'chat':
        return <RoleBasedChat />;
      default:
        return <AnnouncementsBoard />;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Comunicación</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EmpleadoComunicacionSeccion;