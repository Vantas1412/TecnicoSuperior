// src/services/DepartamentoService.js
import supabase from './dbConnection.js';

class DepartamentoService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerDepartamentos() {
    try {
      const { data, error } = await this.supabase
        .from('departamento')
        .select('*, persona(*)')
        .order('id_departamento');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerDepartamentoPorId(id_departamento) {
    try {
      const { data, error } = await this.supabase
        .from('departamento')
        .select('*, persona(*)')
        .eq('id_departamento', id_departamento)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener departamento por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearDepartamento(departamento) {
    try {
      const { data, error } = await this.supabase
        .from('departamento')
        .insert([departamento])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear departamento:', error);
      return { success: false, error: error.message };
    }
  }

  async editarDepartamento(id_departamento, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('departamento')
        .update(nuevosDatos)
        .eq('id_departamento', id_departamento)
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar departamento:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarDepartamento(id_departamento) {
    try {
      const { data, error } = await this.supabase
        .from('departamento')
        .delete()
        .eq('id_departamento', id_departamento);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      return { success: false, error: error.message };
    }
  }
}

const departamentoService = new DepartamentoService();
export default departamentoService;