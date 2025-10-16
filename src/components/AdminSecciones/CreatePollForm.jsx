import React, { useState } from 'react';
import { createPollWithOptions } from '../../services/SupabaseService';

/**
 * Formulario para que un administrador cree una nueva votación.
 * Permite especificar el título, la descripción, las fechas de inicio y fin,
 * así como las opciones de la encuesta de manera manual.  Al enviarse,
 * inserta la votación y sus opciones en la base de datos a través de
 * `createPollWithOptions`.
 */
const CreatePollForm = () => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [opciones, setOpciones] = useState(['']);
  const [mensaje, setMensaje] = useState('');

  const handleOptionChange = (index, value) => {
    const newOpciones = [...opciones];
    newOpciones[index] = value;
    setOpciones(newOpciones);
  };

  const addOption = () => {
    setOpciones([...opciones, '']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    // Validar datos básicos
    if (!titulo.trim() || !descripcion.trim() || !fechaInicio || !fechaFin) {
      setMensaje('Todos los campos son obligatorios');
      return;
    }
    // Filtrar opciones vacías
    const opcionesValidas = opciones.map((opt) => opt.trim()).filter((opt) => opt);
    if (opcionesValidas.length < 2) {
      setMensaje('Debe ingresar al menos dos opciones válidas');
      return;
    }
    try {
      const poll = {
        titulo,
        descripcion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'ACTIVA',
      };
      await createPollWithOptions(poll, opcionesValidas);
      setTitulo('');
      setDescripcion('');
      setFechaInicio('');
      setFechaFin('');
      setOpciones(['']);
      setMensaje('Votación creada con éxito');
    } catch (error) {
      console.error('Error al crear la votación:', error);
      setMensaje('Ocurrió un error al crear la votación');
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Crear nueva votación</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        ></textarea>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Fecha de fin</label>
            <input
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Opciones</label>
          {opciones.map((opt, index) => (
            <input
              key={index}
              type="text"
              className="w-full p-2 border rounded mb-2"
              placeholder={`Opción ${index + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
          ))}
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={addOption}
          >
            + Añadir opción
          </button>
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Crear votación
        </button>
        {mensaje && <p className="text-sm text-red-500 mt-2">{mensaje}</p>}
      </form>
    </div>
  );
};

export default CreatePollForm;