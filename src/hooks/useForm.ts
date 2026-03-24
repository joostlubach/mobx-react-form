import { useContext } from 'react'
import { FormContext } from '../FormContext'
import { FormHandle } from '../FormHandle'
import { FormModel } from '../types'

export function useForm<M extends FormModel>(): FormHandle<M> {
  const form = useMaybeForm<M>()
  if (form == null) {
    throw new Error('useForm must be used within a Form')
  }
  return form
}

export function useMaybeForm<M extends FormModel>(): FormHandle<M> | undefined {
  return useContext(FormContext) as FormHandle<M> | undefined
}