import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import RealizaService from '../../services/RealizaService'
import ComprobantePago from '../shared/ComprobantePago'

export default function ReportesSalarios() {
  const { profile, user } = useAuth()
  const idPersona = profile?.persona?.id_persona || profile?.id_persona || user?.id_persona
  const [pagos, setPagos] = useState([])
  const [modal, setModal] = useState({ open: false, pago: null })

  useEffect(() => {
    const cargar = async () => {
      if (!idPersona) return
      const res = await RealizaService.obtenerPagosRecibidosPorPersona(idPersona)
      setPagos(res.success ? (res.data || []) : [])
    }
    cargar()
  }, [idPersona])

  const verComprobante = (p) => {
    setModal({
      open: true,
      pago: {
        id_transaccion: p.id_pago,
        fecha: p.fecha || new Date().toISOString(),
        concepto: p.concepto || 'Pago de sueldo',
        monto: Number(p.monto || 0),
        metodo: p.metodo_pago || 'Transferencia BNB (Cuenta edificio 1-5398771)',
        banco: 'Banco Nacional de Bolivia',
        pagador: profile?.persona?.nombre || profile?.username || 'Admin',
        ci: profile?.ci || 'N/A'
      }
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reportes de Salarios</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Concepto</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Monto</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Fecha</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Método</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id_pago} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-800">{p.concepto}</td>
                <td className="p-3 text-sm text-green-700 font-semibold">Bs {Number(p.monto || 0).toFixed(2)}</td>
                <td className="p-3 text-sm text-gray-500">{p.fecha ? new Date(p.fecha).toLocaleDateString() : '-'}</td>
                <td className="p-3 text-sm text-gray-700">{p.metodo_pago || 'Transferencia'}</td>
                <td className="p-3 text-sm">
                  <button onClick={() => verComprobante(p)} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Descargar PDF</button>
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">Aún no tienes pagos de salario registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ComprobantePago
        isOpen={modal.open}
        pago={modal.pago}
        onClose={() => setModal({ open: false, pago: null })}
      />
    </div>
  )
}
