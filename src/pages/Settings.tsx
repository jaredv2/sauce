import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { AppShell } from '../components/ui/AppShell'
import { usernameCooldown, USERNAME_COOLDOWN_DAYS } from '../lib/username'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Switch } from '../components/ui/Switch'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/
type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error' | 'same' | 'cooldown'

const EFFECT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'blur', label: 'Blur' },
  { value: 'dark-overlay', label: 'Dark' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'black-and-white', label: 'B&W' },
] as const

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', hint: 'Anyone with your link can open it, and saucewrldwrld can suggest you.' },
  { value: 'unlisted', label: 'Unlisted', hint: 'Reachable by direct link only. No suggestions, no view logging.' },
  { value: 'private', label: 'Private', hint: 'Your public link returns "page not found" for everyone but you.' },
] as const

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 sm:p-5 flex flex-col gap-4"
      aria-labelledby={id}
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-[11px] font-semibold tracking-[0.1em] text-[var(--text-tertiary)]">
          {title}
        </h2>
        {description && <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5">
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
        {hint && <span className="text-[12px] leading-[1.4] text-[var(--text-tertiary)]">{hint}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </label>
  )
}

export function Settings() {
  const { profile, user, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState(profile?.username ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [prefsBusy, setPrefsBusy] = useState(false)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')

  useEffect(() => {
    if (profile?.username && username === '') setUsername(profile.username)
  }, [profile?.username, username])

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
    setBio(profile?.bio ?? '')
  }, [profile?.display_name, profile?.bio])

  const debounced = useDebounce(username.trim().toLowerCase(), 400)
  const normalized = username.trim().toLowerCase()
  const current = profile?.username ?? ''
  const isSame = normalized === current

  const cooldown = usernameCooldown(profile?.username_changed_at, profile?.created_at)

  useEffect(() => {
    if (!debounced) {
      setStatus('idle')
      return
    }
    if (isSame) {
      setStatus('same')
      return
    }
    if (cooldown.active) {
      setStatus('cooldown')
      return
    }
    if (!USERNAME_RE.test(debounced)) {
      setStatus('invalid')
      return
    }
    setStatus('checking')
    let cancelled = false

    async function check() {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        if (!cancelled) setStatus('available')
        return
      }
      try {
        const { data, error } = await supabase.from('profiles').select('username').eq('username', debounced).maybeSingle()
        if (cancelled) return
        if (error) {
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
  }, [debounced, isSame, cooldown.active])

  const helper =
    status === 'same'
      ? 'This is your current username.'
      : status === 'cooldown'
        ? cooldown.availableAt
          ? `You can change it again on ${cooldown.availableAt.toLocaleDateString()} (${USERNAME_COOLDOWN_DAYS}-day cooldown).`
          : `Username changes are limited to once every ${USERNAME_COOLDOWN_DAYS} days.`
        : status === 'invalid'
          ? '3–20 characters, lowercase letters, numbers, underscore only.'
          : status === 'taken'
            ? 'This username is taken.'
            : status === 'available'
              ? 'Username is available.'
              : status === 'checking'
                ? 'Checking availability…'
                : status === 'error'
                  ? 'Could not check - you can still try to save.'
                  : `Lowercase, 3–20 characters. Changes are limited to once every ${USERNAME_COOLDOWN_DAYS} days.`

  const helperTone =
    status === 'available'
      ? 'text-[var(--success)]'
      : status === 'taken' || status === 'invalid' || status === 'cooldown'
        ? 'text-[var(--danger)]'
        : status === 'same'
          ? 'text-[var(--text-secondary)]'
          : 'text-[var(--text-tertiary)]'

  const canSave = !isSame && !cooldown.active && USERNAME_RE.test(normalized) && status === 'available' && !saving

  async function savePrefs(patch: Record<string, unknown>, successMessage: string) {
    if (!user) return
    setPrefsBusy(true)
    setPrefsError(null)
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setSaveSuccess(successMessage)
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setPrefsBusy(false)
    }
  }

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)
    if (isSame) return
    if (cooldown.active) {
      setStatus('cooldown')
      return
    }
    if (!USERNAME_RE.test(normalized)) {
      setStatus('invalid')
      return
    }
    if (status === 'taken') return
    if (!user) {
      setSaveError('No active session.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ username: normalized }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setSaveSuccess(`Username updated to @${normalized}`)
      setStatus('same')
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to update username'
      if (raw.includes('username_change_cooldown')) {
        setStatus('cooldown')
        setSaveError(`Username changes are limited to once every ${USERNAME_COOLDOWN_DAYS} days.`)
      } else if (raw.includes('duplicate') || raw.includes('unique') || raw.includes('already')) {
        setStatus('taken')
        setSaveError('That username is already taken.')
      } else if (raw.includes('username')) {
        setSaveError('Username must be 3–20 characters: lowercase, numbers, underscore only.')
      } else {
        setSaveError(raw)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleReconnect() {
    if (!user) return
    setPrefsError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/settings` },
    })
    if (error) setPrefsError(error.message)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const exportData = useCallback(async () => {
    if (!user) return
    setPrefsBusy(true)
    setPrefsError(null)
    try {
      const [profileRes, pagesRes, viewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('pages').select('*').eq('profile_id', user.id),
        supabase.from('page_views').select('id, page_id, viewed_at').eq('profile_id', user.id),
      ])
      if (profileRes.error) throw profileRes.error
      if (pagesRes.error) throw pagesRes.error
      if (viewsRes.error) throw viewsRes.error
      const payload = {
        exported_at: new Date().toISOString(),
        profile: profileRes.data,
        pages: pagesRes.data,
        page_views: viewsRes.data,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `saucewrld-export-${user.id.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setPrefsBusy(false)
    }
  }, [user])

  async function handleDeleteAccount() {
    if (deleteConfirm !== current) return
    setDeleting(true)
    setDeleteError(null)
    try {
      if (!user) throw new Error('No session')
      const { error } = await supabase.from('profiles').delete().eq('id', user.id)
      if (error) throw error
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
      setDeleting(false)
    }
  }

  const prefsChanged =
    displayName !== (profile?.display_name ?? '') || bio !== (profile?.bio ?? '')

  return (
    <AppShell
      active="Settings"
      title="Settings"
      subtitle="Your public link, appearance defaults, privacy, and account."
      actions={
        <Link to="/dashboard">
          <Button variant="secondary" size="sm">Back to overview</Button>
        </Link>
      }
    >
      {prefsError && (
        <div role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-[13px] text-[var(--text-primary)]">
          {prefsError}
        </div>
      )}
      {saveSuccess && (
        <div role="status" className="rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success)]/10 px-4 py-3 text-[13px] text-[var(--text-primary)]">
          {saveSuccess}
        </div>
      )}

      <Section id="profile-heading" title="PROFILE DETAILS" description="Defaults used when you create a new page.">
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="John W. saucewrld"
        />
        <Textarea
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Trap Producer - Sound Engineer"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={!prefsChanged}
            loading={prefsBusy}
            onClick={() => savePrefs({ display_name: displayName || null, bio: bio || null }, 'Profile details saved')}
          >
            Save details
          </Button>
          {prefsChanged && <span className="text-[12px] text-[var(--text-tertiary)]">Unsaved changes</span>}
        </div>
      </Section>

      <Section id="username-heading" title="USERNAME" description={`Your public page is saucewrld.lol/${current || 'username'}. Changing it updates your live link immediately.`}>
        <form onSubmit={handleSaveUsername} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="settings-username" className="text-[13px] font-medium text-[var(--text-primary)]">
              Username
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[var(--text-tertiary)]" aria-hidden="true">
                @
              </span>
              <input
                id="settings-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setSaveError(null)
                  setSaveSuccess(null)
                }}
                placeholder="yourname"
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                aria-invalid={status === 'invalid' || status === 'taken' ? true : undefined}
                aria-describedby="settings-username-hint"
                className={[
                  'h-9 w-full rounded-[var(--radius-sm)] border bg-[var(--bg-sunken)] pl-7 pr-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed',
                  status === 'taken' || status === 'invalid' || status === 'cooldown' ? 'border-[var(--danger)]' : 'border-[var(--border-default)]',
                ].join(' ')}
                disabled={cooldown.active}
              />
            </div>
            <p id="settings-username-hint" className={`text-[12px] leading-[1.4] ${helperTone}`}>
              {helper}
            </p>
          </div>

          {saveError && (
            <div role="alert" className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={!canSave} loading={saving}>
              Save username
            </Button>
          </div>
        </form>
      </Section>

      <Section id="appearance-heading" title="APPEARANCE & THEME" description="Starting point for new pages. saucewrldwrld is dark-only for now.">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Default background effect</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Default background effect">
            {EFFECT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={profile?.default_background_effect === o.value}
                onClick={() => savePrefs({ default_background_effect: o.value }, `Default effect set to ${o.label}`)}
                disabled={prefsBusy}
                className={[
                  'rounded-full px-2.5 py-1 text-[12px] font-medium border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60',
                  profile?.default_background_effect === o.value
                    ? 'bg-[var(--accent)] text-[var(--text-on-accent)] border-[var(--accent)]'
                    : 'bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-strong)]',
                ].join(' ')}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section id="privacy-heading" title="PRIVACY & VISIBILITY" description="Who can open your page and what gets recorded.">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Page visibility</span>
          <div className="flex flex-col divide-y divide-[var(--border-subtle)] rounded-[var(--radius-sm)] border border-[var(--border-default)]">
            {VISIBILITY_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-[var(--bg-sunken)] transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  value={o.value}
                  checked={profile?.page_visibility === o.value}
                  onChange={() => savePrefs({ page_visibility: o.value }, `Visibility set to ${o.label}`)}
                  disabled={prefsBusy}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{o.label}</span>
                  <span className="text-[12px] leading-[1.4] text-[var(--text-tertiary)]">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <ToggleRow
          label="Count my page views"
          hint="Turn off and new visits stop being recorded."
          checked={profile?.analytics_enabled ?? true}
          disabled={prefsBusy}
          onChange={(v) => savePrefs({ analytics_enabled: v }, v ? 'View counting on' : 'View counting off')}
        />
        <ToggleRow
          label="Suggest me to other producers"
          hint="Controls whether saucewrld offers your page in join prompts."
          checked={profile?.discoverable ?? true}
          disabled={prefsBusy}
          onChange={(v) => savePrefs({ discoverable: v }, v ? 'You are discoverable' : 'You are hidden from suggestions')}
        />
      </Section>

      <Section id="security-heading" title="SESSIONS & SECURITY" description="Discord is the only way in - there is no password.">
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] px-3 py-2.5">
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Current session</span>
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {user?.app_metadata?.provider === 'discord' ? 'Discord' : 'Active'}
              {user?.last_sign_in_at ? ` · signed in ${new Date(user.last_sign_in_at).toLocaleString()}` : ''}
            </span>
          </span>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleReconnect} disabled={prefsBusy}>
            Reconnect Discord
          </Button>
          <span className="text-[12px] text-[var(--text-tertiary)]">Re-authorises your account and returns here.</span>
        </div>
      </Section>

      <Section id="discord-heading" title="CONNECTED DISCORD" description="Used to import your avatar when you sign in. Only you can see these details.">
        <div className="flex items-center gap-3">
          {profile?.discord_avatar_url ? (
            <img
              src={profile.discord_avatar_url}
              alt="Discord avatar"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              className="h-10 w-10 rounded-full object-cover border border-[var(--border-default)] bg-[var(--bg-sunken)]"
            />
          ) : (
            <div className="h-10 w-10 rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] flex items-center justify-center text-[12px] text-[var(--text-tertiary)]" aria-hidden="true">
              D
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
              {profile?.discord_id ? `Discord connected ····${profile.discord_id.slice(-4)}` : 'No Discord ID'}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)] truncate">
              {user?.email
                ? `${user.email.slice(0, 1)}•••@${user.email.split('@')[1] ?? 'hidden'}`
                : 'Discord OAuth'}
            </span>
          </div>
        </div>
      </Section>

      <Section id="export-heading" title="DATA EXPORT" description="Download a copy of everything saucewrld holds for you.">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportData} loading={prefsBusy}>
            Download JSON
          </Button>
          <span className="text-[12px] text-[var(--text-tertiary)]">Profile, pages with draft and live config, and view history.</span>
        </div>
      </Section>

      <Section id="danger-heading" title="DANGER ZONE" description="Deletes your account, pages, and view history. This is permanent.">
        <div>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            Delete account
          </Button>
        </div>
      </Section>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" onClick={() => setShowDelete(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm modal-backdrop" />
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="relative w-full max-w-[480px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col gap-4 shadow-xl modal-panel">
            <div className="flex flex-col gap-2">
              <h2 id="delete-account-title" className="text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">Delete account?</h2>
              <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
                This will delete <span className="font-medium text-[var(--text-primary)]">@{current}</span>, all your pages, and all page views. Your Discord login will be signed out. This cannot be undone.
              </p>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] p-3 flex flex-col gap-2">
              <label htmlFor="delete-confirm" className="text-[13px] font-medium text-[var(--text-primary)]">
                Type <span className="font-mono text-[var(--accent)]">{current}</span> to confirm
              </label>
              <input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={current}
                autoCapitalize="off"
                spellCheck={false}
                className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
              />
            </div>

            {deleteError && (
              <div role="alert" className="rounded-[var(--radius-sm)] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowDelete(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={deleting} disabled={deleteConfirm !== current}>
                Delete account
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
