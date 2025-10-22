import axios from 'axios'

// Configuración del backend (proxy) que se encargará de hablar con Libélula
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class LibelulaService {
  constructor() {
    this.baseUrl = `${API_BASE}/api/libelula`
  }

  // Crea una nueva orden de pago en Libélula a través del backend
  async iniciarPago(deuda, pagador, metodoPago) {
    try {
      const url = `${this.baseUrl}/payment/new`
      const body = {
        deuda,
        pagador,
        metodoPago,
        url_callback: window?.location?.origin ? `${window.location.origin}/pagos/callback` : undefined
      }
      const { data } = await axios.post(url, body)
      return data
    } catch (error) {
      console.error('[LibelulaService] Error iniciarPago:', error)
      return { success: false, error: error.response?.data || error.message }
    }
  }

  // Consulta el estado de una orden
  async verificarEstadoPago(ordenId) {
    try {
      const url = `${this.baseUrl}/payment/status/${encodeURIComponent(ordenId)}`
      const { data } = await axios.get(url)
      return data
    } catch (error) {
      console.error('[LibelulaService] Error verificarEstadoPago:', error)
      return { success: false, error: error.response?.data || error.message }
    }
  }

  // Procesa un pago con tarjeta para una orden existente
  async procesarPagoTarjeta(ordenId, datosTarjeta) {
    try {
      const url = `${this.baseUrl}/payment/process-card`
      const payload = {
        orden_id: ordenId,
        numero_tarjeta: datosTarjeta.numero,
        mes_vencimiento: datosTarjeta.mes,
        anio_vencimiento: datosTarjeta.anio,
        cvv: datosTarjeta.cvv,
        nombre_titular: datosTarjeta.titular
      }
      const { data } = await axios.post(url, payload)
      return data
    } catch (error) {
      console.error('[LibelulaService] Error procesarPagoTarjeta:', error)
      return { success: false, error: error.response?.data || error.message }
    }
  }

  // Obtener QR generado por Libélula (si aplica en su API)
  async generarQR(ordenId) {
    try {
      const url = `${this.baseUrl}/payment/qr/${encodeURIComponent(ordenId)}`
      const { data } = await axios.get(url)
      return data
    } catch (error) {
      console.error('[LibelulaService] Error generarQR:', error)
      return { success: false, error: error.response?.data || error.message }
    }
  }
}

const libelulaService = new LibelulaService()
export default libelulaService
