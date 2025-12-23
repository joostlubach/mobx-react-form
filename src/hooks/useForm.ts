import { useContext } from 'react'
import { FormContext } from '../FormContext'
import { FormModel } from '../types'

export function useForm<M extends FormModel>() {
  return useContext<FormContext<M>>(FormContext)
}
