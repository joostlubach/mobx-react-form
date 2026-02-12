import { useContext } from 'react'
import { FormContext, FormInstance } from '../Form'
import { FormModel } from '../types'

export function useForm<M extends FormModel>(): FormInstance<M> {
  const form = useContext(FormContext) as FormInstance<M>
  if (form == null) {
    throw new Error('useForm must be used within a Form')
  }
  return form
}