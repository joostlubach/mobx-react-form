import { TOptionsBase } from 'i18next'

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
