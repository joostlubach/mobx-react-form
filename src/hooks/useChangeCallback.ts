import { useMemo } from 'react'
import { isFunction } from 'ytil'
import { ChangeCallback, ChangeCallbackWithPartial, isChangeCallbackWithPartial } from '../types'

export function useChangeCallback<T>(
  handler: (update: (prev: T) => T) => void,
  deps: any[]
) {
  return useMemo(
    () => makeChangeCallback(handler),

    // Disable this because I always add this hook to additionalHooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  )
}

export function useChangeCallbackWithPartial<T>(
  handler: (update: (prev: T) => T, partial: boolean) => void,
  deps: any[]
) {
  return useMemo(
    () => makeChangeCallbackWithPartial(handler),

    // Disable this because I always add this hook to additionalHooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
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

export function makeChangeCallbackWithPartial<T>(handler: (update: (prev: T) => T, partial: boolean) => void) {
  const invoke = ((arg: any) => {
    if (isFunction(arg)) {
      return handler(arg, false)
    } else {
      return handler(() => arg, false)
    }
  })
  const invokePartial = ((arg: any) => {
    if (isFunction(arg)) {
      return handler(arg, true)
    } else {
      return handler(() => arg, true)
    }
  })

  const callback = invoke as ChangeCallbackWithPartial<T>
  callback.partial = invokePartial
  return callback
}

export function invokeChangeCallbackWithPartial<T>(
  callback: ChangeCallback<T> | ChangeCallbackWithPartial<T> | undefined,
  update: (prev: T) => T,
  partial: boolean | undefined
) {
  if (callback == null) { return }
  if (partial && isChangeCallbackWithPartial(callback) && callback.partial != null) {
    callback.partial(update)
  } else {
    callback(update)
  }
}