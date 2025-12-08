import { useMemo } from 'react'
import { isFunction } from 'ytil'
import { ChangeCallback } from '../types'

export function useChangeCallback<T>(
  handler: (update: (prev: T) => T) => void,
  deps: any[],
) {
  return useMemo(
    () => makeChangeCallback(handler),

    // Disable this because I always add this hook to additionalHooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )
}

export function makeChangeCallback<T>(handler: (update: (prev: T) => T) => void): ChangeCallback<T> {
  return ((arg: any) => {
    if (isFunction(arg)) {
      return handler(arg)
    } else {
      return handler(() => arg)
    }
  })
}