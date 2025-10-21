import { useState, useEffect, useRef } from 'react'
import { X, CreditCard, QrCode, Check, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import LibelulaService from '../../services/LibelulaService'
import toast from 'react-hot-toast'

export default function PasarelaPagos({ isOpen, deuda, usuario, onSuccess, onError, onClose }) {
  const [paso, setPaso] = useState(1)
  const [metodoPago, setMetodoPago] = useState(null)
  const [loading, setLoading] = useState(false)
  const [ordenId, setOrdenId] = useState(null)
  const [error, setError] = useState(null)
  const [resultado, setResultado] = useState(null)
  
  const [formData, setFormData] = useState({
    nombre: usuario?.persona?.nombre || usuario?.username || '',
    ci: '',
    email: usuario?.email || '',
    telefono: ''
  })

  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    titular: '',
    mes: '',
    anio: '',
    cvv: ''
  })

  const [qrData, setQrData] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(300) // 5 minutos
  const pollingRef = useRef(null)
  const timerRef = useRef(null)

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Timer para QR
  useEffect(() => {
    if (metodoPago === 'QR' && paso === 3) {
      timerRef.current = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setError('El código QR ha expirado. Por favor intenta nuevamente.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [metodoPago, paso])

  const formatTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validarEmail = (email) => /\S+@\S+\.\S+/.test(email)
  const validarCI = (ci) => /^\d{6,}$/.test(ci)
  const validarTelefono = (tel) => /^\d{7,}$/.test(tel)

  const handleContinuarPaso1 = () => {
    if (!formData.nombre.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }
    if (!validarCI(formData.ci)) {
      toast.error('CI debe tener al menos 6 dígitos')
      return
    }
    if (!validarEmail(formData.email)) {
      toast.error('Email inválido')
      return
    }
    if (!validarTelefono(formData.telefono)) {
      toast.error('Teléfono debe tener al menos 7 dígitos')
      return
    }
    setPaso(2)
  }

  const handleSeleccionarMetodo = async (metodo) => {
    setMetodoPago(metodo)
    setLoading(true)
    setError(null)

    try {
      const resultado = await LibelulaService.iniciarPago(deuda, formData, metodo)
      
      if (resultado.success) {
        setOrdenId(resultado.data.orden_id)
        
        if (metodo === 'QR') {
          setQrData(resultado.data.qr_data)
          setPaso(3)
          iniciarPollingQR(resultado.data.orden_id)
        } else {
          setPaso(3)
        }
      } else {
        setError(resultado.error || 'Error al iniciar el pago')
        toast.error('Error al procesar la solicitud')
      }
    } catch (err) {
      console.error('Error al iniciar pago:', err)
      setError('Error de conexión. Por favor intenta nuevamente.')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const iniciarPollingQR = (ordenIdParam) => {
    const ordenIdActual = ordenIdParam || ordenId
    
    pollingRef.current = setInterval(async () => {
      try {
        const resultado = await LibelulaService.verificarEstadoPago(ordenIdActual)
        
        if (resultado.success && resultado.data.estado === 'APPROVED') {
          clearInterval(pollingRef.current)
          clearInterval(timerRef.current)
          setResultado(resultado.data)
          setPaso(4)
          toast.success('¡Pago aprobado!')
        } else if (resultado.success && resultado.data.estado === 'REJECTED') {
          clearInterval(pollingRef.current)
          clearInterval(timerRef.current)
          setError('El pago fue rechazado')
          toast.error('Pago rechazado')
        }
      } catch (err) {
        console.error('Error verificando estado:', err)
      }
    }, 5000) // Verificar cada 5 segundos
  }

  const handlePagarConTarjeta = async () => {
    // Validar datos de tarjeta
    if (!datosTarjeta.numero || datosTarjeta.numero.length < 13) {
      toast.error('Número de tarjeta inválido')
      return
    }
    if (!datosTarjeta.titular.trim()) {
      toast.error('Ingresa el nombre del titular')
      return
    }
    if (!datosTarjeta.mes || !datosTarjeta.anio) {
      toast.error('Ingresa la fecha de vencimiento')
      return
    }
    if (!datosTarjeta.cvv || datosTarjeta.cvv.length < 3) {
      toast.error('CVV inválido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const resultado = await LibelulaService.procesarPagoTarjeta(ordenId, datosTarjeta)
      
      if (resultado.success) {
        setResultado(resultado.data)
        setPaso(4)
        toast.success('¡Pago aprobado!')
      } else {
        setError(resultado.error || 'Pago rechazado')
        toast.error(resultado.error || 'Pago rechazado')
      }
    } catch (err) {
      console.error('Error procesando tarjeta:', err)
      setError('Error al procesar el pago')
      toast.error('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleReintentar = () => {
    setPaso(1)
    setMetodoPago(null)
    setOrdenId(null)
    setError(null)
    setResultado(null)
    setQrData(null)
    setTiempoRestante(300)
    setDatosTarjeta({
      numero: '',
      titular: '',
      mes: '',
      anio: '',
      cvv: ''
    })
  }

  const handleFinalizar = () => {
    if (resultado) {
      // TODO: Tu amigo - Aquí debe registrar el pago en la BD
      onSuccess({
        ordenId,
        transaccionId: resultado.transaccion_id,
        monto: deuda.monto,
        concepto: deuda.concepto,
        metodo: metodoPago,
        estado: resultado.estado,
        fecha: resultado.fecha
      })
    }
    onClose()
  }

  // Debugging - ver qué props recibimos
  console.log('PasarelaPagos - Props recibidas:', { isOpen, deuda, usuario })

  if (!isOpen) {
    console.log('Modal no se muestra: isOpen es false')
    return null
  }
  if (!deuda) {
    console.log('Modal no se muestra: deuda es null/undefined')
    return null
  }

  console.log('Modal SI se debería mostrar')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Pasarela de Pagos</h2>
              <p className="text-white/80 text-sm mt-1">
                {paso === 1 && 'Paso 1: Datos del pagador'}
                {paso === 2 && 'Paso 2: Método de pago'}
                {paso === 3 && 'Paso 3: Procesando pago'}
                {paso === 4 && 'Pago completado'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Resumen de deuda */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-indigo-900 mb-2">Resumen del pago</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Concepto:</span>
                <span className="font-medium">{deuda.concepto}</span>
              </div>
              {deuda.descripcion && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Descripción:</span>
                  <span className="font-medium">{deuda.descripcion}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-indigo-200 pt-2 mt-2">
                <span className="text-gray-600 font-semibold">Monto a pagar:</span>
                <span className="font-bold text-lg text-indigo-600">Bs {deuda.monto?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* PASO 1: Datos del pagador */}
          {paso === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carnet de Identidad *
                </label>
                <input
                  type="text"
                  value={formData.ci}
                  onChange={(e) => setFormData({ ...formData, ci: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="1234567"
                  maxLength="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="70123456"
                  maxLength="15"
                />
              </div>
            </div>
          )}

          {/* PASO 2: Selección de método */}
          {paso === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Selecciona tu método de pago</h3>
                <p className="text-gray-600">Elige la forma más cómoda para ti</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* QR Payment Card */}
                <button
                  onClick={() => handleSeleccionarMetodo('QR')}
                  disabled={loading}
                  className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-white to-indigo-50"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <QrCode className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-gray-800">Código QR</h4>
                    <p className="text-sm text-gray-600 mb-4">Pago rápido y seguro</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">Tigo Money</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">BCP</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">BNB</span>
                    </div>
                  </div>
                </button>

                {/* Card Payment Card */}
                <button
                  onClick={() => handleSeleccionarMetodo('TARJETA')}
                  disabled={loading}
                  className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-500 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-white to-purple-50"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <CreditCard className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h4 className="font-bold text-xl mb-2 text-gray-800">Tarjeta</h4>
                    <p className="text-sm text-gray-600 mb-4">Crédito o débito</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Visa</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Mastercard</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Amex</span>
                    </div>
                  </div>
                </button>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-3 text-indigo-600 py-6 bg-indigo-50 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-medium">Preparando tu método de pago...</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                <Check className="w-4 h-4 text-green-500" />
                <span>Pago 100% seguro y encriptado</span>
              </div>
            </div>
          )}

          {/* PASO 3: Procesamiento */}
          {paso === 3 && (
            <div>
              {/* QR */}
              {metodoPago === 'QR' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-bold text-2xl text-gray-800 mb-2">Escanea para pagar</h3>
                    <p className="text-gray-600">Usa tu app bancaria para completar el pago</p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-8">
                    {qrData && (
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                          <img 
                            src={qrData} 
                            alt="QR Code" 
                            className="relative w-72 h-72 border-8 border-white rounded-2xl shadow-2xl"
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-xl p-5 mb-6 shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 font-medium">ID de Orden:</span>
                        <span className="text-sm font-mono font-bold text-indigo-600">{ordenId}</span>
                      </div>
                      <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg p-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-3xl font-bold">{formatTiempo(tiempoRestante)}</span>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-2">El código expirará automáticamente</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
                            <span className="text-indigo-600 font-bold text-sm">1</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Abre tu app</h4>
                            <p className="text-xs text-gray-600">BCP, BNB, Tigo Money</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
                            <span className="text-indigo-600 font-bold text-sm">2</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Escanea el QR</h4>
                            <p className="text-xs text-gray-600">Selecciona "Pagar con QR"</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                            <span className="text-purple-600 font-bold text-sm">3</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Verifica el monto</h4>
                            <p className="text-xs text-gray-600">Bs {deuda.monto?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
                            <span className="text-purple-600 font-bold text-sm">4</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Confirma</h4>
                            <p className="text-xs text-gray-600">Autoriza el pago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Esperando confirmación de tu banco...</span>
                  </div>
                </div>
              )}

              {/* TARJETA */}
              {metodoPago === 'TARJETA' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-bold text-2xl text-gray-800 mb-2">Información de tu tarjeta</h3>
                    <p className="text-gray-600">Ingresa los datos de forma segura</p>
                  </div>

                  {/* Credit Card Visual */}
                  <div className="relative h-56 perspective-1000">
                    <div className="relative w-full h-full transform-style-preserve-3d">
                      <div className="absolute w-full h-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl p-6 text-white">
                        <div className="flex justify-between items-start mb-8">
                          <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md opacity-80"></div>
                          <CreditCard className="w-10 h-10 opacity-50" />
                        </div>
                        <div className="space-y-4">
                          <div className="font-mono text-2xl tracking-wider">
                            {datosTarjeta.numero || '•••• •••• •••• ••••'}
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs opacity-70 mb-1">Titular</p>
                              <p className="font-medium">{datosTarjeta.titular || 'NOMBRE APELLIDO'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs opacity-70 mb-1">Expira</p>
                              <p className="font-medium">{datosTarjeta.mes || 'MM'}/{datosTarjeta.anio || 'AA'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Número de tarjeta *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={datosTarjeta.numero}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                            setDatosTarjeta({ ...datosTarjeta, numero: value });
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-lg"
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CreditCard className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>DEMO: Termina en número par para aprobar</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del titular *
                      </label>
                      <input
                        type="text"
                        value={datosTarjeta.titular}
                        onChange={(e) => setDatosTarjeta({ ...datosTarjeta, titular: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase"
                        placeholder="COMO APARECE EN LA TARJETA"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mes *
                        </label>
                        <input
                          type="text"
                          value={datosTarjeta.mes}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                            if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                              setDatosTarjeta({ ...datosTarjeta, mes: value });
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center font-mono"
                          placeholder="MM"
                          maxLength="2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Año *
                        </label>
                        <input
                          type="text"
                          value={datosTarjeta.anio}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, anio: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center font-mono"
                          placeholder="AA"
                          maxLength="2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="password"
                          value={datosTarjeta.cvv}
                          onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center font-mono"
                          placeholder="•••"
                          maxLength="4"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Tu información está protegida</p>
                        <p className="text-xs">Utilizamos encriptación de nivel bancario para proteger tus datos.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePagarConTarjeta}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Procesando tu pago...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-6 h-6" />
                        <span>Pagar Bs {deuda.monto?.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error en el pago</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 4: Resultado */}
          {paso === 4 && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-6 rounded-full">
                  <Check className="w-16 h-16 text-green-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900">¡Pago Exitoso!</h3>
              <p className="text-gray-600">Tu pago ha sido procesado correctamente</p>

              <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">N° Transacción:</span>
                  <span className="font-mono font-semibold">{resultado?.transaccion_id || ordenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Concepto:</span>
                  <span className="font-medium">{deuda.concepto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto pagado:</span>
                  <span className="font-bold text-green-600">Bs {deuda.monto?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-medium">{metodoPago === 'QR' ? 'Código QR' : 'Tarjeta'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{new Date().toLocaleString('es-BO')}</span>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Se ha enviado un comprobante a tu correo electrónico
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3">
            {paso === 1 && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleContinuarPaso1}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Continuar
                </button>
              </>
            )}

            {paso === 2 && (
              <button
                onClick={() => setPaso(1)}
                disabled={loading}
                className="w-full px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Volver
              </button>
            )}

            {paso === 3 && error && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReintentar}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Reintentar
                </button>
              </>
            )}

            {paso === 4 && (
              <button
                onClick={handleFinalizar}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
