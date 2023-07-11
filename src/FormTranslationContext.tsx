import React from 'react'
import { memo } from 'react-util'
import { TOptionsBase } from 'i18next'
import { startCase, upperFirst } from 'lodash'

export interface FormTranslationFunctions {
  field:            <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations
  fieldCaption:     <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations['caption']
  fieldPrompt:      <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations['prompt']
  fieldLabel:       <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations['label']
  fieldPlaceholder: <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations['placeholder']
  fieldInstruction: <TOpts extends TOptionsBase>(name: string, options?: TOpts) => FieldTranslations['instruction']
  fieldError:       <TOpts extends TOptionsBase>(name: string | null, code: string, options?: TOpts) => string | null
}

export interface FieldTranslations {
  caption?:     string
  prompt?:      string
  label?:       string | Record<'off' | 'on', string> | null
  placeholder?: string | null
  instruction?: string | null
}

const defaultFormTranslationFunctions: FormTranslationFunctions = (() => {
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

const FormTranslationContext = React.createContext<FormTranslationFunctions>(defaultFormTranslationFunctions)

export interface FormTranslationProviderProps {
  translation?: FormTranslationFunctions
  children?:    React.ReactNode
}

export const FormTranslationProvider = memo('FormTranslationProvider', (props: FormTranslationProviderProps) => {

  const {
    translation,
    children
  } = props

  const context = React.useMemo((): FormTranslationFunctions => ({
    ...defaultFormTranslationFunctions,
    ...translation,
  }), [])

  return (
    <FormTranslationContext.Provider value={context}>
      {children}
    </FormTranslationContext.Provider>
  )

})

export function useFormTranslation() {
  return React.useContext(FormTranslationContext)
}