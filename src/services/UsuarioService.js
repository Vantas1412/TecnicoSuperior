import supabase from './dbConnection.js';

class UsuarioService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerUsuarios() {
    try {
      const { data, error } = await this.supabase.from('usuario').select('*, persona(*)').order('username');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerUsuarioPorId(id_usuario) {
    try {
      const { data, error } = await this.supabase.from('usuario').select('*, persona(*)').eq('id_usuario', id_usuario).single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearUsuario(usuario) {
    try {
      const { data, error } = await this.supabase.from('usuario').insert([usuario]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear usuario:', error);
      return { success: false, error: error.message };
    }
  }

  async editarUsuario(id_usuario, nuevosDatos) {
    try {
      const { data, error } = await this.supabase.from('usuario').update(nuevosDatos).eq('id_usuario', id_usuario);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar usuario:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarUsuario(id_usuario) {
    try {
      const { data, error } = await this.supabase.from('usuario').delete().eq('id_usuario', id_usuario);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return { success: false, error: error.message };
    }
  }
}

const usuarioService = new UsuarioService();
export default usuarioService;
