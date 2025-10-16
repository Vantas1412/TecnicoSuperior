import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, AlertCircle, Building2, Shield, Users, ArrowRight } from 'lucide-react'
import ReCaptcha from '../../shared/components/ReCaptcha'

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

  return (
    <div className="h-screen w-screen flex overflow-hidden">
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
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 xl:px-16 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-lg space-y-8 py-12">
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
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
