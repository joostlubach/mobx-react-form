import { isFunction, isObject, some } from 'lodash'
import { observer } from 'mobx-react'
import React, {
  createContext,
  FormEvent,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTimer } from 'react-timer'
import { assignRef, releaseRef } from 'react-util/hooks'
import { SubmitResult } from './SubmitResult'
import { translateFormModelErrorPaths } from './errors'
import { useFormDataSource } from './hooks/useFormDataSource'
import {
  AfterSubmitCallback,
  BeforeSubmitCallback,
  ChangeCallback,
  FormData,
  FormError,
  FormModel,
  SubmitOptions,
} from './types'

export interface FormInstance<M extends FormModel> {
  // Data
  model:      M
  dataSource: any

  setData:       (data: FormData<M>) => void
  getFieldValue: <K extends keyof FormData<M>>(field: K) => FormData<M>[K]
  onChangeFor:   <K extends keyof FormData<M>>(field: K) => ChangeCallback<FormData<M>[K]>
  onCommit:      () => void

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

  // Listeners
  onAfterSubmit: (callback: AfterSubmitCallback<M>) => void
  onBeforeSubmit: (callback: BeforeSubmitCallback<M>) => void

  // Submission
  submit:     (event?: FormEvent) => Promise<SubmitResult | undefined>
  submitting: boolean
  maySubmit:  boolean
  commit:     () => void
  reset:      () => void
}

export interface FormProviderProps<M extends FormModel> {
  model: M

  beforeSubmit?: BeforeSubmitCallback<M>
  afterSubmit?: AfterSubmitCallback<M>

  autoSubmit?:     boolean
  resetOnSuccess?: boolean

  formRef?:        Ref<FormInstance<M> | null>
  children?:       ReactNode | ((form: FormInstance<M>) => ReactNode)
}

export const FormProvider = observer(<M extends FormModel>(props: FormProviderProps<M>) => {
  const {
    model,
    beforeSubmit: props_beforeSubmit,
    afterSubmit: props_afterSubmit,
    resetOnSuccess = false,
    autoSubmit = false,
    formRef,
    children,
    ...downstream
  } = props

  const [modified, setModifiedState] = useState<boolean>(false)
  const [errors, setErrorsState] = useState<FormError[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)

  const modifiedRef = useRef<boolean>(false)

  const setModified = useCallback((value: boolean) => {
    if (value === modifiedRef.current) { return }
    setModifiedState(modifiedRef.current = value)
  }, [])


  //------
  // Invalidation

  const invalid = errors.length > 0

  const isInvalid = useCallback(
    (field: keyof FormData<M>) => some(errors, error => error.field === field),
    [errors],
  )

  const errorsFor = useCallback((field: keyof FormData<M> | null, includeChildren: boolean = false) => {
    return errors.filter(error => {
      if (error.field === field) { return true }
      if (includeChildren && error.field?.startsWith(`${String(field)}.`)) { return true }
      return false
    })
  }, [errors])

  const errorsRef = useRef<FormError[]>(errors)
  const addError = useCallback((error: FormError) => {
    const newErrors = [
      ...errorsRef.current,
      error,
    ]
    setErrorsState(errorsRef.current = newErrors)
  }, [])

  const clearErrors = useCallback((field?: keyof FormData<M>) => {
    if (field == null) {
      setErrorsState(errorsRef.current = [])
    } else {
      setErrorsState(errorsRef.current = errorsRef.current.filter(error => error.field !== field))
    }
  }, [])

  // #region Listeners

  const beforeSubmitListenersRef = useRef<Set<BeforeSubmitCallback<M>>>(new Set())
  const afterSubmitListenersRef = useRef<Set<AfterSubmitCallback<M>>>(new Set())

  const beforeSubmit = useCallback((model: M) => {
    for (const listener of beforeSubmitListenersRef.current) {
      if (listener(model) === false) {
        return false
      }
    } 
    return props_beforeSubmit?.(model) ?? true
  }, [props_beforeSubmit])

  const afterSubmit = useCallback((result: SubmitResult, model: M) => {
    for (const listener of afterSubmitListenersRef.current) {
      listener(result, model)
    }
    props_afterSubmit?.(result, model)
  }, [props_afterSubmit])
  
  const onBeforeSubmit = useCallback((callback: BeforeSubmitCallback<M>) => {
    beforeSubmitListenersRef.current.add(callback)
    return () => { beforeSubmitListenersRef.current.delete(callback) }
  }, [])

  const onAfterSubmit = useCallback((callback: AfterSubmitCallback<M>) => {
    afterSubmitListenersRef.current.add(callback)
    return () => { afterSubmitListenersRef.current.delete(callback) }
  }, [])

  // #endregion

  //------
  // Submission

  const timer = useTimer()

  const maySubmit = (model.maySubmit ?? true) && !submitting
  const submit = useCallback(async (...args: any[]): Promise<SubmitResult | undefined> => {
    const event = isFormEvent(args[0]) ? args.shift() as FormEvent : null
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

  const commit = useCallback(() => {
    model.commit?.()
    if (autoSubmit) {
      submit()
    }
  }, [autoSubmit, model, submit])

  const {getFieldValue, setData, onChangeFor, onCommit} = useFormDataSource<M>(
    model,
    {
      modified,
      setModified,
      commit,
    },
  )

  const reset = useCallback(() => {
    model.reset?.()
    clearErrors()
    setModified(false)
  }, [clearErrors, model, setModified])

  useEffect(() => {
    reset()
  }, [reset])

  const formHandle = useMemo((): FormInstance<M> => ({
    model,
    dataSource: model,
    setData,
    getFieldValue,
    onChangeFor,
    onCommit,

    invalid,
    errors,
    isInvalid,
    errorsFor,
    addError,
    clearErrors,

    modified,
    setModified,

    onBeforeSubmit,
    onAfterSubmit,

    submit,
    maySubmit,
    submitting,
    commit,
    reset,
  }), [addError, clearErrors, commit, errors, errorsFor, getFieldValue, invalid, isInvalid, maySubmit, model, modified, onAfterSubmit, onBeforeSubmit, onChangeFor, onCommit, reset, setData, setModified, submit, submitting])

  useEffect(() => {
    if (formRef == null) { return }
    assignRef(formRef, formHandle)
    return () => { releaseRef(formRef, formHandle) }
  }, [formHandle, formRef])

  return (
    <FormContext.Provider value={formHandle}>
      {typeof children === 'function' ? children(formHandle) : children}
    </FormContext.Provider>
  )
})

export const FormContext = createContext<FormInstance<any> | null>(null)

function isFormEvent(arg: any): arg is FormEvent {
  if (!isObject(arg)) { return false }
  return (arg as FormEvent).nativeEvent instanceof Event
}
