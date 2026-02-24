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
  /** Optional hex color for progress indicator and dots (overrides variant). */
  progressColor?: string
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
  progressColor,
}: PaginationStepsProps) {
  const activeStyle = progressColor ? { backgroundColor: progressColor } : undefined
  const pastStyle = progressColor ? { backgroundColor: `${progressColor}66`, borderColor: progressColor } : undefined

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
          className={cn('text-[12px] font-mono uppercase tracking-wide mb-2', !progressColor && 'text-white')}
          style={progressColor ? { color: progressColor } : undefined}
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
          const dotStyle =
            progressColor && (isActive || isPast)
              ? isActive
                ? activeStyle
                : pastStyle
              : undefined
          return (
            <PaginationItem key={step} className="list-none min-w-0 flex-1">
              <El
                type={isClickable ? 'button' : undefined}
                aria-current={isActive ? 'step' : undefined}
                aria-label={isClickable ? `Zu Schritt ${step} wechseln` : undefined}
                onClick={isClickable ? () => onStepClick(step) : undefined}
                style={dotStyle}
                className={cn(
                  'block w-full rounded-full transition-colors duration-300 ease-in-out',
                  direction === 'horizontal' ? 'h-2' : 'h-full w-2',
                  'outline-none ring-0',
                  isClickable && 'cursor-pointer',
                  !progressColor && isActive && (variant === 'purple' ? 'bg-am-purple-alt' : 'bg-am-orange-alt'),
                  !progressColor && !isActive && 'border border-white/40',
                  !progressColor && isPast && 'bg-am-white/40 hover:bg-am-purple-alt/40 hover:border-border',
                  !progressColor && !isActive && !isPast && 'bg-am-white/15',
                  progressColor && !isActive && 'border border-white/40',
                )}
              />
            </PaginationItem>
          )
        })}
      </PaginationContent>
    </Pagination>
  )
}
