import { useCallback } from 'react'
import { navigate } from './router'

/** Accessible in-app link: renders a real anchor, intercepts plain clicks
    so navigation stays SPA-fast while modifier/middle clicks (open in new
    tab, etc.) keep their native browser behavior. */
export function Link({
  to,
  className,
  children,
  ...rest
}: {
  to: string
  className?: string
  children: React.ReactNode
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      e.preventDefault()
      navigate(to)
    },
    [to],
  )
  return (
    <a href={to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
