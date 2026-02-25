'use client'

import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'

export type PaginationStepsProps = {
  currentStep: number
  totalSteps: number
  className?: string
  variant?: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  direction?: 'horizontal' | 'vertical'
  /** When set, past steps are clickable and call this with the step number (1-based). */
  onStepClick?: (step: number) => void
  /** Optional hex color for progress indicator and dots (overrides variant). */
}

/**
 * Step indicator for questionnaires. Based on shadcn Pagination.
 * Styled for AdaptMap Design System (Figma 2284-63268): dots, active filled, inactive outline.
 */
export default function PaginationSteps({
  currentStep,
  totalSteps,
  className,
  variant = 'purple',
  direction = 'horizontal',
  onStepClick,
}: PaginationStepsProps) {
  const dotVariants = {
    bgPast: {
      purple: 'bg-am-purple/20',
      orange: 'bg-am-orange/20',
      green: 'bg-am-green/20',
      pink: 'bg-am-pink/20',
      turquoise: 'bg-am-turquoise/20',
    },
    bgActive: {
      purple: 'bg-am-purple-alt',
      orange: 'bg-am-orange-alt',
      green: 'bg-am-green-alt',
      pink: 'bg-am-pink-alt',
      turquoise: 'bg-am-turquoise-alt',
    },
    border: {
      purple: 'border-am-purple-alt',
      orange: 'border-am-orange-alt',
      green: 'border-am-green-alt',
      pink: 'border-am-pink-alt',
      turquoise: 'border-am-turquoise-alt',
    },
  }

  return (
    <Pagination
      className={cn(direction === 'vertical' ? 'flex-col h-full' : 'w-full', className)}
      aria-label={`Schritt ${currentStep} von ${totalSteps}`}
    >
      <span className="sr-only">
        Schritt {currentStep} von {totalSteps}
      </span>
      {direction === 'vertical' && (
        <span
          className={cn(
            'text-[12px] font-mono uppercase tracking-wide mb-2',
            !variant && 'text-white',
          )}
          style={variant ? { color: variant } : undefined}
        >
          {String(currentStep).padStart(2, '0')}
        </span>
      )}
      <PaginationContent
        className={cn('flex gap-2', direction === 'vertical' ? 'flex-col h-full' : 'w-full')}
      >
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const isActive = step === currentStep
          const isPast = step < currentStep
          const isClickable = isPast && onStepClick != null
          const El = isClickable ? 'button' : 'span'
          return (
            <PaginationItem key={step} className="list-none min-w-0 flex-1">
              <El
                type={isClickable ? 'button' : undefined}
                aria-current={isActive ? 'step' : undefined}
                aria-label={isClickable ? `Zu Schritt ${step} wechseln` : undefined}
                onClick={isClickable ? () => onStepClick(step) : undefined}
                className={cn(
                  'block w-full rounded-full transition-colors duration-300 ease-in-out',
                  direction === 'horizontal' ? 'h-2' : 'h-full w-2',
                  'outline-none ring-0',
                  isClickable && 'cursor-pointer',
                  isActive && [dotVariants.bgActive[variant], dotVariants.border[variant]],
                  isPast && !isActive && [dotVariants.bgPast[variant], dotVariants.border[variant]],
                  !isActive && !isPast && ['bg-white/10 border-white/40'],
                )}
              />
            </PaginationItem>
          )
        })}
      </PaginationContent>
    </Pagination>
  )
}
