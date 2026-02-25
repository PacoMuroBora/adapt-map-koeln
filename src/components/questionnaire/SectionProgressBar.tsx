'use client'

import { cn } from '@/utilities/ui'
import { motion } from 'motion/react'

export type SectionProgressBarProps = {
  sections: { stepsCount: number; variant?: string }[]
  currentSectionIndex: number
  currentStepInSection: number
  /** Steps in the current section that count as filled (e.g. have a value or were visited). Stay filled and clickable when moving back. */
  filledStepNumbersInSection?: number[]
  variant?: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
  onStepClick?: (step: number) => void
  className?: string
}

const BAR_HEIGHT_EXPANDED = 36
const GAP_EXPANDED = 6
const BAR_HEIGHT_COMPRESSED = 6
const GAP_COMPRESSED = 3

const EASE = [0.33, 1, 0.68, 1] as const // ease-out: starts fast, no perceived delay
const DURATION = 0.4
const TRANSITION = { duration: DURATION, ease: EASE }

const DEFAULT_VARIANT = 'purple' satisfies SectionProgressBarProps['variant']

export default function SectionProgressBar({
  sections,
  currentSectionIndex,
  currentStepInSection,
  filledStepNumbersInSection,
  variant = DEFAULT_VARIANT,
  onStepClick,
  className,
}: SectionProgressBarProps) {
  const filledSet = filledStepNumbersInSection
    ? new Set(filledStepNumbersInSection)
    : undefined
  const resolvedVariant = variant ?? DEFAULT_VARIANT
  const dotClasses = {
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
    <div
      className={cn('flex flex-col items-center justify-end gap-4', className)}
      aria-label={
        currentStepInSection === 0
          ? `Abschnitt ${currentSectionIndex + 1}, noch nicht gestartet`
          : `Abschnitt ${currentSectionIndex + 1}, Schritt ${currentStepInSection} von ${sections[currentSectionIndex]?.stepsCount ?? 0}`
      }
    >
      {sections.map((section, sectionIdx) => {
        const isCurrent = sectionIdx === currentSectionIndex
        const isCompleted = sectionIdx < currentSectionIndex
        const stepsCount = Math.max(1, section.stepsCount)
        const label = String(sectionIdx + 1).padStart(2, '0')

        return (
          <div
            key={sectionIdx}
            className="flex flex-col items-center gap-2"
            data-section={sectionIdx}
          >
            <p className="shrink-0 font-mono text-xs font-normal uppercase leading-tight text-white">
              {label}
            </p>
            <motion.div className="flex w-2 flex-col">
              {Array.from({ length: stepsCount }, (_, i) => {
                const step = i + 1
                const isActive =
                  isCurrent && currentStepInSection > 0 && step === currentStepInSection
                const isPast = isCurrent && currentStepInSection > 0 && step < currentStepInSection
                const isFilledByValue = filledSet?.has(step) ?? false
                const filled = isCompleted || isPast || isFilledByValue
                const isClickable =
                  (isPast || isFilledByValue) && onStepClick != null
                const gapPx = isCurrent ? GAP_EXPANDED : GAP_COMPRESSED
                const isLastBar = i === stepsCount - 1

                return (
                  <motion.span
                    key={step}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-current={isActive ? 'step' : undefined}
                    aria-label={isClickable ? `Zu Schritt ${step} wechseln` : undefined}
                    onClick={isClickable ? () => onStepClick!(step) : undefined}
                    className={cn(
                      'block w-2 shrink-0 rounded-[50px] border border-solid transition-colors duration-300 ease-in-out outline-none ring-0',
                      isClickable && 'cursor-pointer',
                      filled && 'is-filled',
                      isActive &&
                        isCurrent &&
                        `${dotClasses.bgActive[resolvedVariant]} ${dotClasses.border[resolvedVariant]}`,
                      filled &&
                        isCurrent &&
                        !isActive &&
                        `${dotClasses.bgPast[resolvedVariant]} ${dotClasses.border[resolvedVariant]}`,
                      !isActive && !filled && 'bg-white/10 border-white/40',
                      !isCurrent && 'bg-white/10 border-white/40',
                    )}
                    animate={{
                      height: isCurrent ? BAR_HEIGHT_EXPANDED : BAR_HEIGHT_COMPRESSED,
                      marginBottom: isLastBar ? 0 : gapPx,
                    }}
                    transition={TRANSITION}
                  />
                )
              })}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
