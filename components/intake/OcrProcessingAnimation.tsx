'use client'

import { useEffect, useState } from 'react'
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

interface OcrProcessingAnimationProps {
  isRunning: boolean
  onComplete?: () => void
}

export function OcrProcessingAnimation({ isRunning, onComplete }: OcrProcessingAnimationProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isRunning) return
    setCurrentStage(0)
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i >= STAGES.length) {
        clearInterval(interval)
        setCurrentStage(STAGES.length - 1)
        setDone(true)
        onComplete?.()
      } else {
        setCurrentStage(i)
      }
    }, 550)
    return () => clearInterval(interval)
  }, [isRunning, onComplete])

  if (!isRunning && !done) return null

  return (
    <div className="bg-ivory-warm border border-sand-light rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {done
          ? <CheckCircle className="w-5 h-5 text-success-DEFAULT" />
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
      {/* Progress bar */}
      <div className="mt-4 bg-parchment rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gold-soft rounded-full transition-all duration-500"
          style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
