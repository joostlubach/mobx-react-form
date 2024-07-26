import React from 'react'
import { FormContext } from '../FormContext'
import { FieldChangeCallback, FormError } from '../types'
import { useFieldChangeCallback } from './useFieldChangeCallback'

//------
// useFormField hook

export function useFormField<T>(name: string): FormFieldHook<T>
export function useFormField(name: null): FormFieldHook<null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null> {
  const form = React.useContext(FormContext)
  const noop = useFieldChangeCallback(() => {/*noop*/})

  const value = name == null ? null : form.getFieldValue(name as never) as T
  const onChange = name == null ? noop : form.onChangeFor(name as never)
  const errors = name == null ? [] : form.errorsFor(name as never)

  const hook = [value, onChange, errors, form]
  Object.assign(hook, {value, onChange, errors, form})
  return hook as any
}

export type FormFieldHook<T = any> = [
  T,
  FieldChangeCallback<T>,
  FormError[],
  FormContext<any>,
] & {
  value:    T
  onChange: FieldChangeCallback<T>
  errors:   FormError[]
  form:     FormContext<any>
}