// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../services/apiClient'
import authService from '../services/authService'

/**
 * 🔐 AUTH CONTEXT
 * Manejo global de autenticación con Supabase
 */

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const loadingProfileRef = useRef(null) // Evitar llamadas duplicadas
  const profileCacheRef = useRef({}) // Cache de perfiles

  // Inicializar sesión
  useEffect(() => {
    console.log('🚀 Iniciando AuthContext')
    let mounted = true

    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      
      console.log('📋 Sesión actual:', session ? 'Existe' : 'No existe')
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        console.log('👤 Usuario encontrado, cargando perfil...')
        loadUserProfile(session.user.id)
      } else {
        console.log('❌ No hay usuario, setLoading(false)')
        setLoading(false)
      }
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔐 Auth event:', event, 'Session:', session ? 'Existe' : 'No existe')
        
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Si ya tenemos el perfil en caché para este usuario, usarlo
          if (profileCacheRef.current[session.user.id]) {
            console.log('✅ Usando perfil desde caché')
            setProfile(profileCacheRef.current[session.user.id])
            setLoading(false)
            return
          }
          
          console.log('👤 Usuario en auth change, cargando perfil...')
          await loadUserProfile(session.user.id)
        } else {
          console.log('❌ No hay usuario en auth change')
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Cargar perfil del usuario
  const loadUserProfile = async (userId) => {
    // Evitar llamadas duplicadas
    if (loadingProfileRef.current === userId) {
      console.log('⚠️ Ya se está cargando el perfil para este usuario, omitiendo...')
      return
    }
    
    // Verificar caché primero
    if (profileCacheRef.current[userId]) {
      console.log('✅ Perfil encontrado en caché')
      setProfile(profileCacheRef.current[userId])
      setLoading(false)
      return
    }
    
    console.log('🔄 Cargando perfil para userId:', userId)
    loadingProfileRef.current = userId
    
    // Timeout de seguridad: si no termina en 15 segundos, forzar loading=false
    const safetyTimeout = setTimeout(() => {
      console.error('⏱️ TIMEOUT: Forzando setLoading(false) después de 15 segundos')
      setLoading(false)
      setProfile(null)
      loadingProfileRef.current = null
    }, 15000)

    try {
      const userProfile = await authService.getUserProfile(userId)
      clearTimeout(safetyTimeout)
      console.log('✅ Perfil cargado:', userProfile)
      
      // Solo actualizar si el perfil es válido
      if (userProfile) {
        // Guardar en caché
        profileCacheRef.current[userId] = userProfile
        setProfile(userProfile)
      } else {
        console.error('⚠️ Perfil es null, no se actualizará')
        setProfile(null)
      }
    } catch (error) {
      clearTimeout(safetyTimeout)
      console.error('❌ Error al cargar perfil:', error)
      setProfile(null)
    } finally {
      clearTimeout(safetyTimeout)
      loadingProfileRef.current = null
      console.log('🏁 Finalizando carga, setLoading(false)')
      setLoading(false)
    }
  }

  // Login
  const login = async (email, password) => {
    console.log('🔑 Iniciando login...')
    setLoading(true)
    try {
      const result = await authService.login(email, password)
      console.log('📥 Resultado login:', result.success ? 'Exitoso' : 'Fallido', result)
      
      if (result.success) {
        console.log('✅ Actualizando estado con perfil:', result.data.profile)
        setUser(result.data.user)
        setSession(result.data.session)
        setProfile(result.data.profile)
      }
      
      return result
    } finally {
      console.log('🏁 Login finalizado, setLoading(false)')
      setLoading(false)
    }
  }

  // Register
  const register = async (userData) => {
    setLoading(true)
    try {
      const result = await authService.register(userData)
      
      if (result.success) {
        setUser(result.data.user)
        setSession(result.data.session)
        setProfile(result.data.profile)
      }
      
      return result
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    setLoading(true)
    try {
      const result = await authService.logout()
      
      if (result.success) {
        setUser(null)
        setSession(null)
        setProfile(null)
        // Limpiar caché
        profileCacheRef.current = {}
      }
      
      return result
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    return await authService.resetPassword(email)
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      // Limpiar caché para forzar recarga
      delete profileCacheRef.current[user.id]
      await loadUserProfile(user.id)
    }
  }

  // Helpers de rol (compatibilidad con código anterior)
  const hasRole = (role) => {
    return profile?.rol === role
  }

  const value = {
    // Estado
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!session,
    
    // Métodos
    login,
    register,
    logout,
    resetPassword,
    refreshProfile,
    hasRole,
    
    // Helpers
    isAdmin: profile?.rol === 'admin',
    isResidente: profile?.rol === 'residente',
    isEmpleado: profile?.rol === 'empleado'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default AuthContext