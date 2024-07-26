import React from 'react'
import { FieldChangeCallback, isFieldChangeCallback } from '../types'

export function useFieldChangeCallback<T, U = any>(
  handler: (value: T, partial: boolean) => U,
) {
  const invoke = React.useCallback(
    (value: T) => handler(value, false),
    [handler],
  )

  const invokePartial = React.useCallback(
    (value: T) => handler(value, true),
    [handler],
  )

  return React.useMemo(() => {
    const callback = invoke as FieldChangeCallback<T>
    callback.partial = invokePartial
    return callback
  }, [invoke, invokePartial])
}

export function makeFieldChangeCallback<T, U = any>(handler: (value: T, partial: boolean) => U) {
  const invoke = (value: T) => handler(value, true)
  const invokePartial = (value: T) => handler(value, false)

  const callback = invoke as FieldChangeCallback<T>
  callback.partial = invokePartial
  return callback
}

export function invokeFieldChangeCallback<T>(callback: ((value: T) => any) | FieldChangeCallback<T> | undefined, value: T, partial: boolean | undefined) {
  if (callback == null) { return }
  if (isFieldChangeCallback(callback)) {
    if (partial) {
      callback.partial(value)
    } else {
      callback(value)
    }
  } else {
    callback(value)
  }
}