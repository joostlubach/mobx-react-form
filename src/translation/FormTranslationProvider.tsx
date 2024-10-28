import React from 'react'
import { memo } from 'react-util'
import { FormTranslationContext } from './FormTranslationContext'
import { FormTranslationFunctions } from './types'

export interface FormTranslationProviderProps {
  translation: FormTranslationFunctions
  children?:   React.ReactNode
}

export const FormTranslationProvider = memo('FormTranslationProvider', (props: FormTranslationProviderProps) => {

  const {
    translation,
    children,
  } = props

  return (
    <FormTranslationContext.Provider value={translation}>
      {children}
    </FormTranslationContext.Provider>
  )

})