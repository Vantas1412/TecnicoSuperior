import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import supabase from '../../services/dbConnection';
import ComprobantePago from '../shared/ComprobantePago';

export default function ReportesSeccion() {
  const { profile, user } = useAuth();
  const idPersona = profile?.persona?.id_persona || profile?.id_persona || user?.id_persona;
  const [facturas, setFacturas] = useState([]);
  const [modal, setModal] = useState({ open: false, pago: null });

  const cargar = async () => {
    if (!idPersona) return;
    const { data } = await supabase
      .from('factura')
      .select('*')
      .eq('id_persona', idPersona)
      .eq('estado', 'pagada')
      .order('fecha_emision', { ascending: false });
    setFacturas(data || []);
  };

  useEffect(() => { cargar(); }, [idPersona]);

  const verComprobante = (f) => {
    // Armar datos mínimos para el comprobante reutilizando el componente existente
    setModal({
      open: true,
      pago: {
        id_transaccion: f.id_factura,
        fecha: f.fecha_emision,
        concepto: `Factura ${f.servicio.toUpperCase()} ${String(f.mes).padStart(2, '0')}/${f.anio}`,
        monto: Number(f.total || 0),
        metodo: 'Simulado',
        pagador: profile?.persona?.nombre || profile?.username || 'Usuario',
        ci: profile?.ci || 'N/A'
      }
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reportes y Facturas Pagadas</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Servicio</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Periodo</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Consumo</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Total</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Emitida</th>
              <th className="text-left text-xs font-semibold text-gray-600 p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id_factura} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm font-medium text-gray-800 capitalize">{f.servicio}</td>
                <td className="p-3 text-sm text-gray-700">{String(f.mes).padStart(2, '0')}/{f.anio}</td>
                <td className="p-3 text-sm text-gray-700">{Number(f.consumo || 0).toFixed(2)}</td>
                <td className="p-3 text-sm text-green-700 font-semibold">Bs {Number(f.total || 0).toFixed(2)}</td>
                <td className="p-3 text-sm text-gray-500">{new Date(f.fecha_emision).toLocaleDateString()}</td>
                <td className="p-3 text-sm">
                  <button onClick={() => verComprobante(f)} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Descargar PDF</button>
                </td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">Aún no tienes facturas pagadas</td>
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
  );
}
