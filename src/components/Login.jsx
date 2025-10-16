// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../services/UsuarioService';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rol: '' // Nuevo campo para el rol
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Si ya está autenticado, redirigir al dashboard correspondiente
  React.useEffect(() => {
    if (isAuthenticated) {
      redirectByRole();
    }
  }, [isAuthenticated, navigate]);

  const redirectByRole = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      switch (userData.rol) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'empleado':
          navigate('/empleado/dashboard');
          break;
        case 'residente':
          navigate('/residente/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.rol) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Obtener todos los usuarios y buscar coincidencia
      const result = await usuarioService.obtenerUsuarios();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al conectar con la base de datos');
      }

      // Buscar usuario que coincida con username, password Y rol
      const usuarioEncontrado = result.data.find(
        usuario => 
          usuario.username === formData.username && 
          usuario.password === formData.password &&
          usuario.rol === formData.rol // Verificar también el rol
      );

      if (usuarioEncontrado) {
        // Verificar si el usuario está activo
        if (usuarioEncontrado.estado !== 'activo') {
          setError('Tu cuenta está inactiva. Contacta al administrador.');
          return;
        }

        // Login exitoso - preparar datos del usuario
        const userData = {
          id_usuario: usuarioEncontrado.id_usuario,
          username: usuarioEncontrado.username,
          correo_electronico: usuarioEncontrado.correo_electronico,
          rol: usuarioEncontrado.rol,
          estado: usuarioEncontrado.estado,
          id_persona: usuarioEncontrado.id_persona,
          urlfoto: usuarioEncontrado.urlfoto,
          fecha_registro: usuarioEncontrado.fecha_registro,
          id_auth: usuarioEncontrado.id_auth
        };
        
        // Usar el hook de autenticación
        login(userData);
        
        // Redirigir según el rol
        switch (userData.rol) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'empleado':
            navigate('/empleado/dashboard');
            break;
          case 'residente':
            navigate('/residente/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
        
      } else {
        setError('Usuario, contraseña o rol incorrectos');
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para seleccionar automáticamente un usuario de prueba
  const selectDemoUser = (username, password, rol) => {
    setFormData({
      username,
      password,
      rol
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-600">
            Sistema de Gestión - Selecciona tu rol
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              id="rol"
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Selecciona tu rol</option>
              <option value="admin">Administrador</option>
              <option value="empleado">Empleado</option>
              <option value="residente">Residente</option>
            </select>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Ingresa tu nombre de usuario"
              autoComplete="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="mt-2 text-right">
              <a 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition duration-200"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !formData.username || !formData.password || !formData.rol}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Usuarios de Prueba
          </h4>
          
          <div className="grid gap-4">
            {/* Administrador */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <h5 className="font-semibold text-purple-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-xl mr-2">👑</span>
                  Administrador
                </span>
                <button
                  onClick={() => selectDemoUser('cgutierrezaruni', 'AdminPass123!', 'admin')}
                  className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition duration-200"
                >
                  Usar este
                </button>
              </h5>
              <div className="space-y-1 text-sm">
                <div><strong>Usuario:</strong> cgutierrezaruni</div>
                <div><strong>Contraseña:</strong> AdminPass123!</div>
                <div><strong>Rol:</strong> admin</div>
                <div className="text-purple-600"><strong>Acceso:</strong> Panel completo del sistema</div>
              </div>
            </div>

            {/* Empleado */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-xl mr-2">👨‍💼</span>
                  Empleado
                </span>
                <button
                  onClick={() => selectDemoUser('walterquintanillavi', 'Empleado1Pass!', 'empleado')}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition duration-200"
                >
                  Usar este
                </button>
              </h5>
              <div className="space-y-1 text-sm">
                <div><strong>Usuario:</strong> walterquintanillavi</div>
                <div><strong>Contraseña:</strong> Empleado1Pass!</div>
                <div><strong>Rol:</strong> empleado</div>
                <div className="text-green-600"><strong>Acceso:</strong> Gestión operativa</div>
              </div>
            </div>

            {/* Residente */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <h5 className="font-semibold text-orange-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-xl mr-2">🏠</span>
                  Residente
                </span>
                <button
                  onClick={() => selectDemoUser('anchoque3', 'Residente1Pass!', 'residente')}
                  className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition duration-200"
                >
                  Usar este
                </button>
              </h5>
              <div className="space-y-1 text-sm">
                <div><strong>Usuario:</strong> anchoque3</div>
                <div><strong>Contraseña:</strong> Residente1Pass!</div>
                <div><strong>Rol:</strong> residente</div>
                <div className="text-orange-600"><strong>Acceso:</strong> Panel personal</div>
              </div>
            </div>

            {/* Residente adicional */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <h5 className="font-semibold text-orange-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-xl mr-2">🏠</span>
                  Residente (Alternativo)
                </span>
                <button
                  onClick={() => selectDemoUser('maquizeq', 'Residente2Pass!', 'residente')}
                  className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition duration-200"
                >
                  Usar este
                </button>
              </h5>
              <div className="space-y-1 text-sm">
                <div><strong>Usuario:</strong> maquizeq</div>
                <div><strong>Contraseña:</strong> Residente2Pass!</div>
                <div><strong>Rol:</strong> residente</div>
                <div className="text-orange-600"><strong>Acceso:</strong> Panel personal</div>
              </div>
            </div>

            {/* Empleado adicional */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-xl mr-2">👨‍💼</span>
                  Empleado (Alternativo)
                </span>
                <button
                  onClick={() => selectDemoUser('aguila.adartse5', 'Empleado2Pass!', 'empleado')}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition duration-200"
                >
                  Usar este
                </button>
              </h5>
              <div className="space-y-1 text-sm">
                <div><strong>Usuario:</strong> aguila.adartse5</div>
                <div><strong>Contraseña:</strong> Empleado2Pass!</div>
                <div><strong>Rol:</strong> empleado</div>
                <div className="text-green-600"><strong>Acceso:</strong> Gestión operativa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;