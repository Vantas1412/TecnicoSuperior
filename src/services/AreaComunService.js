// src/services/AreaComunService.js
import supabase from './dbConnection.js';

class AreaComunService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerAreasComunes() {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener áreas comunes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerAreaPorId(id_area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .select('*')
        .eq('id_area', id_area)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener área común por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearAreaComun(area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .insert([area])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear área común:', error);
      return { success: false, error: error.message };
    }
  }

  async editarAreaComun(id_area, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .update(nuevosDatos)
        .eq('id_area', id_area)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar área común:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarAreaComun(id_area) {
    try {
      const { data, error } = await this.supabase
        .from('area_comun')
        .delete()
        .eq('id_area', id_area);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar área común:', error);
      return { success: false, error: error.message };
    }
  }
}

const areaComunService = new AreaComunService();
export default areaComunService;