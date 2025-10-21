import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import usuarioService from '../services/UsuarioService';

const RecuperarContraseña = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [userFound, setUserFound] = useState(null);
  const [step, setStep] = useState(1); // 1: Buscar, 2: Verificar código, 3: Nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutos en segundos
  const [attempts, setAttempts] = useState(0);

  const recaptchaRef = React.useRef();
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Timer para código expirado
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Formatear tiempo restante
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generar código de verificación de 6 dígitos
  const generateVerificationCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setTimeLeft(600);
    setAttempts(0);
    setVerificationCode('');
    return code;
  };

  // Verificar si el código ha expirado
  const isCodeExpired = () => {
    return timeLeft <= 0;
  };

  // Paso 1: Buscar usuario y enviar código
  const handleSearchUser = async (e) => {
    e.preventDefault();
    
    if (!email && !username) {
      setError('Por favor, ingresa tu email o nombre de usuario');
      return;
    }

    if (!captchaToken) {
      setError('Por favor, completa la verificación de seguridad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await usuarioService.obtenerUsuarios();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al buscar usuario');
      }

      const usuarioEncontrado = result.data.find(usuario => 
        usuario.correo_electronico === email || usuario.username === username
      );

      if (usuarioEncontrado) {
        if (usuarioEncontrado.estado !== 'activo') {
          setError('Esta cuenta está inactiva. Contacta al administrador.');
          resetCaptcha();
          return;
        }

        if (!usuarioEncontrado.correo_electronico) {
          setError('Este usuario no tiene email registrado. Contacta al administrador.');
          resetCaptcha();
          return;
        }

        setUserFound(usuarioEncontrado);
        
        // Generar y enviar código de verificación
        const code = generateVerificationCode();
        await enviarCodigoVerificacion(usuarioEncontrado, code);
        
        setStep(2);
      } else {
        setError('No se encontró ningún usuario con ese email o nombre de usuario');
        resetCaptcha();
      }
    } catch (error) {
      console.error('❌ Error buscando usuario:', error);
      setError(error.message || 'Error al buscar usuario. Intenta nuevamente.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setError('Por favor, ingresa el código de verificación');
      return;
    }

    if (isCodeExpired()) {
      setError('El código ha expirado. Solicita uno nuevo.');
      return;
    }

    if (attempts >= 3) {
      setError('Demasiados intentos fallidos. Solicita un nuevo código.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar código
      if (verificationCode === generatedCode) {
        setStep(3);
      } else {
        setAttempts(prev => prev + 1);
        const remainingAttempts = 3 - (attempts + 1);
        setError(`Código incorrecto. Te quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''}.`);
      }
    } catch (error) {
      setError('Error verificando el código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Actualizar contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await usuarioService.editarUsuario(userFound.id_usuario, {
        password: newPassword
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(result.error || 'Error al actualizar la contraseña');
      }
    } catch (error) {
      setError('Error al actualizar la contraseña. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar código de verificación por email - ÚNICO SERVICIO
  const enviarCodigoVerificacion = async (userData, code) => {
    try {
      const emailjs = await import('@emailjs/browser');
      
      const templateParams = {
        to_email: userData.correo_electronico,
        to_name: userData.username,
        verification_code: code,
        expires_in: '10 minutos'
      };

      console.log('📧 Enviando código de verificación...', templateParams);
      
      // ✅ USANDO SOLO UN SERVICIO DE EMAIL CON EL NUEVO TEMPLATE ID
      const result = await emailjs.send(
        'service_hw86hry',          // Service ID
        'template_rkqku4i',         // ⬅️ NUEVO Template ID
        templateParams,
        'J-3wBg4Qkmcyi2yte'        // Public Key
      );
      
      console.log('✅ Código de verificación enviado exitosamente');
      return result;
      
    } catch (error) {
      console.error('❌ Error enviando código de verificación:', {
        code: error.code,
        status: error.status,
        text: error.text,
        message: error.message
      });
      
      // Si falla el envío, mostramos el código en pantalla para pruebas
      console.log('🔧 Código generado (para pruebas):', code);
      setGeneratedCode(code); // Asegurar que el código se guarde para pruebas
      
      throw new Error('No se pudo enviar el código de verificación. Intenta nuevamente.');
    }
  };

  const resetCaptcha = () => {
    setCaptchaToken('');
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  const handleCaptchaVerify = (token) => {
    setCaptchaToken(token);
    setError('');
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setUserFound(null);
    setStep(1);
    setError('');
    setTimeLeft(600);
    setAttempts(0);
    resetCaptcha();
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">¡Contraseña actualizada!</h4>
        <p className="text-gray-600">
          Tu contraseña ha sido actualizada exitosamente.
        </p>
        <div className="animate-pulse text-blue-600 text-sm mt-3">
          Cerrando en 3 segundos...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Paso 1: Buscar usuario */}
      {step === 1 && (
        <form onSubmit={handleSearchUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email o Nombre de Usuario
            </label>
            <input
              type="text"
              value={email || username}
              onChange={(e) => {
                const value = e.target.value;
                setError('');
                if (value.includes('@')) {
                  setEmail(value);
                  setUsername('');
                } else {
                  setUsername(value);
                  setEmail('');
                }
              }}
              required
              disabled={loading}
              placeholder="Ingresa tu email o nombre de usuario"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100"
            />
          </div>

          <div className="captcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={handleCaptchaVerify}
              onErrored={() => setError('Error en la verificación de seguridad')}
              onExpired={() => setCaptchaToken('')}
              theme="light"
              size="normal"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading || (!email && !username) || !captchaToken}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando código...
                </>
              ) : (
                'Enviar código de verificación'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Paso 2: Verificar código */}
      {step === 2 && userFound && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Verificación requerida</h4>
            <p className="text-blue-700 text-sm">
              Se envió un código de 6 dígitos a: <strong>{userFound.correo_electronico}</strong>
            </p>
            <div className={`text-sm mt-2 ${timeLeft > 60 ? 'text-green-600' : 'text-red-600'}`}>
              ⏰ Tiempo restante: <strong>{formatTime(timeLeft)}</strong>
            </div>
            {attempts > 0 && (
              <p className="text-orange-600 text-xs mt-1">
                Intentos fallidos: {attempts}/3
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Verificación
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              disabled={loading || isCodeExpired()}
              placeholder="000000"
              maxLength="6"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-mono tracking-widest disabled:bg-gray-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setStep(1);
              }}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Volver
            </button>
            <button 
              type="submit"
              disabled={loading || !verificationCode || verificationCode.length !== 6 || isCodeExpired()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando...
                </>
              ) : (
                'Verificar Código'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const code = generateVerificationCode();
                  await enviarCodigoVerificacion(userFound, code);
                } catch (error) {
                  setError('Error al reenviar el código. Intenta nuevamente.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-blue-400"
            >
              ↻ Reenviar código
            </button>
          </div>
        </form>
      )}

      {/* Paso 3: Nueva contraseña */}
      {step === 3 && userFound && (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verificación exitosa
            </h4>
            <p className="text-green-700 text-sm">
              Ahora puedes crear una nueva contraseña para <strong>{userFound.username}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Ingresa tu nueva contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              La contraseña debe tener al menos 6 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Confirma tu nueva contraseña"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:bg-gray-100"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition duration-200 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Volver
            </button>
            <button 
              type="submit"
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecuperarContraseña;