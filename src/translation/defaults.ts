import { startCase, upperFirst } from 'lodash'
import { FormTranslationFunctions } from './types'

export const defaultFormTranslationFunctions: FormTranslationFunctions = (() => {
  function defaultCaption(name: string) {
    return upperFirst(name.replace(/[^a-z]/gi, ' '))
  }

  return {
    field:            name => ({caption: defaultCaption(name)}),
    fieldCaption:     name => upperFirst(startCase(name).toLowerCase()),
    fieldPrompt:      name => upperFirst(startCase(name).toLowerCase()),
    fieldLabel:       () => null,
    fieldPlaceholder: () => null,
    fieldInstruction: () => null,
    fieldError:       () => null,
  }
})()