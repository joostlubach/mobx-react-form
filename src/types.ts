import { isFunction } from 'lodash'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface FormModel<D = any> {
  submit(): Promise<SubmitResult | undefined> | SubmitResult | undefined
  reset?(): void
}

export interface ProxyFormModel<D extends {}> extends FormModel<D> {
  getValue: (field: keyof D & string) => any
  assign:   (data: Partial<D>) => any
}

export type FormData<M> =
  M extends FormModel<infer D>
    ? D extends unknown ? Record<string, any> : D
    : Record<string, any>

export type FormDataKey<M extends FormModel> = keyof FormData<M> | string

export function isProxyModel(model: FormModel): model is ProxyFormModel<any> {
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