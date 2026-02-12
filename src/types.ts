import { isFunction } from 'lodash'
import { FormEvent, ReactNode } from 'react'
import { PropertiesOf } from 'ytil'
import { SubmitResult } from './SubmitResult'

export interface FormModel {
  maySubmit?: boolean
  submit():   Promise<SubmitResult | undefined> | SubmitResult | undefined

  reset?(): void
  commit?(): void
}

export interface ProxyFormModel<D extends Record<string | number | symbol, any>> extends FormModel {
  getValue: (field: keyof D) => unknown
  setValue: (field: keyof D, value: any) => void
}

export type FormData<M extends FormModel> =
  M extends ProxyFormModel<infer D> ? D
    : Omit<PropertiesOf<M>, 'submit' | 'reset' | 'commit' | 'maySubmit'>

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

export type BeforeSubmitCallback<M extends FormModel> = (model: M) => boolean
export type AfterSubmitCallback<M extends FormModel> = (result: SubmitResult, model: M) => void
