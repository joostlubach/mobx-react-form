import React from 'react'
import { useTimer } from 'react-timer'
import { useContinuousRef } from 'react-util/hooks/refs'
import { isObject, some } from 'lodash'
import { translateFormModelErrorPaths } from '../errors'
import { FormContext } from '../FormContext'
import {
  FormData,
  FormDataKey,
  FormError,
  FormModel,
  isSuccessResult,
  SubmitOptions,
  SubmitResult,
} from '../types'
import { useFormDataSource } from './useFormDataSource'

//------
// useForm hook

export function useFormContainer<M extends FormModel>(options: FormContainerHookOptions<M>): FormContext<M> {

  const {model} = options
  const [modified, setModifiedState] = React.useState<boolean>(false)
  const [errors, setErrorsState]     = React.useState<FormError[]>([])
  const [submitting, setSubmitting]  = React.useState<boolean>(false)

  const modifiedRef    = React.useRef<boolean>(false)
  const initialDataRef = useContinuousRef(options.initialData)
  const resetOnSuccess = options.resetOnSuccess ?? false

  const setModified = React.useCallback((value: boolean) => {
    if (value === modifiedRef.current) { return }
    setModifiedState(modifiedRef.current = value)
  }, [])

  //------
  // Invalidation

  const invalid = errors.length > 0

  const isInvalid = React.useCallback(
    (field: FormDataKey<M>) => some(errors, error => error.field === field),
    [errors],
  )

  const errorsFor = React.useCallback((field: FormDataKey<M>, includeChildren: boolean = false) => {
    return errors.filter(error => {
      if (error.field === field) { return true }
      if (includeChildren && error.field?.startsWith(`${String(field)}.`)) { return true }
      return false
    })
  }, [errors])

  const errorsRef = React.useRef<FormError[]>(errors)
  const addError = React.useCallback((error: FormError) => {
    const newErrors = [
      ...errorsRef.current,
      error,
    ]
    setErrorsState(errorsRef.current = newErrors)
  }, [])

  const clearErrors = React.useCallback((field?: FormDataKey<M>) => {
    if (field == null) {
      setErrorsState(errorsRef.current = [])
    } else {
      setErrorsState(errorsRef.current = errorsRef.current.filter(error => error.field !== field))
    }
  }, [])

  //------
  // Submission

  const timer = useTimer()

  const {beforeSubmit, afterSubmit} = options
  const submit = React.useCallback(async (...args: any[]): Promise<SubmitResult | undefined> => {
    const event   = isFormEvent(args[0]) ? args.shift() as React.FormEvent : null
    const options = args.shift() ?? {} as SubmitOptions

    event?.preventDefault()
    event?.stopPropagation()

    if (options.ifModified && !modified) {
      return Promise.resolve(undefined)
    }

    if (beforeSubmit?.(model) === false) {
      return Promise.resolve(undefined)
    }

    setSubmitting(true)
    clearErrors()

    try {
      let result = await model.submit()
      if (result == null) { return }

      // Let the model allow some error path translations.
      result = translateFormModelErrorPaths(result, model)

      if (!timer.isDisposed) {
        if (isSuccessResult(result)) {
          setModified(false)
        } else if (result.status === 'invalid') {
          setErrorsState(errorsRef.current = result.errors)
        }
      }
      afterSubmit?.(result, model)

      if (isSuccessResult(result) && resetOnSuccess) {
        model.reset?.()
      }

      return result
    } finally {
      if (!timer.isDisposed) {
        setSubmitting(false)
      }
    }
  }, [modified, beforeSubmit, model, clearErrors, timer.isDisposed, afterSubmit, resetOnSuccess, setModified])

  //------
  // Data & errors ref

  const commit = React.useCallback(() => {
    if (options.autoSubmit && modifiedRef.current) {
      submit()
    }
  }, [modifiedRef, options.autoSubmit, submit])

  const {getFieldValue, setData, onChangeFor} = useFormDataSource(
    model,
    {
      modified,
      setModified,
      commit,
    },
  )

  const reset = React.useCallback(() => {
    model.reset?.()

    if (initialDataRef.current != null) {
      setData(initialDataRef.current)
    }

    clearErrors()
    setModified(false)
  }, [clearErrors, initialDataRef, model, setData, setModified])

  React.useEffect(() => {
    reset()
  }, [reset])

  return {
    model,
    dataSource: model,
    setData,
    getFieldValue,
    onChangeFor,

    invalid,
    errors,
    isInvalid,
    errorsFor,
    addError,
    clearErrors,

    modified,
    setModified,

    submit,
    submitting,
    commit,
    reset,
  }

}

function isFormEvent(arg: any): arg is React.FormEvent {
  if (!isObject(arg)) { return false }
  return (arg as React.FormEvent).nativeEvent instanceof Event
}

export interface FormContainerHookOptions<M extends FormModel> {
  model:           M
  initialData?:    FormData<M>
  autoSubmit?:     boolean
  resetOnSuccess?: boolean

  beforeSubmit?: (model: M) => boolean | undefined
  afterSubmit?:  (result: SubmitResult, model: M) => any
}