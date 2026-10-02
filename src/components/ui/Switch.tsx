interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  id?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, id, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--bg-sunken)] border-[var(--border-default)]',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
          checked ? 'translate-x-4' : 'translate-x-1',
        ].join(' ')}
        aria-hidden="true"
      />
    </button>
  )
}
