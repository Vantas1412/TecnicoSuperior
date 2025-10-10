// src/components/ResidenteDashboard.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ResidenteDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Panel del Residente</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bienvenido, <strong>{user?.username}</strong> ({user?.rol})
              </span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-orange-200 rounded-lg p-8 text-center bg-orange-50">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Contenido exclusivo para residentes</h2>
            <p className="text-gray-600 text-lg">
              Aquí puedes ver tus pagos, reportar problemas, comunicarte con administración y gestionar tu residencia.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResidenteDashboard;