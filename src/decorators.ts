import { observable } from 'mobx'
import { FormModel } from './types'

export function field() {
  return (target: ClassAccessorDecoratorTarget<FormModel, unknown>, context: ClassAccessorDecoratorContext<FormModel, unknown>) => {
    if (typeof context.name !== 'string') { return }

    const result = observable(target, context)
    const name = context.name

    context.addInitializer(function (this: FormModel) {
      const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), name)
      if (desc) {
        Object.defineProperty(this, name, {...desc, enumerable: true})
      }
    })

    return result
  }
}
