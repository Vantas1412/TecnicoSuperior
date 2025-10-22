import jsPDF from 'jspdf'
import emailService from './EmailService'
import pagoService from './PagoService'

class ComprobanteDocService {
  async generarPDFComprobante(pago) {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' })

    // Contenido
    doc.setFontSize(12)
    doc.text(`N° Transacción: ${pago.id_transaccion}`, 20, 40)
    doc.text(`Fecha: ${new Date(pago.fecha).toLocaleString('es-BO')}`, 20, 50)
    doc.text(`Concepto: ${pago.concepto}`, 20, 60)
    doc.text(`Monto: Bs ${Number(pago.monto || 0).toFixed(2)}`, 20, 70)
    doc.text(`Método: ${pago.metodo}`, 20, 80)
    doc.text(`Pagador: ${pago.pagador}`, 20, 90)
    doc.text(`CI: ${pago.ci}`, 20, 100)

    // Generar Blob del PDF
    return doc.output('blob')
  }

  async enviarComprobantePorEmail(idPago, emailDestino) {
    // Obtener datos consolidados del pago
    const comp = await pagoService.generarDatosComprobante(idPago)
    if (!comp.success) throw new Error(comp.error || 'No se pudo generar datos del comprobante')
    const pago = comp.data

    // Por simplicidad, enviamos un HTML con la información (adjuntos requieren ampliar el backend)
    const asunto = `Comprobante de pago ${pago.id_transaccion}`
    const contenido = `
      <h2>Comprobante de Pago</h2>
      <p><strong>N° Transacción:</strong> ${pago.id_transaccion}</p>
      <p><strong>Fecha:</strong> ${new Date(pago.fecha).toLocaleString('es-BO')}</p>
      <p><strong>Concepto:</strong> ${pago.concepto}</p>
      <p><strong>Monto:</strong> Bs ${Number(pago.monto || 0).toFixed(2)}</p>
      <p><strong>Método:</strong> ${pago.metodo}</p>
      <p><strong>Pagador:</strong> ${pago.pagador}</p>
      <p><strong>CI:</strong> ${pago.ci}</p>
    `
    await emailService.sendEmail(emailDestino, asunto, contenido, 'comprobante')
    return { success: true }
  }
}

export default new ComprobanteDocService()
