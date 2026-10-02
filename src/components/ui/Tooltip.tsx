import { useId, useState, cloneElement, type ReactElement, type ReactNode } from 'react'

type ChildProps = {
  'aria-describedby'?: string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

interface Props {
  label: ReactNode
  children: ReactElement<ChildProps>
  placement?: 'top' | 'bottom'
}

/**
 * Custom tooltip driven by hover and keyboard focus. Deliberately avoids the
 * native `title` attribute so copy matches the page design system.
 */
export function Tooltip({ label, children, placement = 'top' }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)

  const child = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: () => {
      setOpen(true)
      children.props.onMouseEnter?.()
    },
    onMouseLeave: () => {
      setOpen(false)
      children.props.onMouseLeave?.()
    },
    onFocus: () => {
      setOpen(true)
      children.props.onFocus?.()
    },
    onBlur: () => {
      setOpen(false)
      children.props.onBlur?.()
    },
  })

  return (
    <span className="relative inline-flex">
      {child}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!open}
        className={[
          'pointer-events-none absolute left-1/2 z-30 w-max max-w-[220px] -translate-x-1/2',
          'rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-base)]',
          'px-2 py-1 text-[12px] leading-[1.4] text-[var(--text-primary)] shadow-lg',
          'transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none',
          placement === 'top' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
          open ? 'opacity-100' : 'translate-y-1 opacity-0',
        ].join(' ')}
      >
        {label}
      </span>
    </span>
  )
}
