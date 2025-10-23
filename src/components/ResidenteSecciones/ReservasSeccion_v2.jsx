// src/components/ResidenteSecciones/ReservasSeccion_v2.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import reservaService from '../../services/ReservaService';
import areaComunService from '../../services/AreaComunService';
import SelectorHorarioReserva from '../shared/SelectorHorarioReserva';
import CheckoutStripe from '../shared/CheckoutStripe';
import ComprobantePago from '../shared/ComprobantePago';
import toast from 'react-hot-toast';

const ReservasSeccionV2 = () => {
  const { user, profile } = useAuth();
  
  // Estados principales
  const [areasComunes, setAreasComunes] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creandoReserva, setCreandoReserva] = useState(false);
  
  // Formulario de nueva reserva
  const [nuevaReserva, setNuevaReserva] = useState({
    id_area: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  });
  
  // Estados calculados
  const [duracionHoras, setDuracionHoras] = useState(0);
  const [costoTotal, setCostoTotal] = useState(0);
  const [configuracionArea, setConfiguracionArea] = useState(null);
  
  // Estados de pago
  const [mostrandoCheckout, setMostrandoCheckout] = useState(false);
  const [mostrandoComprobante, setMostrandoComprobante] = useState(false);
  const [datosCheckout, setDatosCheckout] = useState(null);
  const [comprobanteData, setComprobanteData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [user?.id_persona]);

  useEffect(() => {
    if (nuevaReserva.id_area) {
      cargarConfiguracionArea();
    }
  }, [nuevaReserva.id_area]);

  // Detectar retorno de Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      console.log('✅ Pago exitoso detectado, session_id:', sessionId);
      toast.success('¡Pago completado! La reserva fue creada exitosamente');
      
      // Limpiar los parámetros de la URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Recargar datos
      cargarDatos();
    } else if (paymentStatus === 'cancelled') {
      toast.error('Pago cancelado. Puedes intentar nuevamente.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar áreas comunes activas
      const resultAreas = await areaComunService.obtenerAreasActivas();
      if (resultAreas.success) {
        setAreasComunes(resultAreas.data || []);
      }

      // Cargar reservas del usuario usando la vista completa
      const resultReservas = await reservaService.obtenerReservasCompletas({
        id_persona: user.id_persona
      });
      
      if (resultReservas.success) {
        setReservas(resultReservas.data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const cargarConfiguracionArea = async () => {
    try {
      const result = await areaComunService.obtenerConfiguracionHorarios(nuevaReserva.id_area);
      if (result.success) {
        setConfiguracionArea(result.data);
      }
    } catch (error) {
      console.error('Error al cargar configuración del área:', error);
    }
  };

  const handleDuracionChange = (horas, costo) => {
    setDuracionHoras(horas);
    setCostoTotal(costo);
  };

  const handleCrearReserva = async (e) => {
    e.preventDefault();

    if (!nuevaReserva.id_area || !nuevaReserva.fecha || !nuevaReserva.hora_inicio || !nuevaReserva.hora_fin) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (costoTotal <= 0) {
      toast.error('El costo de la reserva debe ser mayor a 0');
      return;
    }

    setCreandoReserva(true);

    try {
      // 1. CREAR LA RESERVA PRIMERO (estado: Pendiente de Pago)
      const idReserva = `RSV${Date.now()}`;
      const idPago = `PAG${Date.now()}`;

      // Calcular hora_fin_con_limpieza (hora_fin + tiempo_limpieza_horas)
      const horaFinNum = parseInt(nuevaReserva.hora_fin.split(':')[0]);
      const tiempoLimpieza = configuracionArea?.tiempo_limpieza_horas || 1;
      const horaFinConLimpieza = `${(horaFinNum + tiempoLimpieza).toString().padStart(2, '0')}:00:00`;

      const reservaData = {
        id_reserva: idReserva,
        id_registro_area: nuevaReserva.id_area,
        id_persona: user?.id_persona || profile?.id_persona,
        // NO enviamos id_pago aquí - se actualizará después del pago en Stripe
        fecha_reservacion: nuevaReserva.fecha,
        fecha_creacion: new Date().toISOString().split('T')[0],
        hora_inicio: nuevaReserva.hora_inicio,
        hora_fin: nuevaReserva.hora_fin,
        hora_fin_con_limpieza: horaFinConLimpieza,
        estado: 'Pendiente' // Se cambiará a 'Confirmada' después del pago
      };

      console.log('� Creando reserva...', reservaData);
      const resultado = await reservaService.crearReservaConValidacion(reservaData);

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al crear la reserva');
      }

      toast.success('Reserva creada, redirigiendo a pago...');

      // 2. AHORA ABRIR STRIPE CON EL ID DE LA RESERVA
      const area = areasComunes.find(a => a.id_area === nuevaReserva.id_area);
      
      setDatosCheckout({
        concepto: `Reserva: ${area?.nombre}`,
        descripcion: `${duracionHoras} hora(s) - ${new Date(nuevaReserva.fecha).toLocaleDateString('es-ES')}`,
        monto: costoTotal,
        areaNombre: area?.nombre,
        id_area: nuevaReserva.id_area,
        fecha_reservacion: nuevaReserva.fecha,
        hora_inicio: nuevaReserva.hora_inicio,
        hora_fin: nuevaReserva.hora_fin,
        id_persona: user?.id_persona || profile?.id_persona,
        id_reserva: idReserva, // Pasar el ID de la reserva
        metadatos: {
          tipo: 'reserva_area_comun',
          duracion_horas: duracionHoras
        }
      });

      setMostrandoCheckout(true);
      setCreandoReserva(false);

    } catch (error) {
      console.error('❌ Error al crear reserva:', error);
      toast.error(error.message || 'Error al crear la reserva');
      setCreandoReserva(false);
    }
  };

  const handlePagoExitoso = async (resultadoPago) => {
    setCreandoReserva(true);
    
    try {
      // Generar ID único para la reserva
      const idReserva = `RSV${Date.now()}`;
      const idPago = `PAG${Date.now()}`;

      // Crear la reserva con validación automática
      const reservaData = {
        id_reserva: idReserva,
        id_registro_area: nuevaReserva.id_area,
        id_persona: user.id_persona,
        id_pago: idPago,
        fecha_reservacion: nuevaReserva.fecha,
        fecha_creacion: new Date().toISOString().split('T')[0],
        hora_inicio: nuevaReserva.hora_inicio,
        hora_fin: nuevaReserva.hora_fin,
        estado: 'Pendiente' // Admin debe aprobar
      };

      const resultado = await reservaService.crearReservaConValidacion(reservaData);

      if (resultado.success) {
        toast.success('¡Reserva creada exitosamente! Pendiente de aprobación');
        
        // Preparar comprobante
        setComprobanteData({
          id_transaccion: resultadoPago.transaccionId || idReserva,
          fecha: new Date().toISOString(),
          concepto: datosPago.concepto,
          monto: datosPago.monto,
          metodo: resultadoPago.metodo || 'Pago en línea',
          pagador: `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim() || user.email,
          ci: profile?.ci || 'N/A',
          email: user.email,
          detalles: [
            { label: 'Área', valor: areasComunes.find(a => a.id_area === nuevaReserva.id_area)?.nombre },
            { label: 'Fecha', valor: new Date(nuevaReserva.fecha).toLocaleDateString('es-ES') },
            { label: 'Horario', valor: `${nuevaReserva.hora_inicio?.slice(0,5)} - ${nuevaReserva.hora_fin?.slice(0,5)}` },
            { label: 'Duración', valor: `${duracionHoras} hora(s)` },
            { label: 'ID Reserva', valor: idReserva }
          ]
        });

        // Limpiar formulario
        setNuevaReserva({
          id_area: '',
          fecha: '',
          hora_inicio: '',
          hora_fin: ''
        });
        setDuracionHoras(0);
        setCostoTotal(0);

        // Recargar datos
        await cargarDatos();

        // Mostrar comprobante
        setMostrandoPasarela(false);
        setMostrandoComprobante(true);

      } else {
        toast.error(resultado.error || 'Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error al crear reserva:', error);
      toast.error('Error al procesar la reserva');
    } finally {
      setCreandoReserva(false);
    }
  };

  const handlePagoError = (error) => {
    console.error('Error en pago:', error);
    toast.error('Error al procesar el pago: ' + (error.message || 'Intenta nuevamente'));
    setMostrandoPasarela(false);
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Rechazada': 'bg-red-100 text-red-800',
      'Cancelada': 'bg-gray-100 text-gray-800',
      'Completada': 'bg-blue-100 text-blue-800',
      'En Uso': 'bg-purple-100 text-purple-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoEntregaBadge = (estadoEntrega) => {
    const estilos = {
      'Excelente': 'bg-green-100 text-green-800',
      'Bueno': 'bg-blue-100 text-blue-800',
      'Regular': 'bg-yellow-100 text-yellow-800',
      'Malo': 'bg-orange-100 text-orange-800',
      'Dañado': 'bg-red-100 text-red-800'
    };
    return estilos[estadoEntrega] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Cargando áreas comunes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reservas de Áreas Comunes</h2>
        <p className="text-gray-600 mt-1">Sistema de reservas con validación automática de horarios</p>
      </div>

      {/* Formulario de Nueva Reserva */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-green-100 text-green-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">+</span>
          Nueva Reserva
        </h3>

        <form onSubmit={handleCrearReserva} className="space-y-6">
          {/* Selección de Área */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Área Común *
            </label>
            <select
              value={nuevaReserva.id_area}
              onChange={(e) => setNuevaReserva(prev => ({ ...prev, id_area: e.target.value, hora_inicio: '', hora_fin: '' }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            >
              <option value="">Selecciona un área común</option>
              {areasComunes.map(area => (
                <option key={area.id_area} value={area.id_area}>
                  {area.nombre} - {area.ubicacion} (Capacidad: {area.capacidad})
                </option>
              ))}
            </select>
            {configuracionArea && (
              <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <span className="font-medium">⏰ Horario:</span> {configuracionArea.hora_apertura?.slice(0,5)} - {configuracionArea.hora_cierre?.slice(0,5)} | 
                <span className="font-medium ml-2">⚡ Mínimo:</span> {configuracionArea.minimo_horas_reserva}h | 
                <span className="font-medium ml-2">🧹 Limpieza:</span> +{configuracionArea.tiempo_limpieza_horas}h
              </div>
            )}
          </div>

          {/* Selección de Fecha */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Reserva *
            </label>
            <input
              type="date"
              value={nuevaReserva.fecha}
              onChange={(e) => setNuevaReserva(prev => ({ ...prev, fecha: e.target.value, hora_inicio: '', hora_fin: '' }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              required
            />
            {nuevaReserva.fecha && (
              <p className="text-sm text-gray-600 mt-2 capitalize">
                📅 {formatearFecha(nuevaReserva.fecha)}
              </p>
            )}
          </div>

          {/* Selector de Horarios */}
          {nuevaReserva.id_area && nuevaReserva.fecha && (
            <SelectorHorarioReserva
              idArea={nuevaReserva.id_area}
              fecha={nuevaReserva.fecha}
              horaInicio={nuevaReserva.hora_inicio}
              horaFin={nuevaReserva.hora_fin}
              onHoraInicioChange={(hora) => {
                console.log('🔄 Actualizando hora_inicio en padre:', hora);
                setNuevaReserva(prev => ({ ...prev, hora_inicio: hora }));
              }}
              onHoraFinChange={(hora) => {
                console.log('🔄 Actualizando hora_fin en padre:', hora);
                setNuevaReserva(prev => ({ ...prev, hora_fin: hora }));
              }}
              onDuracionChange={handleDuracionChange}
            />
          )}

          {/* Botón de Envío */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setNuevaReserva({ id_area: '', fecha: '', hora_inicio: '', hora_fin: '' });
                setDuracionHoras(0);
                setCostoTotal(0);
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nuevaReserva.id_area || !nuevaReserva.fecha || !nuevaReserva.hora_inicio || !nuevaReserva.hora_fin || costoTotal <= 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>💳</span>
              <span>Continuar al Pago ({duracionHoras}h - Bs. {costoTotal.toFixed(2)})</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-2">📋</span>
            Mis Reservas ({reservas.length})
          </h3>
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </button>
        </div>

        {reservas.length > 0 ? (
          <div className="space-y-4">
            {reservas.map(reserva => (
              <div key={reserva.id_reserva} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-gray-800 mb-1">
                      {reserva.nombre_area}
                    </h4>
                    <p className="text-sm text-gray-600">
                      📍 {reserva.ubicacion} • Capacidad: {reserva.capacidad} personas
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(reserva.estado)}`}>
                    {reserva.estado}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500 block">Fecha:</span>
                    <span className="font-medium">{new Date(reserva.fecha_reservacion).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Horario:</span>
                    <span className="font-medium">
                      {reserva.hora_inicio?.slice(0,5)} - {reserva.hora_fin?.slice(0,5)}
                    </span>
                  </div>
                  {reserva.hora_fin_con_limpieza && (
                    <div>
                      <span className="text-gray-500 block">Limpieza hasta:</span>
                      <span className="font-medium text-orange-600">
                        {reserva.hora_fin_con_limpieza?.slice(0,5)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block">Creada:</span>
                    <span className="font-medium">{new Date(reserva.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                {reserva.estado_entrega && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Estado de Entrega:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoEntregaBadge(reserva.estado_entrega)}`}>
                        {reserva.estado_entrega}
                      </span>
                    </div>
                    {reserva.descripcion_entrega && (
                      <p className="text-sm text-gray-600 italic">"{reserva.descripcion_entrega}"</p>
                    )}
                    {reserva.entregado_a_nombre && (
                      <p className="text-xs text-gray-500 mt-1">
                        Recibido por: {reserva.entregado_a_nombre} • {new Date(reserva.fecha_entrega).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <span>ID: {reserva.id_reserva}</span>
                  {reserva.residente_telefono && (
                    <span>📞 {reserva.residente_telefono}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-300 text-7xl mb-4">📅</div>
            <h4 className="text-xl font-medium text-gray-600 mb-2">No tienes reservas aún</h4>
            <p className="text-gray-500">Crea tu primera reserva usando el formulario superior</p>
          </div>
        )}
      </div>

      {/* Modal de Checkout Stripe */}
      {mostrandoCheckout && datosCheckout && (
        <CheckoutStripe
          isOpen={mostrandoCheckout}
          reservaData={datosCheckout}
          onSuccess={handlePagoExitoso}
          onClose={() => setMostrandoCheckout(false)}
        />
      )}

      {/* Modal de Comprobante */}
      {mostrandoComprobante && comprobanteData && (
        <ComprobantePago
          isOpen={mostrandoComprobante}
          pago={comprobanteData}
          onClose={() => setMostrandoComprobante(false)}
        />
      )}
    </div>
  );
};

export default ReservasSeccionV2;
