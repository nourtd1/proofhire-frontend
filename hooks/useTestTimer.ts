import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { tickTimer, setStatus } from '../store/slices/testSlice'
import type { RootState, AppDispatch } from '../store'

const formatMMSS = (totalSeconds: number): string => {
  const s = Math.max(0, totalSeconds)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function useTestTimer(onTimeUp: () => void): { timeLeft: number; formattedTime: string } {
  const dispatch = useDispatch<AppDispatch>()
  const { status, timeLeft } = useSelector((s: RootState) => s.test)
  const hasFiredRef = useRef<boolean>(false)

  useEffect(() => {
    if (status !== 'in_progress') {
      hasFiredRef.current = false
      return
    }

    const interval = window.setInterval(() => {
      dispatch(tickTimer())
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [dispatch, status])

  useEffect(() => {
    if (status !== 'in_progress') return
    if (timeLeft > 0) return
    if (hasFiredRef.current) return

    hasFiredRef.current = true
    dispatch(setStatus('submitting'))
    onTimeUp()
  }, [dispatch, onTimeUp, status, timeLeft])

  const formattedTime = useMemo(() => formatMMSS(timeLeft), [timeLeft])

  return { timeLeft, formattedTime }
}

