import { supabase } from './apiClient'

class AuthService {
  async login(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (authError || !authData.user) {
        return { success: false, error: 'Credenciales inválidas' }
      }

      const profile = await this.getUserProfile(authData.user.id)

      return {
        success: true,
        data: { user: authData.user, session: authData.session, profile }
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado' }
    }
  }

  async getUserProfile(id_auth) {
    try {
      console.log('🔍 Consultando perfil para id_auth:', id_auth)
      
      // Timeout de 10 segundos para la consulta
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en consulta de usuario')), 10000)
      )

      const queryPromise = supabase
        .from('usuario')
        .select('*')
        .eq('id_auth', id_auth)
        .single()

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        console.error('❌ Error en consulta usuario:', error)
        return null
      }

      if (!data) {
        console.log('⚠️ No se encontró usuario con id_auth:', id_auth)
        return null
      }

      console.log('✅ Usuario encontrado:', data)

      if (data.id_persona) {
        console.log('👤 Consultando persona con id_persona:', data.id_persona)
        
        const personaQueryPromise = supabase
          .from('persona')
          .select('*')
          .eq('id_persona', data.id_persona)
          .single()

        const personaTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout en consulta de persona')), 10000)
        )

        try {
          const { data: personaData, error: personaError } = await Promise.race([
            personaQueryPromise, 
            personaTimeoutPromise
          ])
          
          if (personaError) {
            console.error('❌ Error en consulta persona:', personaError)
          } else if (personaData) {
            console.log('✅ Persona encontrada:', personaData)
            data.persona = personaData
          }
        } catch (timeoutError) {
          console.error('⏱️ Timeout consultando persona:', timeoutError)
        }
      }
      
      return data
    } catch (error) {
      console.error('💥 Error inesperado en getUserProfile:', error)
      return null
    }
  }

  async logout() {
    try {
      await supabase.auth.signOut()
      return { success: true }
    } catch (error) {
      return { success: false }
    }
  }

  async register(userData) {
    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        options: {
          data: {
            nombre: userData.nombre,
            apellido: userData.apellido
          }
        }
      })

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Error al registrar usuario' }
      }

      return {
        success: true,
        data: { user: authData.user, session: authData.session }
      }
    } catch (error) {
      return { success: false, error: 'Error inesperado al registrar' }
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Error al enviar correo de recuperación' }
    }
  }

  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Error al actualizar la contraseña' }
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        return null
      }

      return session
    } catch (error) {
      return null
    }
  }

  getAuthErrorMessage(error) {
    return error?.message || 'Error de autenticación'
  }
}

export default new AuthService()
