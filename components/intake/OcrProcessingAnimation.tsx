'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGES = [
  'Validating file...',
  'Pre-processing image...',
  'Running OCR extraction...',
  'Recognizing medical entities...',
  'Normalizing units...',
  'Validating markers...',
  'Analysis complete.',
]

const FINAL_STAGE = STAGES.length - 1   // "Analysis complete."
const HOLD_STAGE  = FINAL_STAGE - 1     // last in-progress stage

interface OcrProcessingAnimationProps {
  /** True while the real OCR API call is in flight. The animation only
   *  reaches the "Analysis complete" stage once this flips back to false,
   *  so the UI never claims completion while the backend is still working. */
  isRunning: boolean
}

export function OcrProcessingAnimation({ isRunning }: OcrProcessingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const startedRef = useRef(false)

  // While the call is in flight, tick through the in-progress stages on a
  // timer but never advance past HOLD_STAGE. The final stage is only
  // reached when the parent flips isRunning off.
  useEffect(() => {
    if (!isRunning) return
    startedRef.current = true
    setCurrentStage(0)
    let i = 0
    const interval = setInterval(() => {
      i = Math.min(i + 1, HOLD_STAGE)
      setCurrentStage(i)
      if (i === HOLD_STAGE) clearInterval(interval)
    }, 550)
    return () => clearInterval(interval)
  }, [isRunning])

  // Once the real API call resolves, jump to the final "complete" stage.
  useEffect(() => {
    if (isRunning || !startedRef.current) return
    setCurrentStage(FINAL_STAGE)
  }, [isRunning])

  if (!isRunning && !startedRef.current) return null

  const done = !isRunning && currentStage === FINAL_STAGE

  return (
    <div className="bg-white border border-sand-light/60 rounded-xl shadow-sm p-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {done
          ? <CheckCircle className="w-5 h-5 text-gold-soft" />
          : <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
        }
        <span className="font-body font-medium text-sm text-charcoal-deep">
          {done ? 'Processing complete' : 'Processing document...'}
        </span>
      </div>
      <div className="space-y-2">
        {STAGES.map((stage, i) => (
          <div key={stage} className={cn('flex items-center gap-2 text-xs font-body transition-all duration-300', i <= currentStage ? 'opacity-100' : 'opacity-25')}>
            <div className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
              i < currentStage ? 'bg-success-DEFAULT'
                : i === currentStage && !done ? 'bg-gold-soft animate-pulse'
                  : done && i === currentStage ? 'bg-success-DEFAULT'
                    : 'bg-sand-DEFAULT'
            )} />
            <span className={i <= currentStage ? 'text-charcoal-warm' : 'text-greige'}>{stage}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-parchment rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gold-soft rounded-full transition-all duration-500"
          style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
