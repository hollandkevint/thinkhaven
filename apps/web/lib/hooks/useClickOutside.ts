import { useEffect, useRef, type RefObject } from 'react'

/**
 * Hook that calls `handler` when a click occurs outside the referenced element.
 * Only attaches the listener when `active` is true.
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  active: boolean
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!active) return

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handler, active])

  return ref
}
