import { TOptions } from 'i18next'

export interface FormTranslationFunctions {
  field:            (name: string, options?: TOptions) => FieldTranslations
  fieldCaption:     (name: string, options?: TOptions) => FieldTranslations['caption']
  fieldPrompt:      (name: string, options?: TOptions) => FieldTranslations['prompt']
  fieldLabel:       (name: string, options?: TOptions) => FieldTranslations['label']
  fieldPlaceholder: (name: string, options?: TOptions) => FieldTranslations['placeholder']
  fieldInstruction: (name: string, options?: TOptions) => FieldTranslations['instruction']
  fieldError:       (name: string | null, code: string, options?: TOptions) => string | null
}

export interface FieldTranslations {
  caption?:     string
  prompt?:      string
  label?:       string | Record<'off' | 'on', string> | null
  placeholder?: string | null
  instruction?: string | null
}
