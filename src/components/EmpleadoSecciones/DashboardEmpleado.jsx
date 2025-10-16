import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardSeccion from './DashboardSeccion';
import VerTareas from './VerTareas';
import InformeTrabajo from './InformeTrabajo';
import MandarEvidencia from './MandarEvidencia';

const DashboardEmpleado = () => {
  const { user, logout } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tareas', label: 'Ver Tareas', icon: '✅' },
    { id: 'informe', label: 'Informe de Trabajo', icon: '📋' },
    { id: 'evidencia', label: 'Mandar Evidencia', icon: '📎' }
  ];

  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'dashboard':
        return <DashboardSeccion />;
      case 'tareas':
        return <VerTareas />;
      case 'informe':
        return <InformeTrabajo />;
      case 'evidencia':
        return <MandarEvidencia />;
      default:
        return <DashboardSeccion />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Barra lateral */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">EMPLEADO</h1>
          
          {/* Información del empleado */}
          <div className="mt-6 flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.persona?.nombre?.charAt(0) || user?.username?.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-gray-600">BIENVENIDO</p>
              <p className="font-semibold text-gray-800">
                {user?.persona?.nombre || user?.username}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.empleado?.tipo || 'Empleado'}
              </p>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setSeccionActiva(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    seccionActiva === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Botón cerrar sesión */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        {renderSeccion()}
      </div>
    </div>
  );
};

export default DashboardEmpleado;