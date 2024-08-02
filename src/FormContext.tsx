import { isFunction, isObject, some } from 'lodash'
import React from 'react'
import { useTimer } from 'react-timer'
import { forwardRef } from 'react-util'
import { assignRef, releaseRef, useContinuousRef } from 'react-util/hooks'
import { FormTranslationFunctions, FormTranslationProvider } from './FormTranslationContext'
import { translateFormModelErrorPaths } from './errors'
import { useFormDataSource } from './hooks'
import {
  FieldChangeCallback,
  FormData,
  FormError,
  FormModel,
  isSuccessResult,
  SubmitFunction,
  SubmitOptions,
  SubmitResult,
} from './types'

export interface FormContext<M extends FormModel> {
  // Data
  model:      M
  dataSource: any

  setData:       (data: FormData<M>) => void
  getFieldValue: <K extends keyof FormData<M>>(field: K) => FormData<M>[K]
  onChangeFor:   <K extends keyof FormData<M>>(field: K) => FieldChangeCallback<FormData<M>[K]>

  // Invalidation
  invalid:     boolean
  errors:      FormError[]
  isInvalid:   (field: keyof FormData<M>) => boolean
  errorsFor:   (field: keyof FormData<M>, includeChildren?: boolean) => FormError[]
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
  model:      {},
  dataSource: {},

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

//------
// FormProvider]

export interface FormProviderProps<M extends FormModel> {
  model:           M
  initialData?:    FormData<M>
  autoSubmit?:     boolean
  resetOnSuccess?: boolean

  translation?: FormTranslationFunctions

  beforeSubmit?: (model: M) => boolean | undefined
  afterSubmit?:  (result: SubmitResult, model: M) => any

  children?: React.ReactNode | ((form: FormContext<M>) => React.ReactNode)
}

export const FormProvider = forwardRef('FormProvider', <M extends FormModel>(props: FormProviderProps<M>, ref: React.Ref<FormContext<M>>) => {

  const {
    model,
    initialData,
    resetOnSuccess = false,
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

  const errorsFor = React.useCallback((field: keyof FormData<M>, includeChildren: boolean = false) => {
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
    submitting,
    commit,
    reset,
  }), [addError, clearErrors, commit, errors, errorsFor, getFieldValue, invalid, isInvalid, model, modified, onChangeFor, reset, setData, setModified, submit, submitting])

  React.useEffect(() => {
    if (ref == null) { return }
    assignRef(ref, context)
    return () => { releaseRef(ref, context) }
  }, [context, ref])

  function render() {
    return (
      <FormContext.Provider value={context}>
        {translation != null ? (
          <FormTranslationProvider translation={translation}>
            {renderChildren()}
          </FormTranslationProvider>
        ) : (
          renderChildren()
        )}
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

const emptyFieldChangeCallback = (() => void 0) as any as FieldChangeCallback<any>
emptyFieldChangeCallback.partial = () => void 0