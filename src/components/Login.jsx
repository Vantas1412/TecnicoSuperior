// src/components/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../services/UsuarioService';
import emailService from '../services/EmailService';
import personaService from '../services/PersonaService';
import { useAuth } from '../hooks/useAuth';

// 👉 URL del backend de login facial (loginreco.py)
const API_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000/recognize';

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

  // ======= Estados para el modal de reconocimiento facial =======
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceStatus, setFaceStatus] = useState('En espera…');
  const [faceError, setFaceError] = useState('');
  const [faceRt, setFaceRt] = useState(0); // ms
  const [faceRunning, setFaceRunning] = useState(false);

  // Refs de cámara
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const loopRef = useRef(null);

  // =================== Redirección si ya está autenticado ===================
  useEffect(() => {
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

  // =================== Form clásico ===================
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
      const result = await usuarioService.obtenerUsuarios();
      if (!result.success) throw new Error(result.error || 'Error al conectar con la base de datos');

      const usuarioEncontrado = result.data.find(
        usuario =>
          usuario.username === formData.username &&
          usuario.password === formData.password &&
          usuario.rol === formData.rol
      );

      if (usuarioEncontrado) {
        if (usuarioEncontrado.estado !== 'activo') {
          setError('Tu cuenta está inactiva. Contacta al administrador.');
          return;
        }

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

        login(userData);

        // 🔐 ENVIAR CORREO DE NOTIFICACIÓN DE INICIO DE SESIÓN
        try {
          // Obtener información de la persona para obtener el nombre
          let nombreCompleto = usuarioEncontrado.username;
          if (usuarioEncontrado.id_persona) {
            const personaResult = await personaService.obtenerPersonaPorId(usuarioEncontrado.id_persona);
            if (personaResult.success && personaResult.data) {
              nombreCompleto = `${personaResult.data.nombre} ${personaResult.data.apellido_paterno}`;
            }
          }

          // Información del login
          const loginInfo = {
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' :
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Desconocido',
            ip: 'Se obtiene del servidor', // En producción se obtendría del backend
            fecha: new Date().toISOString()
          };

          // Enviar correo de notificación de inicio de sesión (sin bloquear el login)
          if (usuarioEncontrado.correo_electronico) {
            emailService.sendLoginNotification(
              usuarioEncontrado.correo_electronico,
              nombreCompleto,
              loginInfo
            ).catch(err => {
              console.error('Error al enviar correo de inicio de sesión:', err);
              // No mostrar error al usuario para no interrumpir el login
            });
          }
        } catch (emailError) {
          // Error en envío de correo no debe bloquear el inicio de sesión
          console.error('Error al enviar notificación de login:', emailError);
        }
        
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

  // =================== Demo helpers ===================
  const selectDemoUser = (username, password, rol) => {
    setFormData({ username, password, rol });
  };

  // =================== Lógica del modal de reconocimiento facial ===================
  const openFaceModal = async () => {
    setShowFaceModal(true);
    setFaceError('');
    setFaceStatus('Inicializando cámara…');
    try {
      await startCamera();
      startLoop();
    } catch (err) {
      setFaceError('No se pudo iniciar la cámara. Revisa permisos.');
      console.error(err);
    }
  };

  const closeFaceModal = () => {
    stopLoop();
    stopCamera();
    setShowFaceModal(false);
    setFaceStatus('En espera…');
    setFaceError('');
  };

  async function startCamera() {
    try {
      if (streamRef.current) stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => (videoRef.current.onloadedmetadata = r));
        // Asegura tamaño canvas overlay
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640;
          canvasRef.current.height = videoRef.current.videoHeight || 480;
        }
      }
      setFaceRunning(true);
      setFaceStatus('Cámara lista');
    } catch (e) {
      setFaceRunning(false);
      throw e;
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setFaceRunning(false);
  }

  function stopLoop() {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  }

  function startLoop() {
    stopLoop();
    const sendW = 320;
    const sendH = 240;
    const intervalMs = 300;
    const jpegQuality = 0.7;

    loopRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        // Captura frame reducido
        const tmp = document.createElement('canvas');
        tmp.width = sendW; tmp.height = sendH;
        const tctx = tmp.getContext('2d', { willReadFrequently: true });
        tctx.drawImage(videoRef.current, 0, 0, sendW, sendH);
        const dataUrl = tmp.toDataURL('image/jpeg', jpegQuality);

        const t0 = performance.now();
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_b64: dataUrl })
        });
        const json = await res.json();
        const t1 = performance.now();
        setFaceRt(Math.round(t1 - t0));

        // Dibuja detecciones (opcional en modal)
        drawBoxes(json?.results || [], sendW, sendH);

        // Si llegó login, cierra modal y autentica
        if (json?.login?.token && json?.login?.user) {
          // Guardar token & usuario (si tu useAuth ya lo hace, puedes omitir los localStorage)
          localStorage.setItem('token', json.login.token);
          localStorage.setItem('user', JSON.stringify(json.login.user));

          // Adecúa el objeto para tu hook login (igual que en login clásico)
          const u = json.login.user;
          const userData = {
            id_usuario: u.id_usuario,
            username: u.username,
            correo_electronico: u.correo_electronico,
            rol: u.rol,
            estado: u.estado,
            id_persona: u.id_persona,
            urlfoto: u.urlfoto,
            fecha_registro: u.fecha_registro,
            id_auth: u.id_auth
          };

          login(userData);        // <- tu hook
          closeFaceModal();       // cierra modal
          redirectByRole();       // redirige según rol
        } else {
          setFaceStatus('Buscando coincidencia…');
        }
      } catch (e) {
        console.error(e);
        setFaceError('Error comunicando con el servidor.');
        setFaceStatus('Error de comunicación');
      }
    }, intervalMs);
  }

  function drawBoxes(res, sendW, sendH) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / sendW;
    const sy = canvas.height / sendH;
    res.forEach(r => {
      const left = Math.round(r.left * sx);
      const top = Math.round(r.top * sy);
      const right = Math.round(r.right * sx);
      const bottom = Math.round(r.bottom * sy);
      const ok = r.name !== 'Desconocido';
      ctx.lineWidth = 3;
      ctx.strokeStyle = ok ? '#22c55e' : '#ef4444';
      ctx.strokeRect(left, top, right - left, bottom - top);
      const label = `${r.name} ${(r.confidence * 100).toFixed(0)}%`;
      ctx.font = '14px ui-sans-serif, system-ui';
      const textW = ctx.measureText(label).width + 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(left, top - 22, textW, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, left + 5, top - 7);
    });
  }

  // Limpia cámara si el modal se desmonta (por si acaso)
  useEffect(() => {
    if (!showFaceModal) {
      stopLoop();
      stopCamera();
    }
  }, [showFaceModal]);

  // =================== Render ===================
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

        {/* ===== Botón de Entrar con reconocimiento facial ===== */}
        <button
          type="button"
          onClick={openFaceModal}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="1.8" d="M4 8V6a2 2 0 012-2h2M20 8V6a2 2 0 00-2-2h-2M4 16v2a2 2 0 002 2h2M20 16v2a2 2 0 01-2 2h-2" />
            <path strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Entrar con reconocimiento facial
        </button>

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
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition duración-200"
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

      {/* =================== MODAL RECONOCIMIENTO FACIAL =================== */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeFaceModal} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Entrar con reconocimiento facial</div>
                <div className="text-sm text-gray-500">Mira a la cámara y espera a que te identifique</div>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closeFaceModal}
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 grid gap-3">
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                <span className="absolute top-3 left-3 z-10 text-xs px-2 py-1 rounded-md bg-black/50 text-white">
                  {faceStatus} · {faceRt} ms
                </span>
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto block" />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              </div>

              {faceError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {faceError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={closeFaceModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                {faceRunning ? (
                  <button
                    onClick={() => { stopLoop(); setFaceRunning(false); setFaceStatus('Pausado'); }}
                    className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Pausar
                  </button>
                ) : (
                  <button
                    onClick={() => { setFaceError(''); setFaceStatus('Reanudando…'); startLoop(); setFaceRunning(true); }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Reanudar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =================== FIN MODAL =================== */}
    </div>
  );
};

export default Login;
