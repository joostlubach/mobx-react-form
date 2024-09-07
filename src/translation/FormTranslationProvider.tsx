import React from 'react'
import { memo } from 'react-util'
import { FormTranslationContext } from './FormTranslationContext'
import { defaultFormTranslationFunctions } from './defaults'
import { FormTranslationFunctions } from './types'

export interface FormTranslationProviderProps {
  translation?: FormTranslationFunctions
  children?:    React.ReactNode
}

export const FormTranslationProvider = memo('FormTranslationProvider', (props: FormTranslationProviderProps) => {

  const {
    translation,
    children,
  } = props

  const context = React.useMemo((): FormTranslationFunctions => ({
    ...defaultFormTranslationFunctions,
    ...translation,
  }), [translation])

  return (
    <FormTranslationContext.Provider value={context}>
      {children}
    </FormTranslationContext.Provider>
  )

})