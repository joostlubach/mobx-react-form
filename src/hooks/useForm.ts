import { FormModel } from 'mobx-react-form'
import * as React from 'react'
import { FormContext } from '../FormContext'

export function useForm<M extends FormModel>() {
  return React.useContext<FormContext<M>>(FormContext)
}
