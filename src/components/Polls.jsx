import React, { useState, useEffect } from 'react';
import { fetchPollsWithOptions, submitVote } from '../services/SupabaseService';
import supabase from '../services/dbConnection.js';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    const getPolls = async () => {
      try {
        // Obtener encuestas con sus opciones asociadas
        const data = await fetchPollsWithOptions();
        // Para cada opción obtenida, consultar el número de votos en la tabla
        // votacion_respuesta.  `count` devuelve el número de registros coincidentes.
        const pollsWithCounts = await Promise.all(
          data.map(async (poll) => {
            const opcionesConConteo = await Promise.all(
              (poll.opciones || []).map(async (option) => {
                try {
                  const { count, error } = await supabase
                    .from('votacion_respuesta')
                    .select('*', { count: 'exact', head: true })
                    .eq('id_opcion', option.id_opcion);
                  if (error) {
                    console.error('Error counting votes:', error);
                  }
                  const votos = count || 0;
                  return { ...option, votos };
                } catch (err) {
                  console.error('Error counting votes:', err);
                  return { ...option, votos: 0 };
                }
              })
            );
            return { ...poll, opciones: opcionesConConteo };
          })
        );
        setPolls(pollsWithCounts);
      } catch (error) {
        console.error('Error fetching polls:', error);
      }
    };
    getPolls();
  }, []);

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedPoll || !selectedOption) return;

    try {
      const vote = {
        id_votacion: selectedPoll.id_votacion,
        id_opcion: selectedOption,
        fecha: new Date().toISOString(),
      };
      await submitVote(vote);
      alert('Voto registrado con éxito');
      setSelectedPoll(null);
      setSelectedOption('');
    } catch (error) {
      console.error('Error submitting vote:', error);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Votaciones</h2>
      {polls.length > 0 ? (
        <ul>
          {polls.map((poll) => (
            <li key={poll.id_votacion} className="mb-4 border-b pb-4">
              <h3 className="font-semibold">{poll.titulo}</h3>
              <p>{poll.descripcion}</p>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                onClick={() => setSelectedPoll(poll)}
              >
                Votar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay votaciones disponibles.</p>
      )}

      {selectedPoll && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold">{selectedPoll.titulo}</h3>
          <form onSubmit={handleVote}>
            {selectedPoll.opciones && selectedPoll.opciones.length > 0 ? (
              selectedPoll.opciones.map((option) => (
                <div key={option.id_opcion} className="mb-2">
                  <input
                    type="radio"
                    id={`option-${option.id_opcion}`}
                    name="poll-option"
                    value={option.id_opcion}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <label htmlFor={`option-${option.id_opcion}`} className="ml-2">
                    {option.texto} — {option.votos || 0} voto{option.votos === 1 ? '' : 's'}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay opciones disponibles para esta votación.</p>
            )}
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Enviar Voto
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Polls;