import { createClient } from '@supabase/supabase-js'

// Supabase configuration - siguiendo documentación oficial
// https://supabase.com/docs/guides/getting-started/quickstarts/reactjs

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'edificio-auth',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-application-name': 'edificio-multifuncional'
    }
  }
})

// Helper para verificar si el usuario está autenticado
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}

// Helper para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export default supabase
