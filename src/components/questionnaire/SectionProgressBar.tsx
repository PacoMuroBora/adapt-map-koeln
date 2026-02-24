'use client'

import { cn } from '@/utilities/ui'
import { motion } from 'motion/react'

export type SectionProgressBarProps = {
  sections: { stepsCount: number; progressColor?: string }[]
  currentSectionIndex: number
  currentStepInSection: number
  progressColor?: string
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

export default function SectionProgressBar({
  sections,
  currentSectionIndex,
  currentStepInSection,
  progressColor,
  onStepClick,
  className,
}: SectionProgressBarProps) {
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
        const sectionColor = section.progressColor ?? progressColor

        return (
          <div
            key={sectionIdx}
            className="flex flex-col items-center gap-2"
            data-section={sectionIdx}
          >
            <p className="shrink-0 font-mono text-xs font-normal uppercase leading-tight text-white">
              {label}
            </p>
            <motion.div
              className="flex w-2 flex-col"
            >
              {Array.from({ length: stepsCount }, (_, i) => {
                const step = i + 1
                const isActive =
                  isCurrent && currentStepInSection > 0 && step === currentStepInSection
                const isPast =
                  isCurrent && currentStepInSection > 0 && step < currentStepInSection
                const filled = isCompleted || isPast
                const isClickable = isPast && onStepClick != null
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
                      isActive && !sectionColor && 'border-transparent bg-am-purple-alt',
                      !isActive && filled && !sectionColor && 'bg-white/40',
                      !isActive && filled && isCurrent && !sectionColor && 'border-white/40',
                      !isActive && filled && !isCurrent && !sectionColor && 'border-transparent',
                      !isActive && !filled && !sectionColor && 'border-white/40 bg-white/10',
                      isPast && !isActive && !sectionColor && 'hover:bg-am-purple-alt/40',
                    )}
                    style={
                      isActive && sectionColor
                        ? { backgroundColor: sectionColor, borderColor: 'transparent' }
                        : !isActive && filled && sectionColor
                          ? {
                              backgroundColor: `${sectionColor}${isCurrent ? '66' : '99'}`,
                              borderColor: sectionColor,
                            }
                          : !isActive && !filled && sectionColor
                            ? {
                                borderColor: sectionColor,
                                backgroundColor: 'rgba(255,255,255,0.1)',
                              }
                            : undefined
                    }
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
