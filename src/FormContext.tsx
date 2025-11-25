/* eslint-disable react-refresh/only-export-components */

import { isFunction, isObject, some } from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { useTimer } from 'react-timer'
import { assignRef, releaseRef, useContinuousRef } from 'react-util/hooks'
import { SubmitResult } from './SubmitResult'
import { translateFormModelErrorPaths } from './errors'
import { useFormDataSource } from './hooks'
import { FormTranslationFunctions, FormTranslationProvider } from './translation'
import {
  ChangeCallbackWithPartial,
  FormData,
  FormError,
  FormModel,
  SubmitFunction,
  SubmitOptions,
} from './types'

export interface FormContext<M extends FormModel> {
  // Data
  model:      M
  dataSource: any

  setData:       (data: FormData<M>) => void
  getFieldValue: <K extends keyof FormData<M>>(field: K) => FormData<M>[K]
  onChangeFor:   <K extends keyof FormData<M>>(field: K) => ChangeCallbackWithPartial<FormData<M>[K]>

  // Invalidation
  invalid:     boolean
  errors:      FormError[]
  isInvalid:   (field: keyof FormData<M>) => boolean
  errorsFor:   (field: keyof FormData<M> | null, includeChildren?: boolean) => FormError[]
  addError:    (error: FormError) => void
  clearErrors: () => void

  // Modified
  modified:    boolean
  setModified: (modified: boolean) => void

  // Submission
  submit:     SubmitFunction
  submitting: boolean
  maySubmit:  boolean
  commit:     () => any
  reset:      () => any
}

export const FormContext = React.createContext<FormContext<any>>({
  model:      {},
  dataSource: {},

  setData:       () => void 0,
  getFieldValue: () => null,
  onChangeFor:   () => emptyChangeCallback,

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
  maySubmit:  false,
  submitting: false,
  commit:     () => void 0,
  reset:      () => void 0,
})

//------
// FormProvider]

export interface FormProviderProps<M extends FormModel> {
  model:           M
  initialData?:    FormData<M>
  autoSubmit?:     boolean
  resetOnSuccess?: boolean

  translation?: FormTranslationFunctions
  formRef?:     React.Ref<FormContext<M> | null>

  beforeSubmit?: (model: M) => boolean | undefined
  afterSubmit?:  AfterSubmitCallback<M>

  children?: React.ReactNode | ((form: FormContext<M>) => React.ReactNode)
}
export type AfterSubmitCallback<M extends FormModel> = (result: SubmitResult, model: M) => any


export const FormProvider = observer(<M extends FormModel>(props: FormProviderProps<M>) => {

  const {
    model,
    initialData,
    resetOnSuccess = false,
    formRef,
    autoSubmit,
    beforeSubmit,
    afterSubmit,
    translation,
    children,
  } = props

  const [modified, setModifiedState] = React.useState<boolean>(false)
  const [errors, setErrorsState] = React.useState<FormError[]>([])
  const [submitting, setSubmitting] = React.useState<boolean>(false)

  const modifiedRef = React.useRef<boolean>(false)
  const initialDataRef = useContinuousRef(initialData)

  const setModified = React.useCallback((value: boolean) => {
    if (value === modifiedRef.current) { return }
    setModifiedState(modifiedRef.current = value)
  }, [])

  //------
  // Invalidation

  const invalid = errors.length > 0

  const isInvalid = React.useCallback(
    (field: keyof FormData<M>) => some(errors, error => error.field === field),
    [errors],
  )

  const errorsFor = React.useCallback((field: keyof FormData<M> | null, includeChildren: boolean = false) => {
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

  const clearErrors = React.useCallback((field?: keyof FormData<M>) => {
    if (field == null) {
      setErrorsState(errorsRef.current = [])
    } else {
      setErrorsState(errorsRef.current = errorsRef.current.filter(error => error.field !== field))
    }
  }, [])

  //------
  // Submission

  const timer = useTimer()

  const maySubmit = (model.maySubmit ?? true) && !submitting
  const submit = React.useCallback(async (...args: any[]): Promise<SubmitResult | undefined> => {
    const event = isFormEvent(args[0]) ? args.shift() as React.FormEvent : null
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

      if (timer.isEnabled) {
        if (SubmitResult.isOk(result)) {
          setModified(false)
        } else if (SubmitResult.isInvalid(result)) {
          setErrorsState(errorsRef.current = result.errors)
        }
      }

      const callback = isFunction(afterSubmit) ? afterSubmit : afterSubmit?.[result.status]
      callback?.(result, model)

      if (SubmitResult.isOk(result) && resetOnSuccess) {
        model.reset?.()
      }

      return result
    } finally {
      if (timer.isEnabled) {
        setSubmitting(false)
      }
    }
  }, [modified, beforeSubmit, model, clearErrors, timer.isEnabled, afterSubmit, resetOnSuccess, setModified])

  //------
  // Data & errors ref

  const commit = React.useCallback(() => {
    if (autoSubmit && modifiedRef.current) {
      submit()
    }
  }, [modifiedRef, autoSubmit, submit])

  const {getFieldValue, setData, onChangeFor} = useFormDataSource<M>(
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

  const context = React.useMemo((): FormContext<M> => ({
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
    maySubmit,
    submitting,
    commit,
    reset,
  }), [addError, clearErrors, commit, errors, errorsFor, getFieldValue, invalid, isInvalid, maySubmit, model, modified, onChangeFor, reset, setData, setModified, submit, submitting])

  React.useEffect(() => {
    if (formRef == null) { return }
    assignRef(formRef, context)
    return () => { releaseRef(formRef, context) }
  }, [context, formRef])

  function render() {
    return (
      <FormContext.Provider value={context}>
        <FormTranslationProvider translation={translation}>
          {renderChildren()}
        </FormTranslationProvider>
      </FormContext.Provider>
    )
  }

  function renderChildren() {
    return isFunction(children) ? children(context) : children
  }

  return render()


})

//------
// Helpers

function isFormEvent(arg: any): arg is React.FormEvent {
  if (!isObject(arg)) { return false }
  return (arg as React.FormEvent).nativeEvent instanceof Event
}

const emptyChangeCallback = (() => void 0) as any as ChangeCallbackWithPartial<any>
emptyChangeCallback.partial = () => void 0