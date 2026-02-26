import { useContext } from 'react'
import { FormContext } from '../FormContext'
import { FormModel } from '../types'

export function useForm<M extends FormModel>(): FormContext<M> {
  const form = useMaybeForm<M>()
  if (form == null) {
    throw new Error('useForm must be used within a Form')
  }
  return form
}

export function useMaybeForm<M extends FormModel>(): FormContext<M> | undefined {
  return useContext(FormContext) as FormContext<M> | undefined
}