// src/services/notificacionesService.js
import supabase from './dbConnection.js';
// ...existing code...

class NotificacionesService {
  constructor() {
    this.supabase = supabase;
  }

  // Crear notificación para un usuario específico
  async crearNotificacionIndividual(id_usuario, titulo, mensaje, tipo_destino) {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .insert([{ 
          id_usuario, 
          titulo, 
          mensaje,
          fecha_creacion: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      // Enviar correo electrónico al destinatario
      try {
  // EmailService eliminado: aquí puedes integrar el nuevo sistema de email si es necesario
      } catch (e) {
        console.error('Error enviando correo de notificación individual:', e);
      }
      return { success: true, data, tipo_destino }; // Guardamos el tipo solo para referencia
    } catch (error) {
      console.error('Error al crear notificación individual:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear notificación para todos los residentes
  async crearNotificacionTodosResidentes(titulo, mensaje) {
    try {
      // Obtener todos los residentes desde la tabla usuario con rol 'residente'
      const { data: residentes, error: errorResidentes } = await this.supabase
        .from('usuario')
        .select('id_usuario')
        .eq('rol', 'residente')
        .eq('estado', 'activo');

      if (errorResidentes) throw errorResidentes;

      if (!residentes || residentes.length === 0) {
        return { success: true, data: [], message: 'No hay residentes activos' };
      }

      const notificaciones = residentes.map(residente => ({
        id_usuario: residente.id_usuario,
        titulo,
        mensaje,
        fecha_creacion: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('notificacion')
        .insert(notificaciones)
        .select();

      if (error) throw error;
      // Enviar correos electrónicos a todos los residentes activos
      try {
  // EmailService eliminado: aquí puedes integrar el nuevo sistema de email si es necesario
      } catch (e) {
        console.error('Error enviando correos a residentes:', e);
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear notificación para todos los residentes:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear notificación para todos los empleados
  async crearNotificacionTodosEmpleados(titulo, mensaje) {
    try {
      // Obtener todos los empleados desde la tabla usuario con rol 'empleado'
      const { data: empleados, error: errorEmpleados } = await this.supabase
        .from('usuario')
        .select('id_usuario')
        .eq('rol', 'empleado')
        .eq('estado', 'activo');

      if (errorEmpleados) throw errorEmpleados;

      if (!empleados || empleados.length === 0) {
        return { success: true, data: [], message: 'No hay empleados activos' };
      }

      const notificaciones = empleados.map(empleado => ({
        id_usuario: empleado.id_usuario,
        titulo,
        mensaje,
        fecha_creacion: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('notificacion')
        .insert(notificaciones)
        .select();

      if (error) throw error;
      // Enviar correos electrónicos a todos los empleados activos
      try {
  // EmailService eliminado: aquí puedes integrar el nuevo sistema de email si es necesario
      } catch (e) {
        console.error('Error enviando correos a empleados:', e);
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear notificación para todos los empleados:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear notificación para todos los usuarios
  async crearNotificacionGlobal(titulo, mensaje) {
    try {
      // Obtener todos los usuarios activos
      const { data: usuarios, error: errorUsuarios } = await this.supabase
        .from('usuario')
        .select('id_usuario, rol')
        .eq('estado', 'activo');

      if (errorUsuarios) throw errorUsuarios;

      if (!usuarios || usuarios.length === 0) {
        return { success: true, data: [], message: 'No hay usuarios activos' };
      }

      const notificaciones = usuarios.map(usuario => ({
        id_usuario: usuario.id_usuario,
        titulo,
        mensaje,
        fecha_creacion: new Date().toISOString()
      }));

      const { data, error } = await this.supabase
        .from('notificacion')
        .insert(notificaciones)
        .select();

      if (error) throw error;
      // Enviar correos electrónicos a todos los usuarios activos
      try {
  // EmailService eliminado: aquí puedes integrar el nuevo sistema de email si es necesario
      } catch (e) {
        console.error('Error enviando correos globales:', e);
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear notificación global:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Alias que crea una notificación individual para un usuario. Esta función
   * mantiene compatibilidad con componentes que invocan crearNotificacion con
   * (id_usuario, titulo, mensaje).
   * @param {string|number} id_usuario
   * @param {string} titulo
   * @param {string} mensaje
   */
  async crearNotificacion(id_usuario, titulo, mensaje) {
    return this.crearNotificacionIndividual(id_usuario, titulo, mensaje);
  }

  // Obtener residentes para el select
  async obtenerResidentes() {
    try {
      // Obtener usuarios residentes con información de persona
      const { data, error } = await this.supabase
        .from('usuario')
        .select(`
          id_usuario, 
          username,
          persona (
            nombre, 
            apellido, 
            telefono
          )
        `)
        .eq('rol', 'residente')
        .eq('estado', 'activo')
        .order('username');

      if (error) throw error;

      // Formatear los datos para el select
      const residentesFormateados = data.map(usuario => ({
        id_usuario: usuario.id_usuario,
        nombre: usuario.persona?.nombre || 'Sin nombre',
        apellido: usuario.persona?.apellido || '',
        telefono: usuario.persona?.telefono || '',
        username: usuario.username
      }));

      return { success: true, data: residentesFormateados };
    } catch (error) {
      console.error('Error al obtener residentes:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener empleados para el select
  async obtenerEmpleados() {
    try {
      // Primero obtener usuarios empleados
      const { data: usuarios, error: errorUsuarios } = await this.supabase
        .from('usuario')
        .select(`
          id_usuario, 
          username,
          id_persona,
          persona (
            nombre, 
            apellido, 
            telefono
          )
        `)
        .eq('rol', 'empleado')
        .eq('estado', 'activo')
        .order('username');

      if (errorUsuarios) throw errorUsuarios;

      // Obtener información de empleados usando id_persona
      const idsPersonas = usuarios.map(u => u.id_persona).filter(Boolean);
      
      const { data: empleados, error: errorEmpleados } = await this.supabase
        .from('empleado')
        .select('id_persona, tipo')
        .in('id_persona', idsPersonas);

      if (errorEmpleados) {
        console.error('Error al obtener empleados:', errorEmpleados);
      }

      // Crear un mapa de id_persona a tipo de empleado
      const empleadoMap = {};
      if (empleados) {
        empleados.forEach(emp => {
          empleadoMap[emp.id_persona] = emp.tipo;
        });
      }

      // Formatear los datos para el select
      const empleadosFormateados = usuarios.map(usuario => ({
        id_usuario: usuario.id_usuario,
        nombre: usuario.persona?.nombre || 'Sin nombre',
        apellido: usuario.persona?.apellido || '',
        telefono: usuario.persona?.telefono || '',
        username: usuario.username,
        cargo: empleadoMap[usuario.id_persona] || 'Sin cargo especificado'
      }));

      return { success: true, data: empleadosFormateados };
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      return { success: false, error: error.message };
    }
  }

  // Métodos existentes
  async editarNotificacion(id_notificacion, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .update(nuevosDatos)
        .eq('id_notificacion', id_notificacion)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar notificación:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarNotificacion(id_notificacion) {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .delete()
        .eq('id_notificacion', id_notificacion)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerNotificacionesPorUsuario(id_usuario) {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .select('*')
        .eq('id_usuario', id_usuario)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerTodasNotificaciones() {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener todas las notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  suscribirseNuevas(id_usuario, callback) {
    const channel = this.supabase
      .channel('notificaciones-' + id_usuario)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacion',
          filter: `id_usuario=eq.${id_usuario}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return channel;
  }

  /**
   * Marca una notificación como leída estableciendo la columna leido_at a la fecha actual.
   * Si el identificador no existe o se produce un error, se devuelve success=false.
   * @param {string|number} id_notificacion
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async marcarNotificacionLeida(id_notificacion) {
    try {
      const { data, error } = await this.supabase
        .from('notificacion')
        .update({ leido_at: new Date().toISOString() })
        .eq('id_notificacion', id_notificacion)
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return { success: false, error: error.message };
    }
  }
}

const notificacionesService = new NotificacionesService();
export default notificacionesService;