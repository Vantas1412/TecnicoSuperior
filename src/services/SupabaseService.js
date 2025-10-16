// Import the shared Supabase client from dbConnection. This file runs in the browser context,
// where `process` is undefined. The dbConnection file uses `import.meta.env` to access Vite env vars.
import supabase from './dbConnection.js';

// Note: Previously this file attempted to read `process.env.VITE_SUPABASE_URL` and
// `process.env.VITE_SUPABASE_KEY`. However, in a Vite browser build the `process`
// object is not defined, causing a ReferenceError. By reusing the supabase client
// created in `dbConnection.js` we avoid that issue and ensure the same
// environment variables are used throughout the project.
// The import of `createClient` from '@supabase/supabase-js' is no longer necessary and has been removed.

// Service for Announcements
export const fetchAnnouncements = async () => {
  const { data, error } = await supabase.from('aviso').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return data;
};

// Crea un nuevo aviso (anuncio) en la tabla `aviso`.
// Recibe un objeto con las propiedades: titulo, contenido y opcionalmente id_emisor.
// La fecha de publicación se establece automáticamente.
export const createAnnouncement = async ({ titulo, contenido, id_emisor }) => {
  // La tabla `aviso` define un campo obligatorio `mensaje`. Para mantener compatibilidad con
  // el esquema existente en la base de datos, copiamos el contenido tanto en `contenido`
  // como en `mensaje`. Además establecemos la fecha de publicación.
  const nowISO = new Date().toISOString();
  const newAnnouncement = {
    titulo,
    contenido,
    mensaje: contenido,
    id_emisor: id_emisor || null,
    fecha: nowISO,
  };
  // Insertar el aviso sin solicitar la fila devuelta. Pedir la fila devuelta con
  // `.select()` puede provocar errores 409 en el esquema actual de Supabase.
  const { error } = await supabase.from('aviso').insert([newAnnouncement]);
  if (error) throw error;
  return newAnnouncement;
};

// Recupera una lista de identificadores de avisos vistos por un usuario concreto. Devuelve
// un arreglo de objetos con { id_aviso, id_usuario, visto_at } para el usuario indicado.
export const fetchViewedAnnouncements = async (id_usuario) => {
  if (!id_usuario) return [];
  const { data, error } = await supabase
    .from('aviso_visto')
    .select('id_aviso')
    .eq('id_usuario', id_usuario);
  if (error) throw error;
  return data || [];
};

// Recupera las quejas de un usuario específico. Útil para que un residente vea sólo sus quejas.
export const fetchComplaintsByUser = async (id_usuario) => {
  if (!id_usuario) return [];
  const { data, error } = await supabase
    .from('buzon_quejas')
    .select('*')
    .eq('usuario_id', id_usuario)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data;
};

// Service for Complaints
export const submitComplaint = async (complaint) => {
  const { data, error } = await supabase.from('buzon_quejas').insert([complaint]);
  if (error) throw error;
  return data;
};

// Marca un aviso como visto por un usuario específico. Inserta un registro en la tabla aviso_visto
export const markAnnouncementAsViewed = async (id_aviso, id_usuario) => {
  const { data, error } = await supabase
    .from('aviso_visto')
    .insert([{ id_aviso, id_usuario, visto_at: new Date().toISOString() }]);
  if (error) throw error;
  return data;
};

// Permite que un administrador responda a una queja. Actualiza los campos de respuesta y marca la fecha
// Permite que un administrador responda a una queja. Actualiza la respuesta
// y marca la fecha de respuesta.  No establece `respondido_por` porque el
// esquema de la base de datos usa un tipo UUID para esa columna, y los
// identificadores de usuarios en este proyecto son de tipo character varying
// (ejemplo: "USR001").  Incluir un valor no UUID provoca errores de tipo.
export const respondComplaint = async (id_queja, respuesta_admin) => {
  const { error } = await supabase
    .from('buzon_quejas')
    .update({
      respuesta_admin,
      respondido_at: new Date().toISOString(),
    })
    .eq('id_queja', id_queja);
  if (error) throw error;
  return true;
};

// Crea una nueva votación junto con sus opciones.  Recibe un objeto
// `poll` con las propiedades titulo, descripcion, fecha_inicio y
// fecha_fin.  `opciones` es un arreglo de cadenas con los textos de cada
// opción.  Inserta primero la votación y luego cada opción en
// `votacion_opcion`.
export const createPollWithOptions = async (poll, opciones) => {
  // Insertar la votación
  const { data: pollData, error: pollError } = await supabase
    .from('votacion')
    .insert([poll])
    .select();
  if (pollError) throw pollError;
  const insertedPoll = Array.isArray(pollData) ? pollData[0] : pollData;
  // Preparar las opciones con el id de la votación
  const opcionesToInsert = opciones.map((texto) => ({
    id_votacion: insertedPoll.id_votacion,
    texto,
  }));
  const { error: opcionesError } = await supabase
    .from('votacion_opcion')
    .insert(opcionesToInsert);
  if (opcionesError) throw opcionesError;
  return insertedPoll;
};

// Obtiene todas las encuestas con sus opciones. Las opciones se extraen de votacion_opcion
export const fetchPollsWithOptions = async () => {
  const { data, error } = await supabase
    .from('votacion')
    .select(`
      *,
      opciones:votacion_opcion(id_opcion,texto)
    `)
    .order('fecha_inicio', { ascending: false });
  if (error) throw error;
  return data;
};

export const fetchComplaints = async () => {
  const { data, error } = await supabase.from('buzon_quejas').select('*').order('fecha', { ascending: false });
  if (error) throw error;
  return data;
};

// Service for Notifications
export const fetchNotifications = async () => {
  const { data, error } = await supabase.from('notificacion').select('*').order('fecha_creacion', { ascending: false });
  if (error) throw error;
  return data;
};

// Service for Polls
export const fetchPolls = async () => {
  const { data, error } = await supabase.from('votacion').select('*').order('fecha_inicio', { ascending: false });
  if (error) throw error;
  return data;
};

export const submitVote = async (vote) => {
  const { data, error } = await supabase.from('votacion_respuesta').insert([vote]);
  if (error) throw error;
  return data;
};

// Service for Community Chat
export const fetchMessages = async () => {
  const { data, error } = await supabase.from('chat_mensaje').select('*').order('fecha', { ascending: true });
  if (error) throw error;
  return data;
};

export const sendMessage = async (message) => {
  const { data, error } = await supabase.from('chat_mensaje').insert([message]);
  if (error) throw error;
  return data;
};

export default supabase;