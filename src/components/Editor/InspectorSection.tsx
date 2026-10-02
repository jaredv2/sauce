import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Switch } from '../ui/Switch'
import type { Align } from '../../types/pageConfig'

interface Props {
  title: string
  icon?: ReactNode
  checked?: boolean
  onToggle?: (v: boolean) => void
  defaultOpen?: boolean
  badge?: string
  align?: Align
  onAlignChange?: (a: Align) => void
  hideHiddenText?: boolean
  children: ReactNode
}

export function InspectorSection({ title, icon, checked, onToggle, defaultOpen = true, badge, align, onAlignChange, hideHiddenText, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  const showToggle = typeof checked === 'boolean' && typeof onToggle === 'function'
  const showAlign = !!align && !!onAlignChange

  return (
    <div
      className={[
        'rounded-[var(--radius-md)] border relative transition-all duration-200',
        showToggle && !checked
          ? 'border-dashed border-[var(--border-default)] bg-transparent opacity-80 hover:opacity-100'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)]',
        open && checked !== false ? 'shadow-sm' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2.5 px-3 sm:px-4 py-3 text-left hover:bg-[var(--bg-surface-raised)]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        >
          <span
            aria-hidden="true"
            className={[
              'inline-flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-sunken)] shrink-0 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0',
            ].join(' ')}
          >
            <ChevronDown size={12} className="text-[var(--text-secondary)]" />
          </span>
          {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
          <span className="text-[12px] font-semibold tracking-widest text-[var(--text-primary)] uppercase">{title}</span>
          {badge && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[var(--text-tertiary)]">{badge}</span>
          )}
          {showToggle && !checked && !hideHiddenText && <span className="text-[11px] text-[var(--text-tertiary)] ml-1">• hidden</span>}
        </button>

        {showAlign && (
          <div className="flex items-center gap-0.5 p-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-sunken)] shrink-0 mr-1" role="group" aria-label={`${title} alignment`}>
            {(['left', 'center', 'right'] as const).map((a) => {
              const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
              const active = align === a
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Align ${a}`}
                  onClick={() => onAlignChange(a)}
                  className={[
                    'h-6 w-6 inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                    active ? 'bg-[var(--accent)] text-[var(--text-on-accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-raised)]',
                  ].join(' ')}
                >
                  <Icon size={12} />
                </button>
              )
            })}
          </div>
        )}

        {showToggle && (
          <div className="pr-3 sm:pr-4 flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="hidden sm:inline text-[11px] text-[var(--text-tertiary)]">{checked ? 'Visible' : 'Hidden'}</span>
            <Switch checked={checked} onChange={onToggle!} label={`${title} visible`} />
          </div>
        )}
      </div>

      {open && (
        <div id={contentId} className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
          <div
            className={`flex flex-col gap-3 pt-3 border-t ${showToggle && !checked ? 'border-dashed border-[var(--border-default)] opacity-60' : 'border-[var(--border-subtle)]'}`}
          >
            {showAlign && (
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                <span className="tracking-widest font-semibold">ALIGN</span>
                <span className="text-[11px]">Sub-elements align {align}</span>
              </div>
            )}
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
