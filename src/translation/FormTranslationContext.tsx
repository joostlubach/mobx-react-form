import { createContext } from 'react'
import { defaultFormTranslationFunctions } from './defaults'
import { FormTranslationFunctions } from './types'

export const FormTranslationContext = createContext<FormTranslationFunctions>(
  defaultFormTranslationFunctions,
)