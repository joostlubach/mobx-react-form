import { focusFirst } from 'react-autofocus'

export const INVALID_FIELD_MARKER_CLASS = '--FormField-invalid'

export function focusFirstInvalidField(container: HTMLElement) {
  focusFirst(container, {
    selector: `.${INVALID_FIELD_MARKER_CLASS}`,
  })
}