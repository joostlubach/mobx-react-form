import { every } from 'lodash'
import { RefObject, useEffect, useState } from 'react'
import { useTimer } from 'react-timer'

export function useAutoFilledDetection(refs: RefObject<HTMLElement | null>[]) {
  const timer = useTimer()
  const [autoFilled, setAutoFilled] = useState<boolean>(false)

  useEffect(() => {
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