import { Link } from 'react-router-dom'

export function Privacy() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <Link to="/" className="text-[14px] font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-[var(--radius-sm)] px-1">sauce</Link>
        <Link to="/" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Home</Link>
      </header>
      <main className="mx-auto w-full max-w-[720px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-6 page-enter">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">Last updated: August 2026</p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col gap-5 text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">What we collect</h2>
            <p>Discord ID and avatar (via OAuth), username, page configs and media you upload, and aggregated page view counts.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">How we use it</h2>
            <p>To operate your public page at <code className="rounded bg-[var(--bg-sunken)] border border-[var(--border-default)] px-1 py-0.5 text-[12px]">{'/{username}'}</code> and display analytics (total views) to you.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Storage</h2>
            <p>Media is stored in Our Servers Storage buckets <code className="rounded bg-[var(--bg-sunken)] border border-[var(--border-default)] px-1 py-0.5 text-[11px]">avatars / backgrounds / audio</code> with public read and owner-only write. You can delete media in the editor; deleting your account cascades to all pages and views.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Analytics</h2>
            <p>We log page views per public visits. Counts are visible only to the page owner.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Retention & deletion</h2>
            <p>Delete your account in Settings - this removes your profile, pages, and views. Discord session is signed out. Backups may persist briefly.</p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Your rights</h2>
            <p>Access, correct, or delete your data via the app or by contacting us. We don't sell your data.</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 sm:px-6 py-4 text-[12px] text-[var(--text-tertiary)] flex items-center justify-between">
        <span>© 2026 sauce</span>
        <div className="flex gap-3"><Link to="/privacy" className="text-[var(--text-primary)]">Privacy</Link><Link to="/terms" className="hover:text-[var(--text-primary)]">Terms</Link></div>
      </footer>
    </div>
  )
}
