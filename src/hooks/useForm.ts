import { useContext } from 'react'
import { FormContext } from '../FormContext'
import { FormHandle } from '../FormHandle'
import { FormModel } from '../types'

export function useForm<M extends FormModel>(): FormContext<M> {
  const {form, model} = useMaybeForm<M>()
  if (form == null || model == null) {
    throw new Error('useForm must be used within a Form')
  }
  return {form, model}
}

export function useMaybeForm<M extends FormModel>(): FormContext<M> | MaybeFormContext<M> {
  const context = useContext(FormContext) as FormContext<M> | null
  if (context == null) {
    return {form: null, model: null}
  } else {
    return context
  }
}

export interface MaybeFormContext<M extends FormModel> {
  form: FormHandle<M> | null
  model: M | null
}
