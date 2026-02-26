import { useCallback } from 'react'
import { FormHandle } from '../FormHandle'
import { ChangeCallback, CommitCallback, FormError } from '../types'
import { useForm } from './useForm'

//------
// useFormField hook

export function useFormField<T>(name: string): FormFieldHook<T>
export function useFormField(name: null): FormFieldHook<null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null>
export function useFormField<T>(name: string | null): FormFieldHook<T | null> {
  const {form} = useForm()
  const noop = useCallback(() => {/*noop*/}, [])

  const value = name == null ? null : form.getFieldValue(name as never) as T
  const onChange = name == null ? noop : form.onChangeFor(name as never)
  const onCommit = form.commit
  const errors = name == null ? [] : form.errorsFor(name as never)

  const hook = [value, onChange, errors, form]
  Object.assign(hook, {value, onChange, onCommit, errors, form})
  return hook as any
}

export type FormFieldHook<T = any> = [
  T,
  ChangeCallback<T>,
  FormError[],
  FormHandle<any>,
] & {
  value:    T
  onChange: ChangeCallback<T>
  onCommit: CommitCallback
  errors:   FormError[]
  form:     FormHandle<any>
}