import * as React from 'react'
import { FormTranslationContext } from './FormTranslationContext'

export function useFormTranslation() {
  return React.useContext(FormTranslationContext)
}