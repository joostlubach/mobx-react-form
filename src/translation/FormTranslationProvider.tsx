import React from 'react'
import { memo } from 'react-util'
import { FormTranslationContext } from './FormTranslationContext'
import { FormTranslationFunctions } from './types'

export interface FormTranslationProviderProps {
  translation?: FormTranslationFunctions | null
  children?:    React.ReactNode
}

export const FormTranslationProvider = memo('FormTranslationProvider', (props: FormTranslationProviderProps) => {

  const {
    translation,
    children,
  } = props

  if (translation != null) {
    return (
      <FormTranslationContext.Provider value={translation}>
        {children}
      </FormTranslationContext.Provider>
    )
  } else {
    return <>{children}</>
  }

})