// src/components/AdminDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Importar los componentes de secciones
import {
  DashboardSeccion,
  ServiciosSeccion, // Cambiado de MantenimientoSeccion
  NotificacionesSeccion,
  PersonalSeccion,
  IncidentesSeccion,
  ResidentesSeccion,
  EntradasSeccion
} from './AdminSecciones';
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'residentes', label: 'Residentes', icon: '👨‍👩‍👧‍👦' },
    { id: 'personal', label: 'Personal', icon: '👥' },
    { id: 'servicios', label: 'Servicios', icon: '🔧' },
    { id: 'entradas', label: 'Entradas', icon: '�' },
    { id: 'incidentes', label: 'Incidentes', icon: '🚨' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSeccion />;
      case 'residentes':
        return <ResidentesSeccion />;
      case 'servicios':
        return <ServiciosSeccion />;
      case 'entradas':
        return <EntradasSeccion />;
      case 'notificaciones':
        return <NotificacionesSeccion />;
      case 'personal':
        return <PersonalSeccion />;
      case 'incidentes':
        return <IncidentesSeccion />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h2>
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
      <div className="w-64 bg-gradient-to-b from-blue-600 to-purple-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-blue-500">
          <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user?.username}</span>
              <span className="text-xs text-blue-200 capitalize">{user?.rol}</span>
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
                  : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:shadow-sm'
              }`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-blue-500">
          <button
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-blue-100 hover:bg-white hover:bg-opacity-10 transition-all duration-200"
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
              {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h1>
            <div className="text-gray-600">
              Bienvenido, <span className="font-semibold text-gray-800">{user?.username}</span>
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

export default AdminDashboard;