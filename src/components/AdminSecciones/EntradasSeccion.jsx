import React, { useEffect, useState } from 'react';
import supabase from '../../services/dbConnection';

const EntradasSeccion = () => {
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntradas = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error: err } = await supabase
          .from('entrada')
          .select('hora, persona:id_persona (id_persona, nombre, apellido)')
          .order('hora', { ascending: false });
        if (err) throw err;
        setEntradas(data);
      } catch (e) {
        setError('Error al cargar entradas: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEntradas();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Entradas al Edificio</h2>
      {loading ? (
        <div className="text-center py-8">Cargando entradas...</div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Persona</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hora de Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entradas.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-gray-500">No hay entradas registradas</td>
                </tr>
              ) : (
                entradas.map((e, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{e.persona?.id_persona}</td>
                    <td className="px-4 py-2">{e.persona?.nombre} {e.persona?.apellido}</td>
                    <td className="px-4 py-2">{e.hora}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EntradasSeccion;
