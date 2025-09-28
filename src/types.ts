import { isFunction } from 'lodash'
import { SubmitResult } from './SubmitResult'

export interface FormModel {
  maySubmit?: boolean
  submit():   Promise<SubmitResult | undefined> | SubmitResult | undefined

  reset?(): void
}

export interface ProxyFormModel<D extends Record<string | number | symbol, any>> extends FormModel {
  getValue: (field: keyof D) => any
  setValue: (field: keyof D, value: any) => void
}

export type FormData<M extends FormModel> =
  M extends ProxyFormModel<infer D> ? D
    : Omit<{[K in keyof M as M[K] extends (Function | undefined) ? never : K extends string ? K : never]: M[K]}, 'maySubmit'>

export function isProxyModel<D extends Record<string | number | symbol, any>>(model: FormModel): model is ProxyFormModel<D> {
  const proxyModel = model as ProxyFormModel<any>
  return isFunction(proxyModel.setValue) && isFunction(proxyModel.getValue)
}

//------
// Submitting

export interface SubmitFunction {
  (options?: SubmitOptions): Promise<SubmitResult | undefined>
  (event: React.FormEvent, options?: SubmitOptions): Promise<SubmitResult | undefined>
}

export interface SubmitOptions {
  ifModified?: boolean
}

export type ChangeCallback<T> = ((value: T) => void) & ((updater: (prev: T) => T) => void)
export type ChangeCallbackWithPartial<T> = ChangeCallback<T> & {partial?: ChangeCallback<T>}

export function isChangeCallbackWithPartial<T>(callback: ChangeCallback<T> | ChangeCallbackWithPartial<T>): callback is ChangeCallbackWithPartial<T> {
  return isFunction((callback as ChangeCallbackWithPartial<T>).partial)
}

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
  icon?:   React.ReactNode
  caption: string
}