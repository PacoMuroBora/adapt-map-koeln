'use client'

import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { cn } from '@/utilities/ui'

export type PaginationStepsProps = {
  currentStep: number
  totalSteps: number
  className?: string
  variant?: 'purple' | 'orange'
  direction?: 'horizontal' | 'vertical'
  /** When set, past steps are clickable and call this with the step number (1-based). */
  onStepClick?: (step: number) => void
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
  return (
    <Pagination
      className={cn(direction === 'vertical' ? 'flex-col h-full' : 'w-full', className)}
      aria-label={`Schritt ${currentStep} von ${totalSteps}`}
    >
      <span className="sr-only">
        Schritt {currentStep} von {totalSteps}
      </span>
      {direction === 'vertical' && (
        <span className="text-[12px] font-mono uppercase tracking-wide text-white mb-2">01</span>
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
                  isActive
                    ? variant === 'purple'
                      ? 'bg-am-purple-alt'
                      : 'bg-am-orange-alt'
                    : 'border border-white/40',
                  isPast && 'bg-am-white/40 hover:bg-am-purple-alt/40 hover:border-border',
                  !isActive && !isPast && 'bg-am-white/15',
                )}
              />
            </PaginationItem>
          )
        })}
      </PaginationContent>
    </Pagination>
  )
}
