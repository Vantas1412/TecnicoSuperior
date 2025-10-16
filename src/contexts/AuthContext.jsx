/* // src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      
      if (authStatus === 'true' && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.rol === role;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; */

// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import supabase from '../services/dbConnection'; // Asegúrate de tener esta importación

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar información del empleado desde la BD
  const loadEmpleadoInfo = async (id_persona) => {
    try {
      const { data, error } = await supabase
        .from('empleado')
        .select('*')
        .eq('id_persona', id_persona)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cargando información del empleado:', error);
      return null;
    }
  };

  // Función para cargar información de la persona desde la BD
  const loadPersonaInfo = async (id_persona) => {
    try {
      const { data, error } = await supabase
        .from('persona')
        .select('*')
        .eq('id_persona', id_persona)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error cargando información de la persona:', error);
      return null;
    }
  };

  // Función para enriquecer el usuario con datos de empleado y persona
  const enrichUserData = async (userData) => {
    try {
      let enrichedUser = { ...userData };

      // Cargar información de la persona
      if (userData.id_persona) {
        const personaInfo = await loadPersonaInfo(userData.id_persona);
        if (personaInfo) {
          enrichedUser.persona = personaInfo;
        }
      }

      // Si el usuario es empleado, cargar información del empleado
      if (userData.rol === 'empleado' && userData.id_persona) {
        const empleadoInfo = await loadEmpleadoInfo(userData.id_persona);
        if (empleadoInfo) {
          enrichedUser.empleado = empleadoInfo;
        }
      }

      return enrichedUser;
    } catch (error) {
      console.error('Error enriqueciendo datos del usuario:', error);
      return userData; // Retornar datos originales si hay error
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('user');
      
      if (authStatus === 'true' && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Enriquecer los datos del usuario con información de BD
          const enrichedUser = await enrichUserData(parsedUser);
          
          setIsAuthenticated(true);
          setUser(enrichedUser);
          
          // Actualizar localStorage con los datos enriquecidos
          localStorage.setItem('user', JSON.stringify(enrichedUser));
        } catch (error) {
          console.error('Error procesando datos de usuario:', error);
          // En caso de error, usar los datos básicos
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (userData) => {
    try {
      // Enriquecer los datos del usuario antes de guardarlos
      const enrichedUser = await enrichUserData(userData);
      
      localStorage.setItem('user', JSON.stringify(enrichedUser));
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      setUser(enrichedUser);
    } catch (error) {
      console.error('Error en login:', error);
      // Si hay error, guardar los datos básicos
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.rol === role;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};