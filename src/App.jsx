// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ResidenteDashboard from './components/ResidenteDashboard';
import EmpleadoDashboard from './components/EmpleadoDashboard';
import Unauthorized from './components/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import './App.css';

// Componente para redirección del dashboard
function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.rol) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'residente':
      return <Navigate to="/residente/dashboard" replace />;
    case 'empleado':
      return <Navigate to="/empleado/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Ruta principal */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas por rol */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/residente/*" 
              element={
                <ProtectedRoute requiredRole="residente">
                  <ResidenteDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/empleado/*" 
              element={
                <ProtectedRoute requiredRole="empleado">
                  <EmpleadoDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirección automática según rol */}
            <Route 
              path="/dashboard" 
              element={<DashboardRedirect />} 
            />
            
            {/* Ruta no autorizada */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;