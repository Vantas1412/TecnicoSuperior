// src/components/shared/FormularioEntregaArea.jsx
import React, { useState } from 'react';
import reservaService from '../../services/ReservaService';

const FormularioEntregaArea = ({ reserva, empleadoId, onGuardar, onCancelar }) => {
  const [estadoEntrega, setEstadoEntrega] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const estadosEntrega = [
    { value: 'Excelente', label: 'Excelente', color: 'bg-green-100 text-green-800' },
    { value: 'Bueno', label: 'Bueno', color: 'bg-blue-100 text-blue-800' },
    { value: 'Regular', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Malo', label: 'Malo', color: 'bg-orange-100 text-orange-800' },
    { value: 'Dañado', label: 'Dañado', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!estadoEntrega) {
      alert('Por favor selecciona un estado de entrega');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await reservaService.registrarEntregaArea(
        reserva.id_reserva,
        estadoEntrega,
        descripcion,
        empleadoId
      );

      if (resultado.success) {
        alert('Entrega del área registrada exitosamente');
        if (onGuardar) onGuardar(resultado.data);
      } else {
        alert(`Error al registrar entrega: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el registro de entrega');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Registro de Entrega de Área Común
      </h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{reserva.nombre_area || 'Área Común'}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Residente:</span> {reserva.nombre_residente}
          </div>
          <div>
            <span className="font-medium">Fecha:</span> {new Date(reserva.fecha).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">Horario:</span> {reserva.hora_inicio?.slice(0, 5)} - {reserva.hora_fin?.slice(0, 5)}
          </div>
          <div>
            <span className="font-medium">Reserva #:</span> {reserva.id_reserva}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Estado del Área al Momento de Entrega *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {estadosEntrega.map((estado) => (
              <label
                key={estado.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  estadoEntrega === estado.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="estadoEntrega"
                  value={estado.value}
                  checked={estadoEntrega === estado.value}
                  onChange={(e) => setEstadoEntrega(e.target.value)}
                  className="mr-3 h-5 w-5"
                />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${estado.color}`}>
                  {estado.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observaciones / Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe cualquier observación sobre el estado del área (opcional)..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Si seleccionaste "Malo" o "Dañado", por favor describe los daños encontrados.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={guardando || !estadoEntrega}
          >
            {guardando ? 'Guardando...' : 'Registrar Entrega'}
          </button>
        </div>
      </form>

      {estadoEntrega === 'Dañado' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Nota importante:</strong> Al registrar el área como "Dañado", se generará un reporte 
            automático para el departamento de mantenimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default FormularioEntregaArea;
