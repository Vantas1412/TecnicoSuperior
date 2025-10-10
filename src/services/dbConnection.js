// dbConnection.js - Conexión a Supabase
import { createClient } from '@supabase/supabase-js';

// URL y Key desde variables de entorno o valores por defecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjngomnzgfaiddtytxah.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbmdvbW56Z2ZhaWRkdHl0eGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTE5NzYsImV4cCI6MjA3NTUyNzk3Nn0.KiupsqYwbO0HltuB5S45nU3mvJYIxFOnm3It7gl0-Mw';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
