// src/components/shared/SelectorHorarioReserva.jsx
import React, { useState, useEffect } from 'react';
import areaComunService from '../../services/AreaComunService';

const SelectorHorarioReserva = ({ 
  idArea, 
  fecha, 
  horaInicio, 
  horaFin, 
  onHoraInicioChange, 
  onHoraFinChange,
  onDuracionChange 
}) => {
  console.log('🎯 Props recibidas:', { idArea, fecha, horaInicio, horaFin });
  
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (idArea && fecha) {
      cargarHorariosDisponibles();
    }
  }, [idArea, fecha]);

  const cargarHorariosDisponibles = async () => {
    setCargando(true);
    try {
      const resultado = await areaComunService.generarHorariosDisponibles(idArea, fecha);
      console.log('📅 Horarios disponibles recibidos:', resultado);
      if (resultado.success) {
        setHorariosDisponibles(resultado.data);
        console.log('✅ Horarios disponibles seteados:', resultado.data);
      }

      const config = await areaComunService.obtenerConfiguracionHorarios(idArea);
      console.log('⚙️ Configuración recibida:', config);
      if (config.success) {
        setConfiguracion(config.data);
        console.log('✅ Configuración seteada:', config.data);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setCargando(false);
    }
  };

  // Generar opciones de hora de fin basadas en la hora de inicio
  const generarOpcionesHoraFin = () => {
    if (!horaInicio || !configuracion) return [];

    const horaInicioNum = parseInt(horaInicio.split(':')[0]);
    const horaCierreNum = parseInt(configuracion.hora_cierre.split(':')[0]);
    const minimoHoras = configuracion.minimo_horas_reserva || 1;
    const tiempoLimpieza = configuracion.tiempo_limpieza_horas || 1;

    const opciones = [];
    for (let hora = horaInicioNum + minimoHoras; hora <= horaCierreNum; hora++) {
      const horaStr = `${hora.toString().padStart(2, '0')}:00:00`;
      const horaConLimpiezaNum = hora + tiempoLimpieza;
      const horaConLimpiezaStr = `${horaConLimpiezaNum.toString().padStart(2, '0')}:00:00`;
      
      // Verificar si hay conflicto con reservas existentes
      // La hora_fin + limpieza NO debe chocar con ninguna reserva
      const tieneConflicto = horariosDisponibles.some(horario => {
        const horarioNum = parseInt(horario.hora.split(':')[0]);
        // Si el horario está ocupado Y está dentro del rango [hora_fin, hora_fin + limpieza)
        return !horario.disponible && horarioNum >= hora && horarioNum < horaConLimpiezaNum;
      });
      
      // También verificar que no exceda el horario de cierre con la limpieza
      const excedeCierre = horaConLimpiezaNum > horaCierreNum;
      
      opciones.push({
        value: horaStr,
        label: `${hora.toString().padStart(2, '0')}:00`,
        duracion: hora - horaInicioNum,
        disponible: !tieneConflicto && !excedeCierre,
        razon: tieneConflicto ? 'Sin tiempo para limpieza' : excedeCierre ? 'Excede horario de cierre' : null
      });
    }
    return opciones;
  };

  const calcularCosto = () => {
    if (!horaInicio || !horaFin || !configuracion) return 0;

    const horaInicioNum = parseInt(horaInicio.split(':')[0]);
    const horaFinNum = parseInt(horaFin.split(':')[0]);
    const horas = horaFinNum - horaInicioNum;

    return horas * (configuracion.costo_hora || 0);
  };

  useEffect(() => {
    if (horaInicio && horaFin && onDuracionChange) {
      const horaInicioNum = parseInt(horaInicio.split(':')[0]);
      const horaFinNum = parseInt(horaFin.split(':')[0]);
      const duracion = horaFinNum - horaInicioNum;
      onDuracionChange(duracion, calcularCosto());
    }
  }, [horaInicio, horaFin]);

  if (cargando) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-2">Cargando horarios disponibles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {configuracion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-blue-900">Información del área:</p>
          <ul className="mt-2 space-y-1 text-blue-800">
            <li>• Horario: {configuracion.hora_apertura?.slice(0, 5)} - {configuracion.hora_cierre?.slice(0, 5)}</li>
            <li>• Reserva mínima: {configuracion.minimo_horas_reserva} hora(s)</li>
            <li>• Costo por hora: Bs. {configuracion.costo_hora?.toFixed(2)}</li>
            <li>• Tiempo de limpieza: {configuracion.tiempo_limpieza_horas} hora(s) (bloqueada automáticamente)</li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hora de Inicio *
          </label>
          <select
            value={horaInicio}
            onChange={(e) => {
              console.log('🕐 Hora inicio seleccionada:', e.target.value);
              onHoraInicioChange(e.target.value);
              onHoraFinChange(''); // Resetear hora fin
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar hora</option>
            {horariosDisponibles.map((horario) => (
              <option 
                key={horario.hora} 
                value={horario.hora}
                disabled={!horario.disponible}
              >
                {horario.hora.slice(0, 5)} 
                {!horario.disponible && ` (${horario.razon || 'Ocupado'})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hora de Fin *
          </label>
          <select
            value={horaFin}
            onChange={(e) => onHoraFinChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!horaInicio}
            required
          >
            <option value="">Seleccionar hora</option>
            {generarOpcionesHoraFin().map((opcion) => (
              <option 
                key={opcion.value} 
                value={opcion.value}
                disabled={!opcion.disponible}
              >
                {opcion.label} ({opcion.duracion} hora{opcion.duracion > 1 ? 's' : ''})
                {!opcion.disponible && ` - ${opcion.razon}`}
              </option>
            ))}
          </select>
          {!horaInicio && (
            <p className="text-xs text-gray-500 mt-1">Primero selecciona hora de inicio</p>
          )}
        </div>
      </div>

      {horaInicio && horaFin && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Duración total:</p>
              <p className="text-lg font-bold text-gray-800">
                {parseInt(horaFin.split(':')[0]) - parseInt(horaInicio.split(':')[0])} hora(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Costo total:</p>
              <p className="text-2xl font-bold text-green-600">
                Bs. {calcularCosto().toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * El área se bloqueará automáticamente {configuracion?.tiempo_limpieza_horas} hora(s) 
            adicional(es) después de tu reserva para limpieza.
          </p>
        </div>
      )}

      {horariosDisponibles.length === 0 && !cargando && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">
            No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectorHorarioReserva;
