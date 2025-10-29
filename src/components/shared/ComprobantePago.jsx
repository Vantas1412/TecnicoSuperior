import { X, Download, Mail, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { jsPDF } from 'jspdf'

export default function ComprobantePago({ isOpen, pago, onClose }) {
  if (!isOpen || !pago) return null

  const handleDescargarPDF = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })

      // Encabezado
      doc.setFillColor('#10b981') // emerald-500
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F')
      doc.setTextColor('#ffffff')
      doc.setFontSize(16)
      doc.text('Comprobante de Pago', 40, 38)

      // Cuerpo
      doc.setTextColor('#111827') // gray-900
      doc.setFontSize(12)
      let y = 100
      const line = (label, value, bold = false) => {
        doc.setFont(undefined, 'normal')
        doc.setTextColor('#6b7280')
        doc.text(label, 40, y)
        doc.setTextColor('#111827')
        if (bold) doc.setFont(undefined, 'bold')
        const text = value ?? ''
        doc.text(String(text), 220, y)
        y += 24
      }

      line('N° Transacción:', pago.id_transaccion, true)
      const fechaStr = new Date(pago.fecha).toLocaleString('es-BO')
      line('Fecha y Hora:', fechaStr)
      line('Concepto:', pago.concepto)
      if (pago.banco) {
        line('Banco:', pago.banco)
      }
      line('Método de Pago:', pago.metodo)
      line('Pagador:', pago.pagador)
      line('CI:', pago.ci)
      y += 10
      doc.setFontSize(14)
      doc.setTextColor('#065f46') // emerald-900
      doc.setFont(undefined, 'bold')
      doc.text(`Monto Pagado: Bs ${Number(pago.monto || 0).toFixed(2)}`, 40, y)

      // Pie de página
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(9)
      doc.setTextColor('#6b7280')
      doc.text('Documento generado electrónicamente por el Sistema de Gestión', 40, pageH - 40)
      doc.text(`Edificio Técnico Superior - ${new Date().getFullYear()}`, 40, pageH - 24)

      // Guardar
      const nombreArchivo = `Comprobante_${pago.id_transaccion}.pdf`
      doc.save(nombreArchivo)
    } catch (e) {
      console.error('[ComprobantePago] Error generando PDF:', e)
      alert('No se pudo generar el PDF. Intenta nuevamente.')
    }
  }

  const handleEnviarEmail = () => {
    // TODO: Tu amigo - Implementar envío de email con EmailService
    console.log('[ComprobantePago] Enviar email:', pago)
    alert('Función de envío de email pendiente de implementar por backend')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Comprobante de Pago</h2>
              <p className="text-white/80 text-sm mt-1">Documento generado electrónicamente</p>
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
        <div className="p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Check className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">PAGO REALIZADO</h3>
            <p className="text-gray-600 text-sm">Sistema de Gestión - Edificio Técnico Superior</p>
          </div>

          {/* Información del pago */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <table className="w-full">
              <tbody className="space-y-3">
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">N° Transacción:</td>
                  <td className="py-3 text-right">
                    <span className="font-mono font-semibold text-gray-900">{pago.id_transaccion}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">Fecha y Hora:</td>
                  <td className="py-3 text-right font-semibold text-gray-900">
                    {new Date(pago.fecha).toLocaleString('es-BO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">Concepto:</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{pago.concepto}</td>
                </tr>
                {pago.banco && (
                  <tr className="border-b border-gray-200">
                    <td className="py-3 text-gray-600 font-medium">Banco:</td>
                    <td className="py-3 text-right font-semibold text-gray-900">{pago.banco}</td>
                  </tr>
                )}
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">Método de Pago:</td>
                  <td className="py-3 text-right">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                      {pago.metodo}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">Pagador:</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{pago.pagador}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 text-gray-600 font-medium">CI:</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{pago.ci}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-medium text-lg">Monto Pagado:</td>
                  <td className="py-3 text-right">
                    <span className="text-2xl font-bold text-green-600">
                      Bs {pago.monto?.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* QR Code para verificación */}
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Código de verificación</p>
              <div className="bg-white p-4 border-2 border-gray-200 rounded-lg inline-block">
                <QRCodeSVG 
                  value={pago.id_transaccion} 
                  size={120}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 font-mono">{pago.id_transaccion}</p>
            </div>
          </div>

          {/* Nota legal */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-amber-900 text-center">
              <strong>Nota:</strong> Este comprobante es válido como constancia de pago. 
              Conserve este documento para futuras referencias.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleDescargarPDF}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
            <button
              onClick={handleEnviarEmail}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Enviar por Email
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Firma digital */}
        <div className="px-8 pb-6">
          <p className="text-xs text-gray-400 text-center">
            Documento generado electrónicamente por el Sistema de Gestión
            <br />
            Edificio Técnico Superior - {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
