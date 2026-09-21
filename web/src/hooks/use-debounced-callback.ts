import { useEffect, useRef } from 'react'

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const debounced = (...args: TArgs) => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
  }

  debounced.cancel = () => clearTimeout(timeoutRef.current)

  return debounced
}
