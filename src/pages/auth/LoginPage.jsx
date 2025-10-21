import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, AlertCircle, Building2, Shield, Users, ArrowRight, Camera } from 'lucide-react'
import ReCaptcha from '../../shared/components/ReCaptcha'

// URL del backend de reconocimiento facial
const FACE_API_URL = import.meta.env.VITE_FACE_API_URL || 'http://localhost:8000/recognize'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState(null)
  const [recaptchaVerified, setRecaptchaVerified] = useState(false)

  // Estados para reconocimiento facial
  const [showFaceModal, setShowFaceModal] = useState(false)
  const [faceStatus, setFaceStatus] = useState('En espera...')
  const [faceError, setFaceError] = useState('')
  const [faceRt, setFaceRt] = useState(0)
  const [faceRunning, setFaceRunning] = useState(false)
  
  // Refs para la cámara
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const loopRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  // Handlers de reCAPTCHA
  const handleRecaptchaVerify = (token) => {
    setRecaptchaToken(token)
    setRecaptchaVerified(true)
    setError('') // Limpiar error si había
  }

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null)
    setRecaptchaVerified(false)
    setError('El captcha ha expirado. Por favor, verifica nuevamente.')
  }

  const handleRecaptchaError = () => {
    setRecaptchaToken(null)
    setRecaptchaVerified(false)
    setError('Error al cargar el captcha. Por favor, recarga la página.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { email, password } = formData

      if (!email || !password) {
        setError('Por favor, completa todos los campos')
        setLoading(false)
        return
      }

      // Verificar reCAPTCHA solo si está configurado
      if (import.meta.env.VITE_RECAPTCHA_SITE_KEY && !recaptchaVerified) {
        setError('Por favor, completa la verificación de captcha')
        setLoading(false)
        return
      }

      const result = await login(email, password)

      if (result.success) {
        // Redirigir según el rol del usuario
        const userRole = result.data.profile?.rol
        
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard')
            break
          case 'empleado':
            navigate('/empleado/dashboard')
            break
          case 'residente':
            navigate('/residente/dashboard')
            break
          default:
            navigate('/dashboard')
        }
      } else {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      console.error('❌ Error en login:', err)
      setError('Error inesperado. Por favor, intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  // Función para rellenar formulario con usuarios de prueba
  const fillTestUser = (email, password) => {
    setFormData({ email, password })
    setError('')
  }

  // =================== Funciones de Reconocimiento Facial ===================
  const openFaceModal = async () => {
    setShowFaceModal(true)
    setFaceStatus('Iniciando cámara...')
    setFaceError('')
    setFaceRt(0)
    try {
      await startCamera()
      startLoop()
    } catch (err) {
      setFaceError('No se pudo acceder a la cámara. Verifica permisos.')
      setFaceStatus('Error')
    }
  }

  const closeFaceModal = () => {
    stopLoop()
    stopCamera()
    setShowFaceModal(false)
    setFaceStatus('En espera...')
    setFaceError('')
  }

  async function startCamera() {
    try {
      if (streamRef.current) stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise(r => (videoRef.current.onloadedmetadata = r))
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640
          canvasRef.current.height = videoRef.current.videoHeight || 480
        }
      }
      setFaceRunning(true)
      setFaceStatus('Cámara lista. Buscando rostros...')
    } catch (e) {
      setFaceRunning(false)
      throw e
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setFaceRunning(false)
  }

  function stopLoop() {
    if (loopRef.current) {
      clearInterval(loopRef.current)
      loopRef.current = null
    }
  }

  function startLoop() {
    stopLoop()
    const sendW = 320
    const sendH = 240
    const intervalMs = 300
    const jpegQuality = 0.7

    loopRef.current = setInterval(async () => {
      if (!videoRef.current) return
      try {
        const tmp = document.createElement('canvas')
        tmp.width = sendW
        tmp.height = sendH
        const tctx = tmp.getContext('2d', { willReadFrequently: true })
        tctx.drawImage(videoRef.current, 0, 0, sendW, sendH)
        const dataUrl = tmp.toDataURL('image/jpeg', jpegQuality)

        const t0 = performance.now()
        const res = await fetch(FACE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_b64: dataUrl })
        })
        const json = await res.json()
        const t1 = performance.now()
        setFaceRt(Math.round(t1 - t0))

        drawBoxes(json?.results || [], sendW, sendH)

        if (json?.login?.token && json?.login?.user) {
          const u = json.login.user
          
          // Usar el sistema de login de Supabase
          const result = await login(u.correo_electronico, u.password || 'facial-auth')
          
          if (result.success) {
            closeFaceModal()
            const userRole = result.data.profile?.rol
            switch (userRole) {
              case 'admin':
                navigate('/admin/dashboard')
                break
              case 'empleado':
                navigate('/empleado/dashboard')
                break
              case 'residente':
                navigate('/residente/dashboard')
                break
              default:
                navigate('/dashboard')
            }
          }
        } else {
          setFaceStatus('Buscando coincidencia...')
        }
      } catch (e) {
        console.error(e)
        setFaceError('Error comunicando con el servidor.')
        setFaceStatus('Error de comunicación')
      }
    }, intervalMs)
  }

  function drawBoxes(res, sendW, sendH) {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const sx = canvas.width / sendW
    const sy = canvas.height / sendH
    res.forEach(r => {
      const left = Math.round(r.left * sx)
      const top = Math.round(r.top * sy)
      const right = Math.round(r.right * sx)
      const bottom = Math.round(r.bottom * sy)
      const ok = r.name !== 'Desconocido'
      ctx.lineWidth = 3
      ctx.strokeStyle = ok ? '#22c55e' : '#ef4444'
      ctx.strokeRect(left, top, right - left, bottom - top)
      const label = `${r.name} ${(r.confidence * 100).toFixed(0)}%`
      ctx.font = '14px ui-sans-serif, system-ui'
      const textW = ctx.measureText(label).width + 10
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(left, top - 22, textW, 20)
      ctx.fillStyle = '#fff'
      ctx.fillText(label, left + 5, top - 7)
    })
  }

  // Limpiar cámara cuando se desmonta el modal
  useEffect(() => {
    if (!showFaceModal) {
      stopLoop()
      stopCamera()
    }
  }, [showFaceModal])

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Panel Izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white w-full">
          {/* Logo/Icono */}
          <div className="mb-8 bg-white/20 backdrop-blur-lg p-6 rounded-3xl shadow-2xl">
            <Building2 className="h-20 w-20 text-white" />
          </div>
          
          {/* Título */}
          <h1 className="text-5xl font-bold mb-4 text-center">
            Edificio Multifuncional
          </h1>
          <p className="text-xl text-white/90 text-center mb-12 max-w-md">
            Sistema de Gestión Integral para tu Edificio
          </p>
          
          {/* Características */}
          <div className="space-y-6 max-w-md w-full">
            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Seguridad Garantizada</h3>
                <p className="text-white/80 text-sm">Protección de datos con Supabase</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gestión de Usuarios</h3>
                <p className="text-white/80 text-sm">Control para residentes y empleados</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Administración Completa</h3>
                <p className="text-white/80 text-sm">Servicios, pagos y mantenimiento</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:w-1/2 h-screen">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-center px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
            <div className="w-full max-w-lg space-y-6">
              {/* Logo móvil */}
              <div className="lg:hidden text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Edificio Multifuncional</h2>
              </div>

              {/* Header */}
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Bienvenido de vuelta
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Inicia sesión para acceder a tu cuenta
                </p>
              </div>

          {/* Formulario */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                    placeholder="tu@email.com"
                    disabled={loading || authLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
                    placeholder="••••••••"
                    disabled={loading || authLoading}
                  />
                </div>
                <div className="mt-2 text-right">
                  <a 
                    href="/forgot-password" 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition duration-200"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 shadow-sm">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* reCAPTCHA */}
            <ReCaptcha
              onVerify={handleRecaptchaVerify}
              onExpired={handleRecaptchaExpired}
              onError={handleRecaptchaError}
              verified={recaptchaVerified}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading || authLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Botón de Reconocimiento Facial */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">O</span>
            </div>
          </div>

          <button
            type="button"
            onClick={openFaceModal}
            disabled={loading || authLoading}
            className="w-full flex justify-center items-center py-4 px-4 border-2 border-indigo-600 text-base font-semibold rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Camera className="mr-2 h-5 w-5" />
            Entrar con Reconocimiento Facial
          </button>

          {/* Usuarios de prueba (solo desarrollo) */}
          {import.meta.env.DEV && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <p className="font-semibold text-amber-900 mb-3 flex items-center">
                <span className="mr-2">🔑</span> Usuarios de prueba
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillTestUser('cgutierrezaruni@gmail.com', 'Admin2024!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">👑 Administrador</p>
                    <p className="text-xs text-gray-600">cgutierrezaruni@gmail.com</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillTestUser('anchoque3@umsa.bo', 'Temp123!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">🏠 Residente</p>
                    <p className="text-xs text-gray-600">anchoque3@umsa.bo</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => fillTestUser('walterquintanillavi@gmail.com', 'Temp123!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">👨‍💼 Empleado</p>
                    <p className="text-xs text-gray-600">walterquintanillavi@gmail.com</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillTestUser('maquizeq@fcpn.edu.bo', 'Temp123!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">🏠 Residente</p>
                    <p className="text-xs text-gray-600">maquizeq@fcpn.edu.bo</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillTestUser('oquispev2@fcpn.edu.bo', 'Temp123!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">🏠 Residente</p>
                    <p className="text-xs text-gray-600">oquispev2@fcpn.edu.bo</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillTestUser('aguila.adartse5@gmail.com', 'Temp123!')}
                  className="w-full flex items-center justify-between bg-white/70 hover:bg-white p-3 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">👨‍💼 Empleado</p>
                    <p className="text-xs text-gray-600">aguila.adartse5@gmail.com</p>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">Usar</span>
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reconocimiento Facial */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-6 w-6" />
                    <h3 className="text-xl font-bold">Reconocimiento Facial</h3>
                  </div>
                  <button
                    onClick={closeFaceModal}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal con scroll */}
              <div className="flex-1 overflow-y-auto p-6">
              {/* Vista de la cámara */}
              <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* Overlay de estado */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${faceRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">{faceStatus}</span>
                    </div>
                    {faceRt > 0 && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {faceRt}ms
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Error */}
              {faceError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-red-800">{faceError}</span>
                  </div>
                </div>
              )}

              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">📸 Instrucciones:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Asegúrate de tener buena iluminación</li>
                  <li>• Mira directamente a la cámara</li>
                  <li>• Mantén el rostro dentro del recuadro</li>
                  <li>• El sistema te reconocerá automáticamente</li>
                </ul>
              </div>

              {/* Botón de cancelar */}
              <button
                onClick={closeFaceModal}
                className="w-full mt-4 py-3 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
