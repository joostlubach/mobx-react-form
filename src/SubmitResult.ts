import { FormError } from './types'

export type SubmitResult<D = any, M = any> =
  | SubmitOk<D, M>
  | SubmitInvalid
  | SubmitHttpError
  | SubmitError

export interface SubmitOk<D = any, M = any> {
  status: 'ok'
  data:   D
  meta?:  M
}

export interface SubmitInvalid {
  status: 'invalid'
  errors: FormError[]
}

export interface SubmitHttpError {
  status: number
  message: string
}

export interface SubmitError {
  status: 'error'
  error:  Error
}

export namespace SubmitResult {

  export function ok<D>(): SubmitOk<void>
  export function ok<D>(data: D): SubmitOk<D>
  export function ok<D, M>(data: D, meta: M): SubmitOk<D, M>
  export function ok<D, M>(data?: D, meta?: M): SubmitOk<D, M> {
    return {
      status: 'ok',
      data:   data as D,
      meta:   meta as M,
    }
  }

  export function invalid(errors: FormError[]): SubmitInvalid {
    return {
      status: 'invalid',
      errors,
    }
  }

  export function httpError(status: number, message: string): SubmitHttpError {
    return {
      status,
      message,
    }
  }

  export function error(error: Error): SubmitError {
    return {
      status: 'error',
      error,
    }
  }

  export function isOk(result: SubmitResult): result is SubmitOk {
    return result.status === 'ok'
  }

  export function isInvalid(result: SubmitResult): result is SubmitInvalid {
    return result.status === 'invalid'
  }

}