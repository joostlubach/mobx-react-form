import { observable } from 'mobx'
import { AnyConstructor } from 'ytil'
import { FieldPersistence, registerPersistedField } from './persistence'
import { FormModel } from './types'

export function field(options: FieldOptions = {}) {
  const {
    persist = true,
  } = options

  return (target: ClassAccessorDecoratorTarget<FormModel, unknown>, context: ClassAccessorDecoratorContext<FormModel, unknown>) => {
    if (typeof context.name !== 'string') { return }

    const result = observable(target, context)
    const name = context.name

    context.addInitializer(function (this: FormModel) {
      const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), name)
      const ctor = this.constructor as AnyConstructor
      if (desc) {
        Object.defineProperty(this, name, {...desc, enumerable: true})
      }

      if (persist !== false) {
        registerPersistedField(ctor, name, persist === true ? undefined : persist)
      }
    })

    return result
  }
}

export interface FieldOptions {
  persist?: boolean | FieldPersistence<any>
}
