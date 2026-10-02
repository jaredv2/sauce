import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from './Button'

const NAV = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/pages', label: 'Pages', end: false },
  { to: '/dashboard/templates', label: 'Templates', end: false },
  { to: '/dashboard/analytics', label: 'Analytics', end: false },
  { to: '/settings', label: 'Settings', end: false },
]

export function AppShell({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <header className="h-14 shrink-0 flex items-center gap-4 px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-30">
        <Link to="/" className="text-[15px] font-semibold tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">
          sauce
        </Link>
        <nav className="hidden sm:flex items-center gap-1" aria-label="Sections">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={[
                'h-8 inline-flex items-center rounded-[var(--radius-sm)] px-3 text-[13px] font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                active === item.label
                  ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]',
              ].join(' ')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden md:inline text-[13px] text-[var(--text-secondary)]">@{profile?.username}</span>
          <Button variant="ghost" size="sm" loading={signingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <nav className="sm:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-14 z-20" aria-label="Sections">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={[
              'h-8 inline-flex items-center rounded-[var(--radius-sm)] px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
              active === item.label
                ? 'bg-[var(--bg-surface-raised)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]',
            ].join(' ')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{title}</h1>
            {subtitle && <p className="text-[13px] leading-[1.5] text-[var(--text-secondary)] max-w-[60ch]">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
