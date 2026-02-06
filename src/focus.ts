import { focusFirst, FocusInContainerOptions } from 'react-util'

export function focusFirstInvalidField(container: HTMLElement, options: FocusInContainerOptions = {}) {
  return focusFirst(container, {
    selector: `:invalid, [data-invalid="true"]`,
    default:  false,
    ...options,
  })
}