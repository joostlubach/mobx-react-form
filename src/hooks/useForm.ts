import * as React from 'react'

import { FormContext } from '../FormContext'
import { FormModel } from '../types'

export function useForm<M extends FormModel>() {
  return React.useContext<FormContext<M>>(FormContext)
}
