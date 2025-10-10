// src/components/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>Acceso No Autorizado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
        <p><strong>Tu rol actual:</strong> {user?.rol}</p>
        
        <div className="unauthorized-actions">
          <button onClick={handleGoBack} className="btn-secondary">
            Volver Atrás
          </button>
          <button onClick={handleLogout} className="btn-primary">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;