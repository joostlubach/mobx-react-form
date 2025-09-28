import { every } from 'lodash'
import React from 'react'
import { useTimer } from 'react-timer'

export function useAutoFilledDetection(refs: React.RefObject<HTMLElement | null>[]) {
  const timer = useTimer()
  const [autoFilled, setAutoFilled] = React.useState<boolean>(false)

  React.useEffect(() => {
    timer.setTimeout(() => {
      try {
        const elements = refs.map(ref => ref.current)
        if (every(elements, el => el?.matches(':-webkit-autofill'))) {
          setAutoFilled(true)
        }
      } catch {}
    }, 0)
  }, [refs, timer])

  return autoFilled
}