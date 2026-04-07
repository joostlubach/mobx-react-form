import { isFunction } from 'lodash'
import { FormEvent, ReactNode } from 'react'
import { PropertiesOf } from 'ytil'
import { FormHandle } from './FormHandle'
import { SubmitResult } from './SubmitResult'

export interface FormModel {
  maySubmit?: boolean
  submit():   Promise<SubmitResult | undefined> | SubmitResult | undefined

  reset?(): void | Promise<void>
  commit?(): void
}

export interface ProxyFormModel<D extends Record<string | number | symbol, any>> extends FormModel {
  getValue: (field: keyof D & string) => unknown
  setValue: (field: keyof D & string, value: any) => void
}

export type FormData<M extends FormModel> =
  M extends ProxyFormModel<infer D> ? D
    : Omit<PropertiesOf<M>, 'submit' | 'reset' | 'commit' | 'maySubmit'>

export type FormDataKey<M extends FormModel> = keyof FormData<M> & string

export function isProxyModel<D extends Record<string | number | symbol, any>>(model: FormModel): model is ProxyFormModel<D> {
  const proxyModel = model as ProxyFormModel<any>
  return isFunction(proxyModel.setValue) && isFunction(proxyModel.getValue)
}

//------
// Submitting

export interface SubmitFunction {
  (options?: SubmitOptions): Promise<SubmitResult | undefined>
  (event: FormEvent, options?: SubmitOptions): Promise<SubmitResult | undefined>
}

export interface SubmitOptions {
  ifModified?: boolean
}

export type ChangeCallback<T> = (value: T) => void
export type CommitCallback = () => void

//------
// Errors

export interface FormError {
  field:    string | null
  code?:    string | null
  params?:  Record<string, unknown> | null
  message?: string | null
}

//------
// Form customization

export type SaveButtonSpec = WellKnownSaveButton | CustomSaveButton

export enum WellKnownSaveButton {
  SAVE,
  NEXT,
}

export interface CustomSaveButton {
  icon?:   ReactNode
  caption: string
}

export interface FormCallbacks<M extends FormModel> {
  beforeSubmit: BeforeSubmitCallback<M>
  afterSubmit: AfterSubmitCallback<M>
}

export type BeforeSubmitCallback<M extends FormModel> = (form: FormHandle<M>) => boolean | Promise<boolean>
export type AfterSubmitCallback<M extends FormModel> = (result: SubmitResult, form: FormHandle<M>) => void | Promise<void>

export interface FormOptions {
  autoSubmit?:     boolean
  resetOnSuccess?: boolean
  assignErrors?:   boolean
}
