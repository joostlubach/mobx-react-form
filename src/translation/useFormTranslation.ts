import { useContext } from 'react'
import { FormTranslationContext } from './FormTranslationContext'

export function useFormTranslation() {
  return useContext(FormTranslationContext)
}