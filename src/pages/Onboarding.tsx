import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { Button } from '../components/ui/Button'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const debounced = useDebounce(username.trim().toLowerCase(), 400)

  // client-side regex check
  useEffect(() => {
    if (!debounced) {
      setStatus('idle')
      return
    }
    if (!USERNAME_RE.test(debounced)) {
      setStatus('invalid')
      return
    }
    setStatus('checking')
    let cancelled = false

    async function check() {
      // If env missing, skip network check - allow submit to surface real error
      if (!import.meta.env.VITE_SUPABASE_URL) {
        if (!cancelled) setStatus('available')
        return
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', debounced)
          .maybeSingle()
        if (cancelled) return
        if (error) {
          console.warn('[onboarding] uniqueness check failed', error.message)
          setStatus('error')
          return
        }
        setStatus(data ? 'taken' : 'available')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [debounced])

  const normalized = username.trim().toLowerCase()
  const canSubmit = USERNAME_RE.test(normalized) && status === 'available' && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!USERNAME_RE.test(normalized)) {
      setStatus('invalid')
      return
    }
    if (status === 'taken') return
    if (!user) {
      setSubmitError('No active session. Please sign in again.')
      return
    }

    setSubmitting(true)
    try {
      // Pull discord info from user_metadata (provider-specific shape varies)
      const meta = user.user_metadata as Record<string, unknown>
      const discordId =
        (meta.provider_id as string) ??
        (meta.sub as string) ??
        (meta.discord_id as string) ??
        null
      // avatar may be in avatar_url, picture, or discord-specific field
      const avatarUrl =
        (meta.avatar_url as string) ??
        (meta.picture as string) ??
        (meta.custom_claims as Record<string, unknown> | undefined)?.avatar_url as string | undefined ??
        null

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        username: normalized,
        discord_id: discordId,
        discord_avatar_url: avatarUrl,
      })
      if (error) throw error

      await refreshProfile()
      navigate('/dashboard/pages', { replace: true })
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to create profile'
      // Friendly messages for common constraints
      if (raw.includes('duplicate') || raw.includes('unique') || raw.includes('already')) {
        setStatus('taken')
        setSubmitError('That username is already taken. Try another.')
      } else if (raw.includes('username')) {
        setSubmitError('Username must be 3–20 characters: lowercase letters, numbers, underscore only.')
      } else {
        setSubmitError(raw)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const helper =
    status === 'invalid'
      ? '3–20 characters, lowercase letters, numbers, underscore only.'
      : status === 'taken'
        ? 'This username is taken.'
        : status === 'available'
          ? 'Username is available.'
          : status === 'checking'
            ? 'Checking availability…'
            : status === 'error'
              ? 'Could not check availability - you can still try to continue.'
              : 'You can change this later in Settings.'

  const helperTone =
    status === 'available' ? 'text-[var(--success)]' : status === 'taken' || status === 'invalid' ? 'text-[var(--danger)]' : 'text-[var(--text-tertiary)]'

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <header className="h-14 flex items-center px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Link to="/" className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">
          sauce
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[480px] card-enter rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-[20px] font-semibold leading-none tracking-tight text-[var(--text-primary)]">Choose your username</h1>
            <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              This will be your public page at <span className="text-[var(--text-primary)] font-medium">saucewrld.lol / {normalized || 'username'}</span>. Lowercase, 3–20 characters.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[13px] font-medium text-[var(--text-primary)]">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]" aria-hidden="true">
                  @
                </span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-invalid={status === 'invalid' || status === 'taken' ? true : undefined}
                  aria-describedby="username-hint username-status"
                  className={[
                    'h-9 w-full rounded-[var(--radius-sm)] border bg-[var(--bg-sunken)]',
                    'pl-7 pr-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
                    status === 'taken' || status === 'invalid' ? 'border-[var(--danger)]' : 'border-[var(--border-default)]',
                  ].join(' ')}
                />
                <span
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                >
                  {status === 'checking' && <span className="block h-3.5 w-3.5 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)] animate-spin" />}
                  {status === 'available' && <span className="text-[var(--success)] text-[14px]">✓</span>}
                  {status === 'taken' || status === 'invalid' ? <span className="text-[var(--danger)] text-[14px]">✕</span> : null}
                </span>
              </div>
              <p id="username-hint" className={`text-[12px] leading-[1.4] transition-colors duration-200 ${helperTone}`}>
                {helper}
              </p>
              <p id="username-status" className="sr-only" aria-live="polite">
                {status === 'checking' ? 'Checking' : status === 'available' ? 'Available' : status === 'taken' ? 'Taken' : status === 'invalid' ? 'Invalid format' : ''}
              </p>
            </div>

            {submitError && (
              <div role="alert" className="slide-up rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] leading-[1.4] text-[var(--text-primary)]">
                {submitError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={!canSubmit} loading={submitting} className="min-w-[140px]">
                Create profile
              </Button>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                Press Enter to continue
              </span>
            </div>

            <p className="text-[12px] leading-[1.5] text-[var(--text-tertiary)]">
              Signed in as <span className="text-[var(--text-secondary)]">{user?.email ?? user?.id.slice(0, 8) + '…'}</span> via Discord. Need to switch account?{' '}
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="underline underline-offset-2 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm"
              >
                Sign out
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
