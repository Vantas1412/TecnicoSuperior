import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import asistenciaService from '../../services/AsistenciaService';

const InformeTrabajo = () => {
  const { user } = useAuth();
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.empleado?.id_empleado) {
      loadInformes();
    }
  }, [filtroMes, filtroAnio, user]);

  const loadInformes = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.empleado?.id_empleado) {
        throw new Error('No se pudo obtener la información del empleado');
      }

      const result = await asistenciaService.obtenerInformesPorEmpleado(
        user.empleado.id_empleado,
        filtroMes,
        filtroAnio
      );

      if (result.success) {
        setInformes(result.data);
      } else {
        setError('Error al cargar los informes: ' + result.error);
      }
    } catch (error) {
      console.error('Error cargando informes:', error);
      setError('Error al conectar con el servidor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  };

  const formatCurrency = (amount) => {
    return `Bs ${Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No asignada';
    return new Date(fecha).toLocaleDateString('es-BO');
  };

  const descargarComprobante = (comprobanteUrl) => {
    if (comprobanteUrl) {
      window.open(comprobanteUrl, '_blank');
    } else {
      alert('No hay comprobante disponible para descargar');
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      'pagado': { color: 'bg-green-100 text-green-800', label: 'Pagado' },
      'pendiente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' }
    };
    return estados[estado] || estados.pendiente;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando informes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Informe de Trabajo</h1>
          <p className="text-gray-600 mt-2">Consulta tus horas trabajadas y comprobantes de pago</p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="text-red-800 hover:text-red-900 font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mes
              </label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                  <option key={mes} value={mes}>
                    {getNombreMes(mes)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año
              </label>
              <select
                value={filtroAnio}
                onChange={(e) => setFiltroAnio(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i + 2).map(anio => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadInformes}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Información del empleado */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información Laboral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Cargo</label>
              <p className="text-lg font-semibold text-gray-800">
                {user?.empleado?.tipo || 'Empleado'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tipo de Contrato</label>
              <p className="text-lg font-semibold text-gray-800">
                {user?.empleado?.tipo_de_contrato || 'Indefinido'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Sueldo Base</label>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(user?.empleado?.sueldo || 2000)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha Contrato</label>
              <p className="text-lg font-semibold text-gray-800">
                {user?.empleado?.fecha_contratacion ? 
                  new Date(user.empleado.fecha_contratacion).toLocaleDateString('es-BO') : 
                  'No especificada'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de informes */}
        <div className="space-y-6">
          {informes.map((informe, index) => {
            const estadoBadge = getEstadoBadge(informe.estado_pago);
            
            return (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header del informe */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getNombreMes(informe.mes)} {informe.anio}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoBadge.color}`}>
                      {estadoBadge.label}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  {/* Resumen de horas y pagos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="text-center">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Horas Trabajadas</label>
                      <p className="text-2xl font-bold text-blue-600">{informe.horas_trabajadas}h</p>
                      <p className="text-xs text-gray-500 mt-1">{informe.dias_trabajados} días trabajados</p>
                    </div>
                    <div className="text-center">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Horas Extra</label>
                      <p className="text-2xl font-bold text-orange-600">{informe.horas_extra}h</p>
                      <p className="text-xs text-gray-500 mt-1">+25% por hora extra</p>
                    </div>
                    <div className="text-center">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Pago Base</label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(informe.pago_base)}</p>
                    </div>
                    <div className="text-center">
                      <label className="text-sm font-medium text-gray-600 block mb-2">Total</label>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(informe.total_pago)}</p>
                      <p className="text-xs text-gray-500 mt-1">Base + Extras</p>
                    </div>
                  </div>

                  {/* Detalles de pago */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">Detalles del Pago</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Fecha de Pago</label>
                        <p className="text-gray-800">
                          {informe.fecha_pago ? formatFecha(informe.fecha_pago) : 'Pendiente de pago'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Estado</label>
                        <p className="text-gray-800 capitalize">{informe.estado_pago}</p>
                      </div>
                    </div>
                  </div>

                  {/* Información de realizaciones (pagos) */}
                  {informe.realizaciones && informe.realizaciones.map((realiza) => (
                    <div key={realiza.id_realiza} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Información de Pago</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Pagador</label>
                          <p className="text-gray-800">{realiza.pagador}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Beneficiario</label>
                          <p className="text-gray-800">{realiza.beneficiario}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Método de Pago</label>
                          <p className="text-gray-800">{realiza.metodo_pago}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Número de Cuenta</label>
                          <p className="text-gray-800">{realiza.nro_cuenta}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Monto</label>
                          <p className="text-gray-800 font-semibold">{formatCurrency(realiza.monto)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Concepto</label>
                          <p className="text-gray-800">{realiza.concepto}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Acciones */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => descargarComprobante(informe.comprobante_url)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>📄</span>
                      <span>Descargar Comprobante</span>
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
                      <span>👁️</span>
                      <span>Ver Detalles</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {informes.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No hay informes para el período seleccionado</p>
            <p className="text-gray-400 text-sm mt-2">
              {user?.empleado ? 
                'No se encontraron registros de asistencia o pagos para este período' : 
                'No se pudo cargar la información del empleado'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InformeTrabajo;