// src/components/Login.jsx
import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../services/UsuarioService';
import { useAuth } from '../hooks/useAuth';
import RecuperarContraseña from './RecuperarContraseña'; // ✅ Importa el componente

// ✅ FUNCIÓN PARA ENVIAR CORREOS CON EMAILJS - VERSIÓN MEJORADA
const enviarCorreoLogin = async (userData) => {
  try {
    // ✅ VERIFICAR QUE EXISTA EL EMAIL DEL USUARIO
    if (!userData.correo_electronico) {
      console.warn('❌ El usuario no tiene email registrado:', userData.username);
      return;
    }

    console.log('📧 Intentando enviar correo a:', userData.correo_electronico);
    console.log('👤 Datos del usuario:', userData);

    // Import dinámico de EmailJS
    const emailjs = await import('@emailjs/browser');
    
    const templateParams = {
      to_email: userData.correo_electronico, // ⬅️ ESTE es el email de la persona que ingresa
      to_name: userData.username,
      fecha: new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      rol: userData.rol
    };

    // ✅ USANDO TUS NUEVAS CREDENCIALES DE EMAILJS
    const result = await emailjs.send(
      'service_2vr6cmi',      // Tu Service ID
      'template_5fck2le',     // Tu Template ID
      templateParams,
      's8WnStFlXmsK3l4xq'    // ⬅️ TU NUEVA Public Key CORREGIDA
    );
    
    console.log('✅ Correo de notificación enviado exitosamente a:', userData.correo_electronico);
    console.log('📨 Respuesta de EmailJS:', result);
    
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    console.log('🔍 Detalles del error:', {
      email: userData.correo_electronico,
      usuario: userData.username,
      errorCode: error.code,
      errorMessage: error.text
    });
  }
};

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rol: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showRecuperarContraseña, setShowRecuperarContraseña] = useState(false); // ✅ NUEVO ESTADO
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Clave del sitio reCAPTCHA - reemplaza con tu SITE_KEY
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Ref para el componente ReCAPTCHA
  const recaptchaRef = React.useRef();

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

  const verifyCaptcha = async (token) => {
    try {
      // En un entorno real, aquí enviarías el token a tu backend para verificación
      // Por ahora, haremos una verificación básica en el frontend
      if (!token) {
        return false;
      }
      
      // En producción, deberías enviar este token a tu backend
      // y verificar con la SECRET_KEY de reCAPTCHA
      return true;
    } catch (error) {
      console.error('Error verificando CAPTCHA:', error);
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.rol) {
      setError('Por favor, completa todos los campos');
      return;
    }

    // Verificar CAPTCHA
    if (!captchaToken) {
      setError('Por favor, completa la verificación CAPTCHA');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar CAPTCHA
      const isCaptchaValid = await verifyCaptcha(captchaToken);
      if (!isCaptchaValid) {
        setError('Error en la verificación de seguridad. Intenta nuevamente.');
        setCaptchaToken(''); // Reset CAPTCHA
        resetCaptcha();
        return;
      }

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
          usuario.rol === formData.rol
      );

      if (usuarioEncontrado) {
        // ✅ VERIFICAR DATOS DEL USUARIO ENCONTRADO
        console.log('🔍 USUARIO ENCONTRADO EN BD:', usuarioEncontrado);
        
        // Verificar si el usuario está activo
        if (usuarioEncontrado.estado !== 'activo') {
          setError('Tu cuenta está inactiva. Contacta al administrador.');
          return;
        }

        // Login exitoso - preparar datos del usuario
        const userData = {
          id_usuario: usuarioEncontrado.id_usuario,
          username: usuarioEncontrado.username,
          correo_electronico: usuarioEncontrado.correo_electronico, // ⬅️ ESTE es el campo importante
          rol: usuarioEncontrado.rol,
          estado: usuarioEncontrado.estado,
          id_persona: usuarioEncontrado.id_persona,
          urlfoto: usuarioEncontrado.urlfoto,
          fecha_registro: usuarioEncontrado.fecha_registro,
          id_auth: usuarioEncontrado.id_auth
        };
        
        // ✅ VERIFICAR QUE EL EMAIL EXISTA ANTES DE ENVIAR
        if (!userData.correo_electronico) {
          console.warn('⚠️ ADVERTENCIA: El usuario no tiene email en la BD:', userData.username);
        } else {
          console.log('✅ Email encontrado para el usuario:', userData.correo_electronico);
        }
        
        // Usar el hook de autenticación
        login(userData);
        
        // ✅ ENVÍO DE CORREO AUTOMÁTICO AL INICIAR SESIÓN
        enviarCorreoLogin(userData);
        
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
        setCaptchaToken(''); // Reset CAPTCHA en error
        resetCaptcha();
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error al iniciar sesión. Intenta nuevamente.');
      setCaptchaToken(''); // Reset CAPTCHA en error
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const resetCaptcha = () => {
    setCaptchaToken('');
    if (recaptchaRef && recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setError('');
  };

  const handleCaptchaError = () => {
    setError('Error al cargar la verificación de seguridad. Recarga la página.');
    setCaptchaToken('');
  };

  // Función para seleccionar automáticamente un usuario de prueba
  const selectDemoUser = (username, password, rol) => {
    setFormData({
      username,
      password,
      rol
    });
    // Reset CAPTCHA cuando se selecciona un usuario demo
    setCaptchaToken('');
    resetCaptcha();
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
          </div>

          {/* Componente CAPTCHA con react-google-recaptcha */}
          <div className="captcha-container">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verificación de Seguridad
            </label>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaVerify}
              onErrored={handleCaptchaError}
              onExpired={() => setCaptchaToken('')}
              theme="light"
            />
            {captchaToken && (
              <div className="text-green-600 text-sm mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verificación completada
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !formData.username || !formData.password || !formData.rol || !captchaToken}
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

          {/* ✅ BOTÓN "NO ME ACUERDO DE MI CONTRASEÑA" */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowRecuperarContraseña(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-200 underline"
            >
              No me acuerdo de mi contraseña
            </button>
          </div>
        </form>

        {/* ✅ MODAL DE RECUPERACIÓN DE CONTRASEÑA */}
        {showRecuperarContraseña && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Recuperar Contraseña</h3>
                <button
                  onClick={() => setShowRecuperarContraseña(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <RecuperarContraseña 
                onClose={() => setShowRecuperarContraseña(false)}
                onSuccess={() => {
                  setShowRecuperarContraseña(false);
                  // Opcional: mostrar mensaje de éxito
                  setError(''); // Limpiar errores anteriores
                }}
              />
            </div>
          </div>
        )}

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