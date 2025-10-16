import { useEffect, useRef, useState } from 'react'

/**
 * Componente ReCaptcha usando Google reCAPTCHA v2
 * @param {function} onVerify - Callback que recibe el token cuando se verifica el captcha
 * @param {function} onExpired - Callback cuando el captcha expira
 * @param {function} onError - Callback cuando hay un error
 */
export default function ReCaptcha({ onVerify, onExpired, onError }) {
  const recaptchaRef = useRef(null)
  const widgetId = useRef(null)

  useEffect(() => {
    // Verificar si la clave de sitio está configurada
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

    console.log('🔑 reCAPTCHA Site Key:', siteKey ? 'Configurada ✅' : 'No configurada ❌')

    if (!siteKey) {
      console.warn('⚠️ VITE_RECAPTCHA_SITE_KEY no está configurado en .env')
      return
    }

    function initializeRecaptcha() {
      console.log('🔧 Intentando inicializar reCAPTCHA...')
      console.log('  - recaptchaRef.current:', !!recaptchaRef.current)
      console.log('  - window.grecaptcha:', !!window.grecaptcha)
      console.log('  - grecaptcha.render:', !!(window.grecaptcha && window.grecaptcha.render))
      console.log('  - widgetId.current:', widgetId.current)
      
      // Si ya está renderizado, no intentar renderizar de nuevo
      if (widgetId.current !== null) {
        console.log('⏭️ Widget ya renderizado, omitiendo...')
        return
      }

      // Verificar si el elemento ya tiene un widget renderizado
      if (recaptchaRef.current && recaptchaRef.current.hasChildNodes()) {
        console.log('⏭️ El elemento ya tiene contenido, omitiendo render...')
        return
      }
      
      if (recaptchaRef.current && window.grecaptcha && window.grecaptcha.render) {
        try {
          console.log('🎨 Renderizando widget de reCAPTCHA con sitekey:', siteKey.substring(0, 20) + '...')
          widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              console.log('✅ reCAPTCHA verificado, token recibido:', token ? token.substring(0, 30) + '...' : 'sin token')
              onVerify && onVerify(token)
            },
            'expired-callback': () => {
              console.log('⚠️ reCAPTCHA expirado')
              onExpired && onExpired()
            },
            'error-callback': (error) => {
              console.error('❌ Error en reCAPTCHA:', error)
              onError && onError(error)
            }
          })
          console.log('✅ Widget renderizado con ID:', widgetId.current)
        } catch (error) {
          console.error('❌ Error al renderizar reCAPTCHA:', error)
        }
      } else {
        console.warn('⚠️ No se pudo inicializar reCAPTCHA, faltan elementos')
      }
    }

    // SIEMPRE definir el callback global PRIMERO
    window.onRecaptchaLoad = () => {
      console.log('🎉 Callback onRecaptchaLoad ejecutado')
      initializeRecaptcha()
    }

    // Cargar el script de reCAPTCHA si no está ya cargado
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]')
    
    if (!existingScript) {
      console.log('📥 Cargando script de reCAPTCHA...')
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'
      script.async = true
      script.defer = true
      script.onerror = () => console.error('❌ Error al cargar script de reCAPTCHA')
      document.body.appendChild(script)
    } else if (window.grecaptcha && window.grecaptcha.render) {
      // Si el script ya está cargado Y la API está lista
      console.log('✅ Script de reCAPTCHA ya cargado, inicializando...')
      initializeRecaptcha()
    } else {
      // El script existe pero la API no está lista, el callback ya está definido arriba
      console.log('⏳ Script existe, esperando a que la API esté lista...')
    }

    // Cleanup
    return () => {
      if (widgetId.current !== null && window.grecaptcha && window.grecaptcha.reset) {
        try {
          window.grecaptcha.reset(widgetId.current)
        } catch (error) {
          console.error('Error al resetear reCAPTCHA:', error)
        }
      }
      // Limpiar callback global
      if (window.onRecaptchaLoad) {
        delete window.onRecaptchaLoad
      }
    }
  }, [onVerify, onExpired, onError])

  // Si no hay clave configurada, mostrar advertencia
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  
  if (!siteKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        ⚠️ reCAPTCHA no configurado. Agrega <code className="bg-yellow-100 px-1 rounded">VITE_RECAPTCHA_SITE_KEY</code> en tu archivo .env
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={recaptchaRef} className="mb-2"></div>
    </div>
  )
}

/**
 * Hook personalizado para gestionar el estado de reCAPTCHA
 */
export function useRecaptcha() {
  const [token, setToken] = useState(null)
  const [verified, setVerified] = useState(false)

  const handleVerify = (recaptchaToken) => {
    setToken(recaptchaToken)
    setVerified(true)
  }

  const handleExpired = () => {
    setToken(null)
    setVerified(false)
  }

  const handleError = () => {
    setToken(null)
    setVerified(false)
  }

  const reset = () => {
    setToken(null)
    setVerified(false)
  }

  return {
    token,
    verified,
    handleVerify,
    handleExpired,
    handleError,
    reset
  }
}
