import * as React from "react"

/**
 * Returns a stable function that delays invoking `callback` until `delayMs`
 * have passed without another call — e.g. so typing in a price field doesn't
 * fire a save request on every keystroke.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  const callbackRef = React.useRef(callback)
  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const timeoutRef = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current)
  }, [])

  return React.useCallback(
    (...args: Args) => {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args)
      }, delayMs)
    },
    [delayMs]
  )
}
