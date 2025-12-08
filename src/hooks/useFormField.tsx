import React from 'react'
import { FormContext } from '../FormContext'
import { ChangeCallback, CommitCallback, FormError } from '../types'
import { useChangeCallback } from './useChangeCallback'

//------
// useFormField hook

export function useFormField<T>(name: string): FormFieldHook<T>
export function useFormField(name: null): FormFieldHook<null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null> {
  const form = React.useContext(FormContext)
  const noop = useChangeCallback(() => {/*noop*/}, [])

  const value = name == null ? null : form.getFieldValue(name as never) as T
  const onChange = name == null ? noop : form.onChangeFor(name as never)
  const onCommit = form.onCommit
  const errors = name == null ? [] : form.errorsFor(name as never)

  const hook = [value, onChange, errors, form]
  Object.assign(hook, {value, onChange, onCommit, errors, form})
  return hook as any
}

export type FormFieldHook<T = any> = [
  T,
  ChangeCallback<T>,
  FormError[],
  FormContext<any>,
] & {
  value:    T
  onChange: ChangeCallback<T>
  onCommit: CommitCallback
  errors:   FormError[]
  form:     FormContext<any>
}