import supabase from './dbConnection.js';

class AdminService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerAdmins() {
    try {
      const { data, error } = await this.supabase.from('admin').select('*, persona(*)').order('id_admin');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener admins:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerAdminPorId(id_admin) {
    try {
      const { data, error } = await this.supabase.from('admin').select('*, persona(*)').eq('id_admin', id_admin).single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener admin por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearAdmin(admin) {
    try {
      const { data, error } = await this.supabase.from('admin').insert([admin]);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear admin:', error);
      return { success: false, error: error.message };
    }
  }

  async editarAdmin(id_admin, nuevosDatos) {
    try {
      const { data, error } = await this.supabase.from('admin').update(nuevosDatos).eq('id_admin', id_admin);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar admin:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarAdmin(id_admin) {
    try {
      const { data, error } = await this.supabase.from('admin').delete().eq('id_admin', id_admin);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar admin:', error);
      return { success: false, error: error.message };
    }
  }
}

const adminService = new AdminService();
export default adminService;
