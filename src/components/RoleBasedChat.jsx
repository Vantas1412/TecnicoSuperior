import React, { useState, useEffect } from 'react';
import { fetchMessages, sendMessage } from '../services/SupabaseService';
import { useAuth } from '../hooks/useAuth';

const RoleBasedChat = () => {
  // Use the authenticated user from the context
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const getMessages = async () => {
      try {
        const data = await fetchMessages();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // Fetch messages on mount and whenever a new message is sent
    getMessages();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      // Build the chat message according to the existing database schema.  The
      // chat_mensaje table in this project defines the columns: id_mensaje
      // (auto), fecha (timestamp), usuario_id (uuid), id_residente
      // (character varying), mensaje (text), contenido (text).  To avoid
      // violations of UUID constraints, we store the sender ID in
      // `id_residente` (which accepts a character varying value).  The
      // `contenido` field will contain the message body.
      const msgObj = {
        // Algunos esquemas de la tabla chat_mensaje definen tanto `mensaje`
        // como `contenido` para el texto del chat.  Para cumplir con ambos
        // posibles campos y evitar restricciones NOT NULL, duplicamos el
        // contenido en ambas propiedades.
        mensaje: newMessage,
        contenido: newMessage,
        // No incluimos id_residente ni usuario_id para evitar violaciones
        // de claves foráneas.  El chat global no está vinculado a un
        // residente específico.
        fecha: new Date().toISOString(),
      };
      await sendMessage(msgObj);
      setNewMessage('');
      // Refresh messages list after sending
      const updatedMessages = await fetchMessages();
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Chat Comunitario</h2>
      {/* Formulario para enviar un mensaje global */}
      <form onSubmit={handleSendMessage} className="mb-4">
        <textarea
          className="w-full p-2 border rounded mb-2"
          placeholder="Escribe tu mensaje aquí..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Enviar Mensaje
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-2">Mensajes Recientes</h3>
      {messages.length > 0 ? (
        <ul>
          {messages.map((message) => (
            <li key={message.id_mensaje || message.id} className="mb-2 border-b pb-2">
              <p>{message.contenido || message.mensaje}</p>
              <small className="text-gray-500">
                De: {message.id_residente || message.usuario_id || 'Anónimo'} –{' '}
                {message.fecha ? new Date(message.fecha).toLocaleString() : ''}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay mensajes disponibles.</p>
      )}
    </div>
  );
};

export default RoleBasedChat;