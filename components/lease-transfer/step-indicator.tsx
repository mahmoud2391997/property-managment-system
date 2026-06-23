'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Step = {
  number: number
  title: string
}

type Props = {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className='flex items-center justify-center gap-2 py-4'>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number
        const isCurrent = currentStep === step.number
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className='flex items-center'>
            {/* Step circle and label */}
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  isCompleted && 'bg-green-600 text-(--text-inverse)',
                  isCurrent && 'bg-(--text-primary) text-(--text-inverse)',
                  !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-500'
                )}
              >
                {isCompleted ? (
                  <Check className='w-4 h-4' />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isCurrent && '',
                  isCompleted && 'text-green-600',
                  !isCompleted && !isCurrent && 'text-neutral-400'
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-3 transition-colors',
                  currentStep > step.number ? 'bg-green-600' : 'bg-neutral-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
