import { Link } from 'react-router-dom'

export function Terms() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <Link to="/" className="text-[14px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">saucewrld</Link>
        <Link to="/" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6 page-enter">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">Last updated: October 2026 · saucewrldwrld - producer link-in-bio</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col gap-5 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">1. Acceptance</h2>
            <p>By creating an account or using saucewrld, you agree to these terms. If you don't agree, please don't use the service.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">2. Accounts</h2>
            <p>Accounts are created via Discord OAuth (Authentication System). You are responsible for content you publish. Usernames must match <code className="rounded bg-[var(--bg-sunken)] border border-[var(--border-default)] px-1 py-0.5 text-[12px]">{'^[a-z0-9_]{3,20}$'}</code> and not impersonate others.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">3. Content</h2>
            <p>You retain ownership of media you upload (avatars, backgrounds, audio). You grant saucewrldwrld a license to host and display it on your public page. Don't upload content you don't have rights to.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">4. Acceptable use</h2>
            <p>No spam, harassment, or illegal content. We may remove pages that violate these terms and suspend accounts at our discretion.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">5. Service changes</h2>
            <p>Features, limits, and pricing may change. We'll give reasonable notice for material changes.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">6. Disclaimer</h2>
            <p>Service is provided "as is" without warranties. We are not liable for indirect damages or loss of data.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">7. Contact</h2>
            <p>Questions? Reach us via Discord at <span className="text-[var(--text-primary)]">discord.gg/</span>.</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-4 text-[12px] text-[var(--text-tertiary)] flex items-center justify-between">
        <span>© 2026 saucewrldwrld</span>
        <div className="flex gap-3"><Link to="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link><Link to="/terms" className="text-[var(--text-primary)]">Terms</Link></div>
      </footer>
    </div>
  )
}
