import type { TextareaHTMLAttributes } from 'react'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, id, className = '', ...rest }: Props) {
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded-[var(--radius-sm)] border bg-[var(--bg-sunken)] px-3 py-2 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-h-[72px] resize-y',
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
