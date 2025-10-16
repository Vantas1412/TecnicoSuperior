// src/components/EmpleadoDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Importar los componentes de secciones del empleado
import DashboardSeccion from './EmpleadoSecciones/DashboardSeccion';
import VerTareas from './EmpleadoSecciones/VerTareas';
import InformeTrabajo from './EmpleadoSecciones/InformeTrabajo';
import MandarEvidencia from './EmpleadoSecciones/MandarEvidencia';
import { EntradasEmpleadoSeccion } from './EmpleadoSecciones';

const EmpleadoDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tareas', label: 'Ver Tareas', icon: '✅' },
    { id: 'informe', label: 'Informe de Trabajo', icon: '📋' },
    { id: 'evidencia', label: 'Mandar Evidencia', icon: '📎' },
    ...(user?.empleado?.tipo === 'Seguridad' ? [{ id: 'entradas', label: 'Entradas', icon: '🚪' }] : []),
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSeccion />;
      case 'tareas':
        return <VerTareas />;
      case 'informe':
        return <InformeTrabajo />;
      case 'evidencia':
        return <MandarEvidencia />;
      case 'entradas':
        // Solo renderizar si el tipo es Seguridad
        return user?.empleado?.tipo === 'Seguridad' ? <EntradasEmpleadoSeccion /> : <div className="p-6 text-red-600">Acceso denegado: solo personal de Seguridad puede ver las entradas.</div>;
      default:
        return <DashboardSeccion />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-green-600 to-blue-700 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-green-500">
          <h2 className="text-xl font-bold mb-4">EMPLEADO</h2>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center font-bold text-white text-lg">
              {user?.persona?.nombre?.charAt(0) || user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-green-200">BIENVENIDO</span>
              <span className="font-semibold text-sm">
                {user?.persona?.nombre || user?.username}
              </span>
              <span className="text-xs text-green-200 capitalize">
                {user?.empleado?.tipo || 'Empleado'}
              </span>
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
            <span className="font-medium">Cerrar Sesión</span>
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
              <span className="font-semibold text-gray-800">
                {user?.persona?.nombre || user?.username}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                - {user?.empleado?.tipo || 'Empleado'}
              </span>
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

export default EmpleadoDashboard;