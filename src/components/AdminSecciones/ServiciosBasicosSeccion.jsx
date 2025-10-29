import React, { useEffect, useState } from 'react';
import facturaService from '../../services/FacturaService';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ServicioCell = ({ label, data }) => {
  const consumo = Number(data?.consumo || 0);
  const costo = Number(data?.costo || 0);
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-semibold text-gray-800">{consumo.toFixed(2)} / Bs {costo.toFixed(2)}</div>
    </div>
  );
};

export default function ServiciosBasicosSeccion() {
  const { profile } = useAuth();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getUTCMonth() + 1);
  const [anio, setAnio] = useState(hoy.getUTCFullYear());
  const [cargando, setCargando] = useState(false);
  const [filas, setFilas] = useState([]);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await facturaService.resumenGlobal(mes, anio);
      setFilas(data);
    } catch (e) {
      console.error(e);
      toast.error('Error cargando consumos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio]);

  const cobrarMes = async () => {
    try {
      setCargando(true);
      const generado_por = profile?.id_persona || profile?.persona?.id_persona || null;
      const res = await facturaService.cobrarMesActualParaTodos({ mes, anio, generado_por });
      const efectivas = res.filter(r => r.success && !r.skipped);
      const cant = efectivas.length;
      const personasAfectadas = new Set(efectivas.map(r => r.id_persona)).size;
      if (cant > 0) {
        toast.success(`Cobro generado: ${cant} cargos en ${personasAfectadas} residente(s).`);
      } else {
        toast(`No se generaron cargos para ${String(mes).padStart(2,'0')}/${anio}.`, { icon: 'ℹ️' });
      }
      await cargar();
    } catch (e) {
      console.error(e);
      toast.error('Error al generar facturación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Pagos de Servicios Básicos</h2>
        <div className="flex items-center gap-2">
          <select className="border rounded px-2 py-1" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
            ))}
          </select>
          <input
            type="number"
            className="border rounded px-2 py-1 w-24"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={cargar}
            disabled={cargando}
          >
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={cobrarMes}
            disabled={cargando}
          >
            Cobrar mes en curso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-600 p-3">Residente</th>
                <th className="text-left text-xs font-semibold text-gray-600 p-3">Agua (consumo/costo)</th>
                <th className="text-left text-xs font-semibold text-gray-600 p-3">Luz (consumo/costo)</th>
                <th className="text-left text-xs font-semibold text-gray-600 p-3">Gas (consumo/costo)</th>
                <th className="text-left text-xs font-semibold text-gray-600 p-3">Internet (consumo/costo)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id_persona} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-800 font-medium">{f.nombre}</td>
                  <td className="p-3"><ServicioCell label="Agua" data={f.agua} /></td>
                  <td className="p-3"><ServicioCell label="Luz" data={f.luz} /></td>
                  <td className="p-3"><ServicioCell label="Gas" data={f.gas} /></td>
                  <td className="p-3"><ServicioCell label="Internet" data={f.internet} /></td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">Sin datos para el periodo seleccionado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
