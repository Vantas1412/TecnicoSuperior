// src/services/PersonaService.js
import supabase from './dbConnection.js';

class PersonaService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerPersonas() {
    try {
      const { data, error } = await this.supabase
        .from('persona')
        .select(`
          *,
          departamento (
            id_departamento,
            piso,
            tipo,
            nro_cuartos
          )
        `)
        .order('nombre');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener personas:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerPersonaPorId(id_persona) {
    try {
      const { data, error } = await this.supabase
        .from('persona')
        .select(`
          *,
          departamento (
            id_departamento,
            piso,
            tipo,
            nro_cuartos
          )
        `)
        .eq('id_persona', id_persona)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener persona por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async crearPersona(persona) {
    try {
      const { data, error } = await this.supabase
        .from('persona')
        .insert([persona])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al crear persona:', error);
      return { success: false, error: error.message };
    }
  }

  async editarPersona(id_persona, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('persona')
        .update(nuevosDatos)
        .eq('id_persona', id_persona)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar persona:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarPersona(id_persona) {
    try {
      const { data, error } = await this.supabase
        .from('persona')
        .delete()
        .eq('id_persona', id_persona);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar persona:', error);
      return { success: false, error: error.message };
    }
  }
// En src/services/PersonaService.js
async obtenerPersonasNoResidentes() {
  try {
    // Primero obtenemos los IDs de personas que ya son residentes
    const { data: residentes, error: errorResidentes } = await this.supabase
      .from('residente')
      .select('id_persona');
    
    if (errorResidentes) throw errorResidentes;

    // Extraemos solo los IDs
    const idsResidentes = residentes.map(r => r.id_persona);
    
    // Si no hay residentes, devolvemos todas las personas
    if (idsResidentes.length === 0) {
      const { data: todasPersonas, error: errorPersonas } = await this.supabase
        .from('persona')
        .select('*');
      
      if (errorPersonas) throw errorPersonas;
      return { success: true, data: todasPersonas };
    }

    // Obtenemos personas que NO están en la lista de residentes
    const { data: personasNoResidentes, error: errorNoResidentes } = await this.supabase
      .from('persona')
      .select('*')
      .not('id_persona', 'in', `(${idsResidentes.map(id => `'${id}'`).join(',')})`);
    
    if (errorNoResidentes) throw errorNoResidentes;
    
    return { success: true, data: personasNoResidentes };
  } catch (error) {
    console.error('Error al obtener personas no residentes:', error);
    return { success: false, error: error.message, data: [] };
  }
}  

// En src/services/PersonaService.js - Añadir estas funciones al final de la clase

async obtenerPagosPorPagador(id_pagador) {
  try {
    // Ejecutar la función de PostgreSQL que creaste
    const { data, error } = await this.supabase
      .rpc('obtener_pagos_por_pagador', { 
        p_id_pagador: id_pagador 
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener pagos por pagador:', error);
    return { success: false, error: error.message, data: [] };
  }
}

async obtenerDeudasPorEstado(id_persona, estado) {
  try {
    // Ejecutar la función de PostgreSQL que creaste
    const { data, error } = await this.supabase
      .rpc('obtener_deudas_por_estado', { 
        p_id_persona: id_persona,
        p_estado: estado
      });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener deudas por estado:', error);
    return { success: false, error: error.message, data: [] };
  }
}
}

const personaService = new PersonaService();
export default personaService;