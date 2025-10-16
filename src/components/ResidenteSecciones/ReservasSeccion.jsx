// src/components/ResidenteSecciones/ReservasSeccion.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AreaComunService from '../../services/AreaComunService';
import ReservaService from '../../services/ReservaService';
import PagoService from '../../services/PagoService';
import RealizaService from '../../services/RealizaService';

const ReservasSeccion = () => {
  const { user } = useAuth();
  const [areasComunes, setAreasComunes] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [nuevaReserva, setNuevaReserva] = useState({
    id_area: '',
    fecha: '',
    horariosSeleccionados: []
  });

  const [mostrarFormPago, setMostrarFormPago] = useState(false);
  const [reservaPendiente, setReservaPendiente] = useState(null);
  const [datosPago, setDatosPago] = useState({
    metodo_pago: 'Transferencia',
    monto: 0,
    concepto: 'Reserva de Área Común'
  });

  // ID del administrador por defecto
  const ID_ADMIN_DEFAULT = 'CG001';

  // Horarios disponibles predefinidos con sus IDs
  const horariosDisponibles = [
    { id: 'HOR001', horario: '08:00 - 10:00', hora_inicio: '08:00', hora_fin: '10:00' },
    { id: 'HOR002', horario: '10:00 - 12:00', hora_inicio: '10:00', hora_fin: '12:00' },
    { id: 'HOR003', horario: '12:00 - 14:00', hora_inicio: '12:00', hora_fin: '14:00' },
    { id: 'HOR004', horario: '14:00 - 16:00', hora_inicio: '14:00', hora_fin: '16:00' },
    { id: 'HOR005', horario: '16:00 - 18:00', hora_inicio: '16:00', hora_fin: '18:00' },
    { id: 'HOR006', horario: '18:00 - 20:00', hora_inicio: '18:00', hora_fin: '20:00' },
    { id: 'HOR007', horario: '20:00 - 22:00', hora_inicio: '20:00', hora_fin: '22:00' }
  ];

  useEffect(() => {
    cargarDatos();
  }, [user?.id_persona]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar áreas comunes
      const resultAreas = await AreaComunService.obtenerAreasComunes();
      if (resultAreas.success) {
        setAreasComunes(resultAreas.data || []);
      } else {
        console.error('Error al cargar áreas:', resultAreas.error);
      }

      // Cargar reservas existentes del usuario con información de pago
      const { data: reservasData, error: reservasError } = await AreaComunService.supabase
        .from('reserva')
        .select(`
          *,
          pago (*)
        `)
        .eq('id_persona', user.id_persona)
        .order('fecha_reservacion', { ascending: false });

      if (reservasError) throw reservasError;
      setReservas(reservasData || []);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener horarios ocupados usando la función RPC
  const cargarHorariosOcupados = async (id_area, fecha) => {
    if (!id_area || !fecha) return;
    
    try {
      const { data, error } = await AreaComunService.supabase
        .rpc('obtener_horarios_por_area', { 
          p_id_area: id_area,
          p_fecha_reservacion: fecha
        });

      if (error) throw error;
      
      const horarios = (data || []).map(h => ({
        id_horario: h.id_horario,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        rango: `${h.hora_inicio} - ${h.hora_fin}`
      }));
      
      setHorariosOcupados(horarios);
    } catch (error) {
      console.error('Error al cargar horarios ocupados:', error);
      setHorariosOcupados([]);
    }
  };

  const handleSeleccionArea = (id_area) => {
    setNuevaReserva({
      ...nuevaReserva, 
      id_area,
      horariosSeleccionados: []
    });
    if (nuevaReserva.fecha) {
      cargarHorariosOcupados(id_area, nuevaReserva.fecha);
    }
  };

  const handleSeleccionFecha = (fecha) => {
    setNuevaReserva({
      ...nuevaReserva, 
      fecha,
      horariosSeleccionados: []
    });
    if (nuevaReserva.id_area) {
      cargarHorariosOcupados(nuevaReserva.id_area, fecha);
    }
  };

  const isHorarioOcupado = (horarioObj) => {
    return horariosOcupados.some(ocupado => 
      ocupado.id_horario === horarioObj.id
    );
  };

  const toggleHorarioSeleccionado = (horarioObj) => {
    setNuevaReserva(prev => {
      const estaSeleccionado = prev.horariosSeleccionados.some(
        h => h.id === horarioObj.id
      );
      
      if (estaSeleccionado) {
        // Remover horario si ya está seleccionado
        return {
          ...prev,
          horariosSeleccionados: prev.horariosSeleccionados.filter(
            h => h.id !== horarioObj.id
          )
        };
      } else {
        // Agregar horario si no está seleccionado
        return {
          ...prev,
          horariosSeleccionados: [...prev.horariosSeleccionados, horarioObj]
        };
      }
    });
  };

  const calcularMontoReserva = (areaId, cantidadHorarios = 1) => {
    const area = areasComunes.find(a => a.id_area === areaId);
    if (!area) return 0;
    
    // Lógica de precios basada en el tipo de área
    const precios = {
      'Salón Social': 500,
      'Gimnasio': 200,
      'Piscina': 300,
      'Terraza': 250,
      'Sala de Juegos': 150
    };
    
    const precioBase = precios[area.nombre] || 100;
    return precioBase * cantidadHorarios;
  };

  const calcularMontoTotal = () => {
    if (!nuevaReserva.id_area || nuevaReserva.horariosSeleccionados.length === 0) {
      return 0;
    }
    return calcularMontoReserva(nuevaReserva.id_area, nuevaReserva.horariosSeleccionados.length);
  };

  const handleSolicitarReserva = (e) => {
    e.preventDefault();
    
    if (!nuevaReserva.id_area || !nuevaReserva.fecha || nuevaReserva.horariosSeleccionados.length === 0) {
      setError('Por favor, selecciona un área, fecha y al menos un horario');
      return;
    }

    // Verificar si algún horario seleccionado está ocupado
    const horariosOcupadosSeleccionados = nuevaReserva.horariosSeleccionados.filter(
      horarioObj => isHorarioOcupado(horarioObj)
    );

    if (horariosOcupadosSeleccionados.length > 0) {
      setError('Algunos horarios seleccionados ya están reservados. Por favor revisa tu selección.');
      return;
    }

    // Preparar reserva pendiente y mostrar formulario de pago
    const monto = calcularMontoTotal();
    const area = areasComunes.find(a => a.id_area === nuevaReserva.id_area);
    
    setReservaPendiente({
      ...nuevaReserva,
      area_nombre: area?.nombre,
      monto
    });
    
    setDatosPago({
      ...datosPago,
      monto,
      concepto: `Reserva de ${area?.nombre} - ${nuevaReserva.horariosSeleccionados.length} horario(s)`
    });
    
    setMostrarFormPago(true);
    setError('');
  };

  const handleConfirmarPago = async () => {
    if (!reservaPendiente) return;

    setLoading(true);
    setError('');

    try {
      // 1. Crear ID único para el pago
      const idPago = `PAG${Date.now()}`;
      const timestamp = Date.now();
      
      // 2. Crear el pago
      const pagoData = {
        id_pago: idPago,
        fecha: new Date().toISOString().split('T')[0],
        monto: datosPago.monto,
        metodo_pago: datosPago.metodo_pago,
        concepto: datosPago.concepto,
        descripcion: `Reserva de área común - ${reservaPendiente.horariosSeleccionados.length} horario(s)`
      };

      console.log('Creando pago:', pagoData);
      const resultadoPago = await PagoService.crearPago(pagoData);
      
      if (!resultadoPago.success) {
        throw new Error(resultadoPago.error?.message || 'Error al crear el pago');
      }

      // 3. Crear relación en la tabla REALIZA
      const realizaData = {
        id_pagador: user.id_persona, // Usuario que paga
        id_pago: idPago,
        id_beneficiario: ID_ADMIN_DEFAULT // Admin que recibe el pago
      };

      console.log('Creando relación realiza:', realizaData);
      const resultadoRealiza = await RealizaService.crearRealiza(realizaData);
      
      if (!resultadoRealiza.success) {
        throw new Error(resultadoRealiza.error?.message || 'Error al crear la relación de pago');
      }

      // 4. Crear múltiples reservas (una por cada horario seleccionado)
      const reservasData = reservaPendiente.horariosSeleccionados.map((horarioObj, index) => ({
        id_reserva: `RES${timestamp}${index}`,
        id_registro_area: reservaPendiente.id_area,
        id_persona: user.id_persona,
        id_pago: idPago,
        id_horario: horarioObj.id,
        fecha_reservacion: reservaPendiente.fecha,
        hora: horarioObj.horario,
        fecha_creacion: new Date().toISOString().split('T')[0]
      }));

      console.log('Creando reservas:', reservasData);
      
      // Insertar todas las reservas en una sola operación
      const { data: reservasCreadas, error: errorReservas } = await AreaComunService.supabase
        .from('reserva')
        .insert(reservasData)
        .select();

      if (errorReservas) throw errorReservas;

      setSuccess(`¡${reservaPendiente.horariosSeleccionados.length} reserva(s) creada(s) exitosamente!`);
      setMostrarFormPago(false);
      setReservaPendiente(null);
      setNuevaReserva({
        id_area: '',
        fecha: '',
        horariosSeleccionados: []
      });
      setHorariosOcupados([]);
      
      // Recargar datos
      await cargarDatos();

    } catch (error) {
      console.error('Error detallado al procesar reservas:', error);
      setError(error.message || 'Error al procesar las reservas. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Confirmada': return 'bg-green-100 text-green-800';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para formatear fecha en español
  const formatearFecha = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && reservas.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Reservas de Áreas Comunes</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Formulario para nueva reserva */}
      {!mostrarFormPago ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Reserva</h3>
          <form onSubmit={handleSolicitarReserva} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Área Común</label>
              <select
                value={nuevaReserva.id_area}
                onChange={(e) => handleSeleccionArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar área</option>
                {areasComunes.map(area => (
                  <option key={area.id_area} value={area.id_area}>
                    {area.nombre} - ${calcularMontoReserva(area.id_area)}/horario
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Reserva</label>
              <input
                type="date"
                value={nuevaReserva.fecha}
                onChange={(e) => handleSeleccionFecha(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              {nuevaReserva.fecha && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatearFecha(nuevaReserva.fecha)}
                </p>
              )}
            </div>
            
            {nuevaReserva.id_area && nuevaReserva.fecha && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horarios Disponibles para {formatearFecha(nuevaReserva.fecha)}
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (Selecciona múltiples horarios)
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {horariosDisponibles.map(horarioObj => {
                    const ocupado = isHorarioOcupado(horarioObj);
                    const estaSeleccionado = nuevaReserva.horariosSeleccionados.some(
                      h => h.id === horarioObj.id
                    );
                    
                    return (
                      <button
                        key={horarioObj.id}
                        type="button"
                        onClick={() => !ocupado && toggleHorarioSeleccionado(horarioObj)}
                        disabled={ocupado}
                        className={`p-3 rounded-lg border text-sm font-medium transition duration-200 ${
                          estaSeleccionado
                            ? 'bg-green-500 text-white border-green-500'
                            : ocupado
                            ? 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {horarioObj.horario}
                        {ocupado && <span className="text-xs block mt-1">⛔ Ocupado</span>}
                        {estaSeleccionado && !ocupado && <span className="text-xs block mt-1">✓ Seleccionado</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
                    <span>Horario ocupado</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-1"></div>
                    <span>Horario disponible</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                    <span>Seleccionado</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {nuevaReserva.horariosSeleccionados.length} horario(s) seleccionado(s) | 
                  Mostrando {horariosOcupados.length} horarios ocupados de {horariosDisponibles.length} disponibles
                </p>
              </div>
            )}
            
            {nuevaReserva.id_area && nuevaReserva.fecha && nuevaReserva.horariosSeleccionados.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Resumen de Reserva</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Área:</strong> {areasComunes.find(a => a.id_area === nuevaReserva.id_area)?.nombre}</p>
                  <p><strong>Fecha:</strong> {formatearFecha(nuevaReserva.fecha)}</p>
                  <p><strong>Horarios Seleccionados:</strong></p>
                  <ul className="list-disc list-inside ml-2">
                    {nuevaReserva.horariosSeleccionados.map((horarioObj, index) => (
                      <li key={horarioObj.id}>{horarioObj.horario}</li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <p><strong>Cantidad de horarios:</strong> {nuevaReserva.horariosSeleccionados.length}</p>
                    <p><strong>Costo por horario:</strong> ${calcularMontoReserva(nuevaReserva.id_area)}</p>
                    <p><strong>Costo total:</strong> ${calcularMontoTotal()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={!nuevaReserva.id_area || !nuevaReserva.fecha || nuevaReserva.horariosSeleccionados.length === 0}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {nuevaReserva.horariosSeleccionados.length > 0 
                ? `Continuar al Pago (${nuevaReserva.horariosSeleccionados.length} horario(s) - $${calcularMontoTotal()})`
                : 'Continuar al Pago'
              }
            </button>
          </form>
        </div>
      ) : (
        /* Formulario de Pago */
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Pago y Reserva</h3>
          
          {reservaPendiente && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Detalles de la Reserva</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Área:</strong> {reservaPendiente.area_nombre}</div>
                <div><strong>Fecha:</strong> {formatearFecha(reservaPendiente.fecha)}</div>
                <div><strong>Cantidad de horarios:</strong> {reservaPendiente.horariosSeleccionados.length}</div>
                <div><strong>Costo total:</strong> ${reservaPendiente.monto}</div>
                <div className="col-span-2">
                  <strong>Horarios:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1">
                    {reservaPendiente.horariosSeleccionados.map((horarioObj, index) => (
                      <li key={horarioObj.id}>{horarioObj.horario}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                value={datosPago.metodo_pago}
                onChange={(e) => setDatosPago({...datosPago, metodo_pago: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Información de Pago</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Beneficiario:</strong> Administración del Condominio (Admin: CG001)</p>
                <p><strong>Monto a pagar:</strong> ${datosPago.monto}</p>
                <p><strong>Concepto:</strong> {datosPago.concepto}</p>
                {datosPago.metodo_pago === 'Transferencia' && (
                  <p><strong>Cuenta:</strong> XXXX-XXXX-XXXX-XXXX (Banco Nacional)</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setMostrarFormPago(false)}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPago}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400"
              >
                {loading ? 'Procesando...' : `Confirmar y Pagar $${datosPago.monto}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reservas existentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Mis Reservas</h3>
          <button
            onClick={cargarDatos}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200 text-sm"
          >
            Actualizar
          </button>
        </div>

        {reservas.length > 0 ? (
          <div className="space-y-4">
            {reservas.map(reserva => (
              <div key={reserva.id_reserva} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {areasComunes.find(a => a.id_area === reserva.id_registro_area)?.nombre || 'Área común'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatearFecha(reserva.fecha_reservacion)} - {reserva.hora}
                    </p>
                    {reserva.pago && (
                      <p className="text-sm text-green-600">
                        Pagado: ${reserva.pago.monto} ({reserva.pago.metodo_pago})
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                    {reserva.estado || 'Confirmada'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  ID Reserva: {reserva.id_reserva} | ID Pago: {reserva.id_pago}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500 text-lg mb-2">No hay reservas realizadas</p>
            <p className="text-gray-400 text-sm">Crea tu primera reserva usando el formulario superior</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservasSeccion;