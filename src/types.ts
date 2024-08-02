import { isFunction } from 'lodash'

export interface FormModel {
  submit(): Promise<SubmitResult | undefined> | SubmitResult | undefined
  reset?(): void
}

export interface ProxyFormModel<D extends Record<string | number | symbol, any>> extends FormModel {
  getValue: (field: keyof D) => any
  assign:   (data: Partial<D>) => any
}

export type FormData<M extends FormModel> =
  M extends ProxyFormModel<infer D> ? D
    : {[K in keyof M as M[K] extends (Function | undefined) ? never : K extends string ? K : never]: M[K]}

function test<M extends FormModel>(key: keyof FormData<M>) {
  if (key === 1) { return }
}

export function isProxyModel<D extends Record<string | number | symbol, any>>(model: FormModel): model is ProxyFormModel<D> {
  const proxyModel = model as ProxyFormModel<any>
  return isFunction(proxyModel.assign) && isFunction(proxyModel.getValue)
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

export type SubmitResult<D = any, M = any> =
  | SubmitSuccess<D, M>
  | SubmitInvalid
  | SubmitError

export interface SubmitSuccess<D = any, M = any> {
  status: 'ok'
  data?:  D
  meta?:  M
}

export interface SubmitInvalid {
  status: 'invalid'
  errors: FormError[]
}

export interface FormError {
  field:    string | null
  code?:    string | null
  message?: string | null
}

export interface SubmitError {
  status: 'error'
  error:  Error
}

export function isSuccessResult(result: SubmitResult | undefined): result is SubmitSuccess {
  return result?.status === 'ok'
}

export function isInvalidResult(result: SubmitResult | undefined): result is SubmitInvalid {
  return result?.status === 'invalid'
}

export type ChangeCallback<T> = (value: T) => any
export type FieldChangeCallback<T> = ChangeCallback<T> & {partial: ChangeCallback<T>}

export function isFieldChangeCallback<T>(callback: ChangeCallback<T> | FieldChangeCallback<T>): callback is FieldChangeCallback<T> {
  return isFunction((callback as FieldChangeCallback<T>).partial)
}

//------
// Form customization

export type SubmitButtonSpec = WellKnownSubmitButton | CustomSubmitButton

export enum WellKnownSubmitButton {
  SAVE,
  NEXT,
}

export interface CustomSubmitButton {
  icon?:   React.ReactNode
  caption: string
}