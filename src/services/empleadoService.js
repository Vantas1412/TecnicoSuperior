// src/services/empleadoService.js
import supabase from './dbConnection.js';

class EmpleadoService {
  constructor() {
    this.supabase = supabase;
  }

  // ✅ Obtener todos los empleados con su persona
  async obtenerEmpleados() {
    try {
      const { data, error } = await this.supabase
        .from('empleado')
        .select(`
          id_empleado,
          id_persona,
          tipo,
          sueldo,
          fecha_contratacion,
          tipo_de_contrato,
          persona (
            id_persona,
            nombre,
            apellido,
            telefono
          )
        `)
        .order('id_empleado');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ✅ Obtener personas que aún no son empleados
  async obtenerPersonasDisponibles() {
    try {
      const { data: empleadosData, error: empleadosError } = await this.supabase
        .from('empleado')
        .select('id_persona');

      if (empleadosError) throw empleadosError;

      const idsEmpleados = empleadosData.map(emp => emp.id_persona);

      let query = this.supabase.from('persona').select('*').order('nombre');

      if (idsEmpleados.length > 0) {
        query = query.not('id_persona', 'in', `(${idsEmpleados.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener personas disponibles:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // ✅ Obtener empleado por ID
  async obtenerEmpleadoPorId(id_empleado) {
    try {
      const { data, error } = await this.supabase
        .from('empleado')
        .select(`
          id_empleado,
          id_persona,
          tipo,
          sueldo,
          fecha_contratacion,
          tipo_de_contrato,
          persona (
            id_persona,
            nombre,
            apellido,
            telefono
          )
        `)
        .eq('id_empleado', id_empleado)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener empleado por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  // ✅ Crear nuevo empleado
  async crearEmpleado(empleadoData) {
    try {
      // Validar que la persona no sea ya un empleado
      const { data: empleadoExistente, error: errorCheck } = await this.supabase
        .from('empleado')
        .select('id_empleado')
        .eq('id_persona', empleadoData.id_persona)
        .maybeSingle();

      if (errorCheck) throw errorCheck;

      if (empleadoExistente) {
        throw new Error('Esta persona ya es un empleado');
      }

      const { data, error } = await this.supabase
        .from('empleado')
        .insert([
          {
            id_persona: empleadoData.id_persona,
            tipo: empleadoData.cargo,
            sueldo: empleadoData.salario,
            fecha_contratacion: empleadoData.fecha_contrato || new Date().toISOString().split('T')[0],
            tipo_de_contrato: empleadoData.tipo_de_contrato || 'Indefinido',
            // 🚫 No incluimos nro_cuenta ni urlcontrato ya que pueden ser null
          },
        ])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear empleado:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Editar empleado
  async editarEmpleado(id_empleado, nuevosDatos) {
    try {
      const datosActualizar = {};

      if (nuevosDatos.cargo !== undefined) datosActualizar.tipo = nuevosDatos.cargo;
      if (nuevosDatos.salario !== undefined) datosActualizar.sueldo = nuevosDatos.salario;
      if (nuevosDatos.fecha_contrato !== undefined) datosActualizar.fecha_contratacion = nuevosDatos.fecha_contrato;
      if (nuevosDatos.tipo_de_contrato !== undefined) datosActualizar.tipo_de_contrato = nuevosDatos.tipo_de_contrato;

      const { data, error } = await this.supabase
        .from('empleado')
        .update(datosActualizar)
        .eq('id_empleado', id_empleado)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar empleado:', error);
      return { success: false, error: error.message };
    }
  }

  // ✅ Eliminar empleado
  async eliminarEmpleado(id_empleado) {
    try {
      const { data, error } = await this.supabase
        .from('empleado')
        .delete()
        .eq('id_empleado', id_empleado);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      return { success: false, error: error.message };
    }
  }
}

const empleadoService = new EmpleadoService();
export default empleadoService;
