// src/services/EvidenciaService.js
import supabase from './dbConnection.js';

class EvidenciaService {
  constructor() {
    this.supabase = supabase;
  }

  async crearEvidencia(evidenciaData) {
    try {
      console.log('Datos recibidos para evidencia:', evidenciaData);
      
      // Validar que tenemos el ID del empleado
      if (!evidenciaData.id_empleado) {
        throw new Error('ID de empleado no proporcionado');
      }

      // Generar ID único para la evidencia
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const nuevoIdEvidencia = `EVI${timestamp}${random}`.substring(0, 15);

      console.log('ID generado:', nuevoIdEvidencia);

      let urlsArchivos = [];

      // Solo subir archivos si existen
      if (evidenciaData.archivos && evidenciaData.archivos.length > 0) {
        console.log('Subiendo archivos...');
        
        for (const archivo of evidenciaData.archivos) {
          try {
            const fileExt = archivo.name.split('.').pop();
            const fileName = `${nuevoIdEvidencia}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `evidencias/${fileName}`;

            console.log('Subiendo archivo:', filePath);

            const { data: uploadData, error: uploadError } = await this.supabase.storage
              .from('evidencias')
              .upload(filePath, archivo);

            if (uploadError) {
              console.error('Error subiendo archivo:', uploadError);
              throw uploadError;
            }

            // Obtener URL pública del archivo
            const { data: urlData } = this.supabase.storage
              .from('evidencias')
              .getPublicUrl(filePath);

            console.log('URL obtenida:', urlData);

            urlsArchivos.push({
              nombre: archivo.name,
              url: urlData.publicUrl,
              tipo: archivo.type,
              tamaño: archivo.size
            });

          } catch (fileError) {
            console.error('Error con archivo individual:', fileError);
            // Continuar con otros archivos si uno falla
            continue;
          }
        }
      }

      // Crear registro en la base de datos
      const nuevaEvidencia = {
        id_evidencia_trabajo: nuevoIdEvidencia,
        id_empleado: evidenciaData.id_empleado,
        titulo: evidenciaData.titulo,
        descripcion: evidenciaData.descripcion,
        tipo_evidencia: evidenciaData.tipo_evidencia,
        fecha_evidencia: evidenciaData.fecha_evidencia,
        urls_archivos: urlsArchivos.length > 0 ? JSON.stringify(urlsArchivos) : null,
        estado: 'pendiente'
      };

      console.log('Insertando en BD:', nuevaEvidencia);

      const { data, error } = await this.supabase
        .from('evidencia_trabajo')
        .insert([nuevaEvidencia])
        .select();
        
      if (error) {
        console.error('Error insertando en BD:', error);
        throw error;
      }

      console.log('Evidencia creada exitosamente:', data);
      return { success: true, data };

    } catch (error) {
      console.error('Error completo al crear evidencia:', error);
      return { 
        success: false, 
        error: error.message || 'Error desconocido al crear evidencia'
      };
    }
  }

  async obtenerEvidenciasPorEmpleado(id_empleado) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia_trabajo')
        .select('*')
        .eq('id_empleado', id_empleado)
        .order('fecha_envio', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      // Parsear JSON de URLs si existe
      const evidenciasParseadas = data.map(evidencia => ({
        ...evidencia,
        urls_archivos: evidencia.urls_archivos ? JSON.parse(evidencia.urls_archivos) : []
      }));
      
      return { success: true, data: evidenciasParseadas };
    } catch (error) {
      console.error('Error al obtener evidencias por empleado:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async obtenerEvidenciaPorId(id_evidencia) {
    try {
      const { data, error } = await this.supabase
        .from('evidencia_trabajo')
        .select(`
          *,
          empleado (
            id_empleado,
            tipo,
            persona (
              nombre,
              apellido
            )
          )
        `)
        .eq('id_evidencia_trabajo', id_evidencia)
        .single();
        
      if (error) throw error;
      
      // Parsear JSON de URLs si existe
      if (data && data.urls_archivos) {
        data.urls_archivos = JSON.parse(data.urls_archivos);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener evidencia por ID:', error);
      return { success: false, error: error.message, data: null };
    }
  }
}

const evidenciaService = new EvidenciaService();
export default evidenciaService;