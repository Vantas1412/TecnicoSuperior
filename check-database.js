// Script para verificar las tablas de la base de datos
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wjngomnzgfaiddtytxah.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbmdvbW56Z2ZhaWRkdHl0eGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTE5NzYsImV4cCI6MjA3NTUyNzk3Nn0.KiupsqYwbO0HltuB5S45nU3mvJYIxFOnm3It7gl0-Mw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Verificando conexión a Supabase...\n');
  
  const tables = [
    'persona',
    'usuario',
    'administrador',
    'empleado',
    'residente',
    'departamento',
    'areas_comunes',
    'servicio',
    'aviso',
    'queja_sugerencia',
    'incidente',
    'mantenimiento',
    'reserva',
    'pago',
    'deuda'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count !== null ? count : 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n✨ Verificación completada');
}

checkDatabase();
