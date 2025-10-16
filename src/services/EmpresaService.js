// src/services/EmpresaService.js
// Servicio para obtener información sobre las empresas que prestan servicios de mantenimiento.
// Este servicio asume que existe una tabla `empresa` con los datos de cada empresa y
// una tabla intermedia `empresa_servicio` que relaciona empresas con los servicios
// ofrecidos.  La estructura mínima esperada es:
//   - empresa (id_empresa [char/varchar], nombre [text], ...)
//   - empresa_servicio (id_empresa [char/varchar], id_servicio [char/varchar])
// Si estas tablas no existen en tu base de datos Supabase, deberás crearlas
// utilizando el script SQL proporcionado en las instrucciones.  Este servicio
// permite obtener la empresa asociada a un servicio concreto y la lista de
// empresas en general.

import supabase from './dbConnection.js';

class EmpresaService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Obtiene la empresa asociada a un servicio concreto.
   * Devuelve un objeto con la forma { id_empresa, nombre } si existe,
   * o success: false si no se encuentra ninguna asociación.
   *
   * @param {string} id_servicio - El identificador del servicio.
   */
  async obtenerEmpresaPorServicio(id_servicio) {
    try {
      const { data, error } = await this.supabase
        .from('empresa_servicio')
        .select('empresa:empresa ( id_empresa, nombre )')
        .eq('id_servicio', id_servicio)
        .single();
      if (error) throw error;
      if (data && data.empresa) {
        return { success: true, data: data.empresa };
      }
      return { success: false, error: 'No se encontró empresa para el servicio' };
    } catch (err) {
      console.error('Error al obtener empresa por servicio:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Obtiene todas las empresas registradas en la tabla `empresa`.
   */
  async obtenerEmpresas() {
    try {
      const { data, error } = await this.supabase.from('empresa').select('*');
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error al obtener empresas:', err);
      return { success: false, error: err.message };
    }
  }
}

const empresaService = new EmpresaService();
export default empresaService;