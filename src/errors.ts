import { superConstructor } from 'ytil'

import { SubmitResult } from './types'

export function translateFormErrorPaths(result: SubmitResult, translate: (path: string) => string): SubmitResult
export function translateFormErrorPaths(result: SubmitResult | undefined, translate: (path: string) => string): SubmitResult | undefined
export function translateFormErrorPaths(result: SubmitResult | undefined, translate: (path: string) => string): SubmitResult | undefined {
  if (result?.status !== 'invalid') { return result }

  return {
    ...result,
    errors: result.errors.map(error => ({...error, field: error.field == null ? null : translate(error.field)})),
  }
}

const formModelErrorPaths = new WeakMap<object, Record<string, string>>()

function getFormModelErrorPathMap(ctor: any): Record<string, string> {
  const superCtor = superConstructor(ctor)
  if (superCtor == null) {
    return {...formModelErrorPaths.get(ctor)}
  } else {
    return {
      ...getFormModelErrorPathMap(superCtor),
      ...formModelErrorPaths.get(ctor),
    }
  }
}

export function translateFormModelErrorPaths(result: SubmitResult, formModel: object): SubmitResult
export function translateFormModelErrorPaths(result: SubmitResult | undefined, formModel: object): SubmitResult | undefined
export function translateFormModelErrorPaths(result: SubmitResult | undefined, formModel: object) {
  const pathMap = getFormModelErrorPathMap(formModel.constructor)

  return translateFormErrorPaths(result, path => {
    return pathMap?.[path] ?? path
  })
}

export const formErrorPath = (path: string): PropertyDecorator => {
  return (target, key) => {
    if (typeof key !== 'string') { return }

    const formModel = target as object
    let pathMap = formModelErrorPaths.get(formModel.constructor)
    if (pathMap == null) {
      formModelErrorPaths.set(formModel.constructor, pathMap = {})
    }

    pathMap[path] = key
  }
}