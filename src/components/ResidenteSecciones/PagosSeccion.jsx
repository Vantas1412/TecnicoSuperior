// src/components/ResidenteSecciones/PagosSeccion.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PersonaService from '../../services/PersonaService';
import PasarelaPagos from '../shared/PasarelaPagos';
import ComprobantePago from '../shared/ComprobantePago';
import toast from 'react-hot-toast';

const PagosSeccion = () => {
  console.log('[PagosSeccion] Componente renderizado');
  const { user, profile } = useAuth();
  console.log('[PagosSeccion] user:', user, 'profile:', profile);
  const [pagos, setPagos] = useState([]);
  const [deudasPendientes, setDeudasPendientes] = useState([]);
  const [deudasPagadas, setDeudasPagadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para modales
  const [showPasarela, setShowPasarela] = useState(false);
  const [showComprobante, setShowComprobante] = useState(false);
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null);
  const [pagoComprobante, setPagoComprobante] = useState(null);

  // Obtener id_persona del profile o del user
  const idPersona = profile?.persona?.id_persona || profile?.id_persona || user?.id_persona;

  useEffect(() => {
    console.log('[PagosSeccion] useEffect ejecutado, idPersona:', idPersona, 'profile:', profile);
    cargarDatosPagos();
  }, [idPersona]);

  const cargarDatosPagos = async () => {
    console.log('[PagosSeccion] cargarDatosPagos iniciado, idPersona:', idPersona);
    if (!idPersona) {
      console.log('[PagosSeccion] No hay id_persona, abortando carga');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Cargar pagos realizados usando la función de PostgreSQL
      console.log('[PagosSeccion] Cargando pagos...');
      const resultadoPagos = await PersonaService.obtenerPagosPorPagador(idPersona);
      console.log('[PagosSeccion] Resultado pagos:', resultadoPagos);
      
      if (resultadoPagos.success) {
        setPagos(resultadoPagos.data || []);
      } else {
        console.error('Error al cargar pagos:', resultadoPagos.error);
      }

      // Cargar deudas pendientes usando la función de PostgreSQL
      console.log('[PagosSeccion] Cargando deudas pendientes...');
      const resultadoDeudasPendientes = await PersonaService.obtenerDeudasPorEstado(idPersona, 'Pendiente');
      console.log('[PagosSeccion] Resultado deudas pendientes:', resultadoDeudasPendientes);
      
      if (resultadoDeudasPendientes.success) {
        setDeudasPendientes(resultadoDeudasPendientes.data || []);
      } else {
        console.error('Error al cargar deudas pendientes:', resultadoDeudasPendientes.error);
      }

      // Cargar deudas pagadas usando la función de PostgreSQL
      console.log('[PagosSeccion] Cargando deudas pagadas...');
      const resultadoDeudasPagadas = await PersonaService.obtenerDeudasPorEstado(idPersona, 'Pagado');
      console.log('[PagosSeccion] Resultado deudas pagadas:', resultadoDeudasPagadas);
      
      if (resultadoDeudasPagadas.success) {
        setDeudasPagadas(resultadoDeudasPagadas.data || []);
      } else {
        console.error('Error al cargar deudas pagadas:', resultadoDeudasPagadas.error);
      }

    } catch (error) {
      console.error('Error general al cargar datos de pagos:', error);
      setError('Error al cargar la información de pagos');
    } finally {
      console.log('[PagosSeccion] Carga finalizada. Estados:', { 
        pagos: pagos.length, 
        deudasPendientes: deudasPendientes.length,
        deudasPagadas: deudasPagadas.length 
      });
      setLoading(false);
    }
  };

  // Calcular totales
  const totalPagado = deudasPagadas.reduce((sum, deuda) => sum + parseFloat(deuda.monto || 0), 0);
  const totalPendiente = deudasPendientes.reduce((sum, deuda) => sum + parseFloat(deuda.monto || 0), 0);
  const balanceTotal = totalPagado + totalPendiente;

  const handlePagar = async (deuda) => {
    console.log('handlePagar llamado con:', deuda);
    // Abrir modal de pasarela de pagos
    setDeudaSeleccionada(deuda);
    setShowPasarela(true);
    console.log('Estados después de setear:', { deudaSeleccionada: deuda, showPasarela: true });
  };

  const handlePagoExitoso = async (resultado) => {
    console.log('[PagosSeccion] Pago exitoso:', resultado);
    
    // TODO: Tu amigo - Registrar el pago en la base de datos
    // await PagoService.registrarPagoLibelula(...)
    // await DeudaService.marcarComoPagada(...)
    
    toast.success('¡Pago realizado con éxito!');
    setShowPasarela(false);
    
    // Preparar datos para el comprobante con datos de Supabase
    setPagoComprobante({
      id_transaccion: resultado.transaccionId,
      fecha: resultado.fecha || new Date().toISOString(),
      concepto: resultado.concepto,
      monto: resultado.monto,
      metodo: resultado.metodo === 'QR' ? 'Código QR' : 'Tarjeta de Crédito/Débito',
      pagador: profile?.persona?.nombre || profile?.username || user?.username || 'Usuario',
      ci: profile?.persona?.ci || profile?.persona?.nro_ci || 'N/A',
      email: profile?.persona?.email || profile?.persona?.correo || profile?.email || user?.email || 'N/A'
    });
    
    // Recargar datos de deudas
    await cargarDatosPagos();
    
    // Mostrar comprobante
    setShowComprobante(true);
    setDeudaSeleccionada(null);
  };

  const handlePagoError = (error) => {
    console.error('[PagosSeccion] Error en pago:', error);
    toast.error('Error al procesar el pago: ' + (error.message || 'Intenta nuevamente'));
    setShowPasarela(false);
    setDeudaSeleccionada(null);
  };

  if (loading) {
    console.log('[PagosSeccion] Mostrando spinner de carga...');
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  console.log('[PagosSeccion] Renderizando contenido principal');

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Pagos</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Resumen de pagos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Financiero</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Pagado:</span>
              <span className="font-semibold text-green-600">${totalPagado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pendiente:</span>
              <span className="font-semibold text-orange-600">${totalPendiente.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-800 font-medium">Balance Total:</span>
              <span className="font-bold text-gray-800">${balanceTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximo Vencimiento</h3>
          <div className="text-center">
            {deudasPendientes.length > 0 ? (
              <>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  ${deudasPendientes[0]?.monto?.toFixed(2) || '0.00'}
                </p>
                <p className="text-gray-600 mb-2">{deudasPendientes[0]?.concepto || 'No hay deudas pendientes'}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {deudasPendientes[0]?.fecha ? `Vence: ${new Date(deudasPendientes[0].fecha).toLocaleDateString()}` : ''}
                </p>
                <button 
                  onClick={() => handlePagar(deudasPendientes[0])}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                >
                  Pagar Ahora
                </button>
              </>
            ) : (
              <p className="text-gray-500">No hay deudas pendientes</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Residente</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID Persona:</span>
              <span className="font-mono font-semibold">{user?.id_persona}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deudas Pendientes:</span>
              <span className="font-semibold">{deudasPendientes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pagos Realizados:</span>
              <span className="font-semibold">{pagos.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deudas Pendientes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Deudas Pendientes</h3>
        {deudasPendientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Concepto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha Vencimiento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudasPendientes.map((deuda, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{deuda.concepto}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{deuda.descripcion}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 font-semibold">${deuda.monto?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {deuda.fecha ? new Date(deuda.fecha).toLocaleDateString() : 'No especificada'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handlePagar(deuda)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition duration-200"
                      >
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay deudas pendientes</p>
        )}
      </div>

      {/* Historial de Pagos Realizados */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pagos Realizados</h3>
        {pagos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Concepto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Método de Pago</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Beneficiario</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{pago.concepto}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{pago.descripcion}</td>
                    <td className="py-3 px-4 text-sm text-green-600 font-semibold">${pago.monto?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 capitalize">{pago.metodo_pago}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {pago.nombre} {pago.apellido}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay pagos realizados</p>
        )}
      </div>

      {/* Deudas Pagadas (Historial) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Deudas Pagadas</h3>
        {deudasPagadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Concepto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {deudasPagadas.map((deuda, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{deuda.concepto}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{deuda.descripcion}</td>
                    <td className="py-3 px-4 text-sm text-green-600 font-semibold">${deuda.monto?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {deuda.fecha ? new Date(deuda.fecha).toLocaleDateString() : 'No especificada'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Pagado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay historial de deudas pagadas</p>
        )}
      </div>

      {/* Modal de Pasarela de Pagos */}
      {console.log('[PagosSeccion] Render condicional:', { showPasarela, deudaSeleccionada })}
      {console.log('[PagosSeccion] profile completo:', profile)}
      {console.log('[PagosSeccion] user completo:', user)}
      {console.log('[PagosSeccion] Pasando usuario a PasarelaPagos:', profile || user)}
      {console.log('[PagosSeccion] profile.persona:', profile?.persona)}
      {console.log('[PagosSeccion] Campos de profile:', profile ? Object.keys(profile) : 'null')}
      {showPasarela && deudaSeleccionada && (
        <PasarelaPagos
          isOpen={showPasarela}
          deuda={deudaSeleccionada}
          usuario={profile || user}
          onSuccess={handlePagoExitoso}
          onError={handlePagoError}
          onClose={() => {
            setShowPasarela(false);
            setDeudaSeleccionada(null);
          }}
        />
      )}

      {/* Modal de Comprobante */}
      {showComprobante && pagoComprobante && (
        <ComprobantePago
          isOpen={showComprobante}
          pago={pagoComprobante}
          onClose={() => {
            setShowComprobante(false);
            setPagoComprobante(null);
          }}
        />
      )}
    </div>
  );
};

export default PagosSeccion;