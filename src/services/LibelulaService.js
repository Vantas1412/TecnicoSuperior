// ============================================================
// MOCK SERVICE - Tu amigo debe implementar la lógica real
// ============================================================

const LIBELULA_CONFIG = {
  appKey: import.meta.env.VITE_LIBELULA_APPKEY,
  apiUrl: import.meta.env.VITE_LIBELULA_API_URL,
  sandbox: import.meta.env.VITE_LIBELULA_SANDBOX === 'true'
}

class LibelulaService {
  constructor() {
    this.config = LIBELULA_CONFIG
  }

  // TODO: Tu amigo - Implementar llamada real a POST /payment/new
  async iniciarPago(deuda, pagador, metodoPago) {
    console.log('[LibelulaService MOCK] iniciarPago:', { deuda, pagador, metodoPago })
    
    // Simulación de delay de red
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            orden_id: 'MOCK-' + Date.now(),
            qr_data: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK-PAYMENT-' + Date.now(),
            url_checkout: 'https://sandbox.libelula.bo/checkout/mock',
            estado: 'PENDING',
            monto: deuda.monto,
            concepto: deuda.concepto
          }
        })
      }, 1000)
    })
  }

  // TODO: Tu amigo - Implementar llamada real a GET /payment/status/{ordenId}
  async verificarEstadoPago(ordenId) {
    console.log('[LibelulaService MOCK] verificarEstadoPago:', ordenId)
    
    // Simulación: después de 10 segundos el pago se aprueba
    const tiempoTranscurrido = Date.now() - parseInt(ordenId.split('-')[1] || '0')
    const estaAprobado = tiempoTranscurrido > 10000
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            estado: estaAprobado ? 'APPROVED' : 'PENDING',
            transaccion_id: ordenId,
            fecha: new Date().toISOString(),
            monto: 100,
            metodo: 'QR'
          }
        })
      }, 500)
    })
  }

  // TODO: Tu amigo - Implementar llamada real a POST /payment/process
  async procesarPagoTarjeta(ordenId, datosTarjeta) {
    console.log('[LibelulaService MOCK] procesarPagoTarjeta:', { ordenId, datosTarjeta })
    
    // Simulación de procesamiento de tarjeta
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular aprobación si la tarjeta termina en número par
        const ultimoDigito = parseInt(datosTarjeta.numero.slice(-1))
        const aprobado = ultimoDigito % 2 === 0
        
        resolve({
          success: aprobado,
          data: aprobado ? {
            estado: 'APPROVED',
            transaccion_id: ordenId,
            mensaje: 'Pago aprobado (MOCK)',
            fecha: new Date().toISOString(),
            metodo: 'TARJETA',
            ultimos_digitos: datosTarjeta.numero.slice(-4)
          } : null,
          error: aprobado ? null : 'Tarjeta rechazada (MOCK - usa número que termine en par)'
        })
      }, 3000)
    })
  }

  // TODO: Tu amigo - Implementar generación de QR real si Libélula lo provee
  async generarQR(ordenId) {
    console.log('[LibelulaService MOCK] generarQR:', ordenId)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MOCK-' + ordenId
          }
        })
      }, 500)
    })
  }
}

const libelulaService = new LibelulaService()
export default libelulaService
