import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  username: string
  active_page_id: string | null
  plan: 'free' | 'paid'
  discord_id: string | null
  discord_avatar_url: string | null
  created_at: string
  display_name: string | null
  bio: string | null
  page_visibility: 'public' | 'unlisted' | 'private'
  analytics_enabled: boolean
  discoverable: boolean
  default_background_effect: 'none' | 'blur' | 'dark-overlay' | 'gradient' | 'frosted' | 'black-and-white'
  verified_at: string | null
  public_uid: number
  username_changed_at: string | null
}

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  profileLoading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  // Tab refocus makes Supabase re-emit auth events with a fresh `user` object.
  // Tracking the id lets us ignore those no-op events instead of refetching
  // and replaying loading states on every page.
  const currentUserIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // Don't treat missing table / network as crash - log and keep profile null
        console.warn('[auth] profile fetch failed', error.message)
        setProfile(null)
        return
      }
      setProfile(data as Profile | null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id)
  }, [user?.id, fetchProfile])

  useEffect(() => {
    let mounted = true

    async function init() {
      // Returning from Discord OAuth: the URL carries ?code=… - exchange it
      // deterministically before reading the session, so route guards never
      // see a stale null session and bounce the user to /login.
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code)
          } catch (e) {
            // Auto-detect may have already exchanged it - fall through to getSession()
            console.warn('[auth] code exchange failed', e instanceof Error ? e.message : e)
          }
          url.searchParams.delete('code')
          window.history.replaceState(null, '', url.pathname + url.search + url.hash)
        }
      } catch {
        // Non-browser context or malformed URL - ignore
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      const s = data.session
      currentUserIdRef.current = s?.user.id ?? null
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) await fetchProfile(s.user.id)
      setLoading(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      const nextId = nextSession?.user.id ?? null
      // A token refresh changes the access token, never the identity or profile.
      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession)
        return
      }
      if (nextId === currentUserIdRef.current) {
        // Same identity re-announced (tab focus, visibility change): keep state
        // as-is so nothing re-renders a skeleton.
        if (!nextSession) {
          setSession(null)
          setUser(null)
          setProfile(null)
          currentUserIdRef.current = null
        }
        setLoading(false)
        return
      }
      currentUserIdRef.current = nextId
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (nextId) {
        await fetchProfile(nextId)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      currentUserIdRef.current = null
      sub.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileLoading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
