import React from 'react'
import {
  FieldChangeCallback,
  FormData,
  FormDataKey,
  FormError,
  FormModel,
  SubmitFunction,
} from './types'

export interface FormContext<M extends FormModel> {
  // Data
  model:      M
  dataSource: any

  setData:       (data: FormData<M>) => void
  getFieldValue: <K extends FormDataKey<M> & string>(field: K) => FormData<M>[K]
  onChangeFor:   <K extends FormDataKey<M> & string>(field: K) => FieldChangeCallback<FormData<M>[K]>

  // Invalidation
  invalid:     boolean
  errors:      FormError[]
  isInvalid:   (field: FormDataKey<M>) => boolean
  errorsFor:   (field: FormDataKey<M>, includeChildren?: boolean) => FormError[]
  addError:    (error: FormError) => void
  clearErrors: () => void

  // Modified
  modified:    boolean
  setModified: (modified: boolean) => void

  // Submission
  submit:     SubmitFunction
  submitting: boolean
  commit:     () => any
  reset:      () => any
}

export const FormContext = React.createContext<FormContext<any>>({
  model:         {},
  dataSource:    {},

  setData:       () => void 0,
  getFieldValue: () => null,
  onChangeFor:   () => emptyFieldChangeCallback,

  // Invalidation
  invalid:     false,
  errors:      [],
  isInvalid:   () => false,
  errorsFor:   () => [],
  addError:    () => void 0,
  clearErrors: () => void 0,

  // Modified
  modified:    false,
  setModified: () => void 0,

  // Submission
  submit:     () => Promise.resolve(void 0),
  submitting: false,
  commit:     () => void 0,
  reset:      () => void 0,
})

const emptyFieldChangeCallback = (() => void 0) as any as FieldChangeCallback<any>
emptyFieldChangeCallback.partial = () => void 0

//------
// FormContainer

export function FormContainer(props: FormContainerProps) {
  return (
    <FormContext.Provider value={props.form}>
      {props.children}
    </FormContext.Provider>
  )
}

export interface FormContainerProps {
  form:      FormContext<any>
  children?: React.ReactNode
}

//------
// Hook

export function useForm<M extends FormModel>() {
  return React.useContext<FormContext<M>>(FormContext)
}