// src/components/ResidenteDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Importar los componentes de secciones del residente
import {
  DashboardSeccion,
  MantenimientoSeccion,
  ReservasSeccion,
  PagosSeccion,
} from './ResidenteSecciones';

// Importar sección de comunicación para residente
import ComunicacionSeccion from './ResidenteSecciones/ComunicacionSeccion';

const ResidenteDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
    { id: 'reservas', label: 'Reservas', icon: '📅' },
    { id: 'pagos', label: 'Pagos', icon: '💳' },
    { id: 'comunicacion', label: 'Comunicación', icon: '💬' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSeccion />;
      case 'mantenimiento':
        return <MantenimientoSeccion />;
      case 'reservas':
        return <ReservasSeccion />;
      case 'pagos':
        return <PagosSeccion />;
      case 'comunicacion':
        return <ComunicacionSeccion />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel del Residente</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Selecciona una opción del menú para comenzar</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-green-600 to-teal-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-green-500">
          <h2 className="text-xl font-bold mb-4">Residente Panel</h2>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user?.username}</span>
              <span className="text-xs text-green-200 capitalize">{user?.rol}</span>
              {/* Mostrar ID Persona */}
              <span className="text-xs text-green-300 mt-1">ID: {user?.id_persona}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                activeSection === item.id 
                  ? 'bg-white bg-opacity-20 text-white shadow-md' 
                  : 'text-green-100 hover:bg-white hover:bg-opacity-10 hover:shadow-sm'
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-green-500">
          <button
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-green-100 hover:bg-white hover:bg-opacity-10 transition-all duration-200"
            onClick={handleLogout}
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Salir</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center p-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'} - Residente
            </h1>
            <div className="text-gray-600 text-right">
              <div>Bienvenido, <span className="font-semibold text-gray-800">{user?.username}</span></div>
              {/* Mostrar ID Persona en el header */}
              <div className="text-sm text-gray-500">ID Persona: <span className="font-mono">{user?.id_persona}</span></div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default ResidenteDashboard;