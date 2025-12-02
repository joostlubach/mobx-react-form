import { superConstructor } from 'ytil'
import { SubmitResult } from './SubmitResult'

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
export function translateFormModelErrorPaths(result: undefined, formModel: object): undefined
export function translateFormModelErrorPaths(result: SubmitResult | undefined, formModel: object): SubmitResult | undefined
export function translateFormModelErrorPaths(result: SubmitResult | undefined, formModel: object) {
  const pathMap = getFormModelErrorPathMap(formModel.constructor)

  return translateFormErrorPaths(result, path => {
    return pathMap?.[path] ?? path
  })
}

export function formErrorPath(path: string) {
  return function<T, V>(_value: undefined, context: ClassFieldDecoratorContext<T, V>): void {
    if (typeof context.name !== 'string') { return }

    context.addInitializer(function(this: any) {
      const formModel = this.constructor
      let pathMap = formModelErrorPaths.get(formModel)
      if (pathMap == null) {
        formModelErrorPaths.set(formModel, pathMap = {})
      }

      pathMap[path] = context.name as string
    })
  }
}