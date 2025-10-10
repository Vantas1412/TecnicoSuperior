// src/services/IncidenteService.js
import supabase from './dbConnection.js';

class IncidenteService {
  constructor() {
    this.supabase = supabase;
  }

  async obtenerIncidentes() {
    try {
      const { data: incidentes, error } = await this.supabase
        .from('incidente')
        .select(`
          *,
          afecta (
            id_afecta,
            persona (
              id_persona,
              nombre,
              apellido,
              telefono
            )
          ),
          ocurre (
            id_ocurre,
            area_comun (
              id_area,
              nombre
            )
          ),
          evidencia (
            id_evidencia,
            urlfoto,
            descripcion
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const incidentesProcesados = incidentes.map(incidente => ({
        ...incidente,
        personas_afectadas: incidente.afecta?.map(a => a.persona) || [],
        areas_afectadas: incidente.ocurre?.map(o => o.area_comun) || [],
        evidencias: incidente.evidencia || []
      }));

      return { success: true, data: incidentesProcesados };
    } catch (error) {
      console.error('Error al obtener incidentes:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerIncidentePorId(id_incidente) {
    try {
      const { data: incidente, error } = await this.supabase
        .from('incidente')
        .select(`
          *,
          afecta (
            id_afecta,
            persona (
              id_persona,
              nombre,
              apellido,
              telefono
            )
          ),
          ocurre (
            id_ocurre,
            area_comun (
              id_area,
              nombre
            )
          ),
          evidencia (
            id_evidencia,
            urlfoto,
            descripcion
          )
        `)
        .eq('id_incidente', id_incidente)
        .single();

      if (error) throw error;

      const incidenteProcesado = {
        ...incidente,
        personas_afectadas: incidente.afecta?.map(a => a.persona) || [],
        areas_afectadas: incidente.ocurre?.map(o => o.area_comun) || [],
        evidencias: incidente.evidencia || []
      };

      return { success: true, data: incidenteProcesado };
    } catch (error) {
      console.error('Error al obtener incidente por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async obtenerIncidentesConDepartamentos() {
    try {
      const { data: incidentes, error } = await this.supabase
        .from('incidente')
        .select(`
          *,
          afecta (
            id_afecta,
            persona (
              id_persona,
              nombre,
              apellido,
              telefono,
              departamento (
                id_departamento,
                piso,
                tipo,
                nro_cuartos
              )
            )
          ),
          ocurre (
            id_ocurre,
            area_comun (
              id_area,
              nombre
            )
          ),
          evidencia (
            id_evidencia,
            urlfoto,
            descripcion
          )
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;

      const incidentesProcesados = incidentes.map(incidente => ({
        ...incidente,
        personas_afectadas: incidente.afecta?.map(a => ({
          ...a.persona,
          departamento: a.persona?.departamento || null
        })) || [],
        areas_afectadas: incidente.ocurre?.map(o => o.area_comun) || [],
        evidencias: incidente.evidencia || []
      }));

      return { success: true, data: incidentesProcesados };
    } catch (error) {
      console.error('Error al obtener incidentes con departamentos:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async crearIncidente(incidenteData) {
    try {
      const { incidente, personasAfectadas, areasAfectadas, evidencias } = incidenteData;
      
      // Generar ID único para el incidente
      const idIncidente = `INC${Date.now()}`;
      const incidenteConId = {
        ...incidente,
        id_incidente: idIncidente
      };

      const { data: incidenteCreado, error: errorIncidente } = await this.supabase
        .from('incidente')
        .insert([incidenteConId])
        .select()
        .single();

      if (errorIncidente) throw errorIncidente;

      // Insertar múltiples personas afectadas
      if (personasAfectadas && personasAfectadas.length > 0) {
        const afectaData = personasAfectadas.map((idPersona, index) => ({
          id_afecta: `AFT${Date.now()}${index}`,
          id_incidente: idIncidente,
          id_persona: idPersona
        }));
        
        const { error: errorAfecta } = await this.supabase
          .from('afecta')
          .insert(afectaData);
        if (errorAfecta) throw errorAfecta;
      }

      // Insertar múltiples áreas afectadas
      if (areasAfectadas && areasAfectadas.length > 0) {
        const ocurreData = areasAfectadas.map((idArea, index) => ({
          id_ocurre: `OCR${Date.now()}${index}`,
          id_incidente: idIncidente,
          id_area: idArea
        }));
        
        const { error: errorOcurre } = await this.supabase
          .from('ocurre')
          .insert(ocurreData);
        if (errorOcurre) throw errorOcurre;
      }

      // Insertar evidencias (opcional)
      if (evidencias && evidencias.length > 0) {
        const evidenciasConIncidente = evidencias.map((evidencia, index) => ({
          id_evidencia: `EVD${Date.now()}${index}`,
          ...evidencia,
          id_incidente: idIncidente
        }));
        const { error: errorEvidencias } = await this.supabase
          .from('evidencia')
          .insert(evidenciasConIncidente);
        if (errorEvidencias) throw errorEvidencias;
      }

      return { success: true, data: incidenteCreado };
    } catch (error) {
      console.error('Error al crear incidente:', error);
      return { success: false, error: error.message };
    }
  }

  async editarIncidente(id_incidente, nuevosDatos) {
    try {
      const { data, error } = await this.supabase
        .from('incidente')
        .update(nuevosDatos)
        .eq('id_incidente', id_incidente)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al editar incidente:', error);
      return { success: false, error: error.message };
    }
  }

  async eliminarIncidente(id_incidente) {
    try {
      await this.supabase.from('afecta').delete().eq('id_incidente', id_incidente);
      await this.supabase.from('ocurre').delete().eq('id_incidente', id_incidente);
      await this.supabase.from('evidencia').delete().eq('id_incidente', id_incidente);

      const { data, error } = await this.supabase
        .from('incidente')
        .delete()
        .eq('id_incidente', id_incidente);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al eliminar incidente:', error);
      return { success: false, error: error.message };
    }
  }

  async agregarEvidencia(id_incidente, evidencia) {
    try {
      const evidenciaConIncidente = { 
        id_evidencia: `EVD${Date.now()}`,
        ...evidencia, 
        id_incidente 
      };
      const { data, error } = await this.supabase
        .from('evidencia')
        .insert([evidenciaConIncidente])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al agregar evidencia:', error);
      return { success: false, error: error.message };
    }
  }

  async cambiarEstadoIncidente(id_incidente, nuevoEstado) {
    try {
      const { data, error } = await this.supabase
        .from('incidente')
        .update({ estado: nuevoEstado })
        .eq('id_incidente', id_incidente)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error al cambiar estado del incidente:', error);
      return { success: false, error: error.message };
    }
  }

  async obtenerEstadisticasIncidentes() {
    try {
      const { data, error } = await this.supabase
        .from('incidente')
        .select('estado, tipo');

      if (error) throw error;

      const estadisticas = {
        total: data.length,
        porEstado: {
          'Pendiente': data.filter(i => i.estado === 'Pendiente').length,
          'En Proceso': data.filter(i => i.estado === 'En Proceso').length,
          'Resuelto': data.filter(i => i.estado === 'Resuelto').length
        },
        porTipo: {}
      };

      data.forEach(incidente => {
        estadisticas.porTipo[incidente.tipo] =
          (estadisticas.porTipo[incidente.tipo] || 0) + 1;
      });

      return { success: true, data: estadisticas };
    } catch (error) {
      console.error('Error al obtener estadísticas de incidentes:', error);
      return { success: false, error: error.message, data: null };
    }
  }
}

const incidenteService = new IncidenteService();
export default incidenteService;