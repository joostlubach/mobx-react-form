import React from 'react'
import { defaultFormTranslationFunctions } from './defaults'
import { FormTranslationFunctions } from './types'

export const FormTranslationContext = React.createContext<FormTranslationFunctions>(
  defaultFormTranslationFunctions
)