import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className = '', ...rest }: Props) {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'h-9 w-full rounded-[var(--radius-sm)] border bg-[var(--bg-sunken)]',
          'px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-[var(--danger)]' : 'border-[var(--border-default)]',
          className,
        ].join(' ')}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[12px] text-[var(--danger)]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[12px] text-[var(--text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  )
}
