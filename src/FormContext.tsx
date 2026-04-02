import { observer } from 'mobx-react'
import React, { createContext, ReactNode, Ref, useEffect, useMemo } from 'react'
import { assignRef, releaseRef } from 'react-util/hooks'
import { FormHandle } from './FormHandle'
import { FormCallbacks, FormData, FormDataKey, FormError, FormModel, FormOptions } from './types'

export interface FormState<M extends FormModel> {
  getFieldValue: <K extends FormDataKey<M>>(field: K) => FormData<M>[K]
  onChangeFor:   <K extends FormDataKey<M>>(field: K) => (value: FormData<M>[K]) => void
  onCommit:      () => void
  
  errors:      FormError[]
  isInvalid:   (field: FormDataKey<M>) => boolean
  errorsFor:   (field: FormDataKey<M> | null, includeChildren?: boolean) => FormError[]
  
  modified:    boolean
  submitting: boolean
}

export interface FormProviderProps<M extends FormModel> extends Partial<FormCallbacks<M>>, FormOptions {
  model: M
  formRef?: Ref<FormHandle<M> | null>
  children?: ReactNode | ((form: FormHandle<M>) => ReactNode)
}

export const FormProvider = observer(<M extends FormModel>(props: FormProviderProps<M>) => {

  const {
    model,
    formRef,
    children,

    beforeSubmit,
    afterSubmit,
    
    autoSubmit,
    resetOnSuccess,
  } = props

  const form = useMemo(
    () => new FormHandle<M>({autoSubmit, resetOnSuccess}),
    [autoSubmit, resetOnSuccess],
  )
  form.setModel(model)
  
  useEffect(() => {
    if (beforeSubmit == null) { return }
    return form.onBeforeSubmit(beforeSubmit)
  }, [beforeSubmit, form])

  useEffect(() => {
    if (afterSubmit == null) { return }
    return form.onAfterSubmit(afterSubmit)
  }, [afterSubmit, form])

  useEffect(() => {
    if (formRef == null) { return }
    assignRef(formRef, form)
    return () => { releaseRef(formRef, form ) }
  }, [form, formRef])

  useEffect(() => {
    form.reset()
  }, [form])

  const contextValue = useMemo(() => ({form, model}), [form, model])
  return (
    <FormContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(form) : children}
    </FormContext.Provider>
  )
})

export interface FormContext<M extends FormModel> {
  form: FormHandle<M>
  model: M
}

export const FormContext = createContext<FormContext<any> | null>(null)