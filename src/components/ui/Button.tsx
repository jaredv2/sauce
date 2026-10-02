import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)] border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50',
  secondary:
    'bg-[var(--bg-surface-raised)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:opacity-50',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-[14px] gap-2',
  lg: 'h-11 px-6 text-[14px] gap-2',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...rest }: Props) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center font-medium rounded-[var(--radius-sm)]',
        'transition-all duration-150 ease-out btn-press',
        'hover:translate-y-[-1px] hover:shadow-[0_2px_12px_rgba(217,119,87,0.18)] active:translate-y-0 active:shadow-none',
        'focus-visible:outline-none disabled:cursor-not-allowed disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
