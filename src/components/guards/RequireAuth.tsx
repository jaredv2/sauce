import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]"
      aria-busy="true"
      aria-label="Loading session"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)] animate-spin" aria-hidden="true" />
        <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

/** Requires auth + existing profile; else redirect to /onboarding */
/** Signed-in users never see the marketing page - send them where they belong. */
export function LandingRedirect({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, profileLoading } = useAuth()
  if (loading) return <AuthLoading />
  if (!session) return <>{children}</>
  if (profileLoading) return <AuthLoading />
  return <Navigate to={profile ? '/dashboard' : '/onboarding'} replace />
}

export function RequireProfile({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, profileLoading } = useAuth()
  if (loading || profileLoading) return <AuthLoading />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/** Requires auth + NO profile; if profile exists go to dashboard */
export function RequireNoProfile({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, profileLoading } = useAuth()
  if (loading || profileLoading) return <AuthLoading />
  if (!session) return <Navigate to="/login" replace />
  if (profile) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
