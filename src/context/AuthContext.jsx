import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { getProfile } from '../services/profileService.js'
import { isSupabaseConfigured, supabase } from '../services/supabaseClient.js'
import { AuthContext } from './authContextValue.js'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [authError, setAuthError] = useState('')

  const refreshProfile = useCallback(
    async (userId) => {
      if (!userId || !isSupabaseConfigured) {
        setProfile(null)
        return null
      }

      try {
        const nextProfile = await getProfile(userId)
        setProfile(nextProfile)
        return nextProfile
      } catch (error) {
        setAuthError(error.message)
        return null
      }
    },
    [],
  )

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let mounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
      }

      setSession(data.session)

      if (data.session?.user) {
        await refreshProfile(data.session.user.id)
      }

      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        refreshProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      loading,
      authError,
      refreshProfile,
      isConfigured: isSupabaseConfigured,
    }),
    [session, profile, loading, authError, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
