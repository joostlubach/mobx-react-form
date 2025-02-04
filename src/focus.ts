import { focusFirst } from 'react-autofocus'

export function focusFirstInvalidField(container: HTMLElement) {
  focusFirst(container, {
    selector: `[data-invalid]`,
    default:  false,
  })
}