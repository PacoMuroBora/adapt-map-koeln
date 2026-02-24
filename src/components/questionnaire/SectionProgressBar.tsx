'use client'

import { cn } from '@/utilities/ui'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'

export type SectionProgressBarProps = {
  sections: { stepsCount: number; progressColor?: string }[]
  currentSectionIndex: number
  currentStepInSection: number
  progressColor?: string
  onStepClick?: (step: number) => void
  className?: string
}

// Pixel heights so we can animate explicitly (layout animation was unreliable when swapping content)
const BAR_HEIGHT_EXPANDED = 48
const GAP_EXPANDED = 4
const BAR_HEIGHT_COMPRESSED = 8
const GAP_COMPRESSED = 2

function expandedHeight(stepsCount: number) {
  return stepsCount * BAR_HEIGHT_EXPANDED + (stepsCount - 1) * GAP_EXPANDED
}

function compressedHeight(stepsCount: number) {
  return stepsCount * BAR_HEIGHT_COMPRESSED + (stepsCount - 1) * GAP_COMPRESSED
}

/** Single bar: filled or outline. Used in compressed section stacks. */
function CompressedBar({
  filled,
  progressColor,
  className,
}: {
  filled: boolean
  progressColor?: string
  className?: string
}) {
  const style =
    filled && progressColor
      ? { backgroundColor: `${progressColor}99`, borderColor: progressColor }
      : !filled && progressColor
        ? { borderColor: progressColor, backgroundColor: 'rgba(255,255,255,0.1)' }
        : filled
          ? undefined
          : undefined
  return (
    <span
      className={cn(
        'block shrink-0 rounded-[50px] border border-solid transition-colors duration-300',
        filled ? 'border-transparent' : 'bg-white/10',
        filled && !progressColor && 'bg-white/40',
        !filled && !progressColor && 'border-white/40',
        className,
      )}
      style={style}
      aria-hidden
    />
  )
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const
const DURATION = 0.5

/**
 * Section progress bar: each section's bar container animates height.
 * On section change, both the compressing and expanding containers animate simultaneously (same duration, no delay).
 */
export default function SectionProgressBar({
  sections,
  currentSectionIndex,
  currentStepInSection,
  progressColor,
  onStepClick,
  className,
}: SectionProgressBarProps) {
  const prevSectionRef = useRef(currentSectionIndex)
  const direction = currentSectionIndex - prevSectionRef.current

  useEffect(() => {
    prevSectionRef.current = currentSectionIndex
  }, [currentSectionIndex])

  const isSectionTransitioning = (sectionIdx: number, isCurrent: boolean) => {
    const wasCurrent = sectionIdx === prevSectionRef.current
    if (direction === 0) return false
    return isCurrent || wasCurrent
  }

  const getTransition = (sectionIdx: number, isCurrent: boolean) => {
    const transitioning = isSectionTransitioning(sectionIdx, isCurrent)
    return {
      duration: DURATION,
      ease: EASE,
      delay: transitioning ? 0 : 0.02 * sectionIdx,
    }
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
        const sectionColor = section.progressColor ?? progressColor
        const targetHeightPx = isCurrent ? expandedHeight(stepsCount) : compressedHeight(stepsCount)
        const wasCurrent = sectionIdx === prevSectionRef.current
        const prevHeightPx = wasCurrent ? expandedHeight(stepsCount) : compressedHeight(stepsCount)
        const isTransitioning = prevHeightPx !== targetHeightPx

        return (
          <div
            key={sectionIdx}
            className="flex flex-col items-center gap-2"
            data-section={sectionIdx}
          >
            <p className="shrink-0 font-mono text-xs font-normal uppercase leading-tight text-white">
              {label}
            </p>
            {/* Height is 100% from animation; content is absolutely positioned so it never drives height (fixes shrink jump). */}
            <motion.div
              className="relative w-2 overflow-hidden"
              initial={isTransitioning ? { height: prevHeightPx } : false}
              animate={{ height: targetHeightPx }}
              transition={getTransition(sectionIdx, isCurrent)}
              style={{ minHeight: 0, flexShrink: 0 }}
            >
              <div
                className="absolute left-0 top-0 w-full"
                style={{ height: Math.max(prevHeightPx, targetHeightPx) }}
              >
                <div
                  className={cn(
                    'w-full',
                    isCurrent ? 'flex flex-col gap-1' : 'flex flex-col gap-0.5',
                  )}
                >
                  {isCurrent ? (
                    <>
                      {Array.from({ length: stepsCount }, (_, i) => {
                        const step = i + 1
                        const isActive = currentStepInSection > 0 && step === currentStepInSection
                        const isPast = currentStepInSection > 0 && step < currentStepInSection
                        const isClickable = isPast && onStepClick != null
                        const El = isClickable ? 'button' : 'span'
                        return (
                          <El
                            key={step}
                            type={isClickable ? 'button' : undefined}
                            aria-current={isActive ? 'step' : undefined}
                            aria-label={isClickable ? `Zu Schritt ${step} wechseln` : undefined}
                            onClick={isClickable ? () => onStepClick(step) : undefined}
                            className={cn(
                              'block h-12 w-2 shrink-0 rounded-[50px] border border-solid transition-colors duration-300 ease-in-out outline-none ring-0',
                              isClickable && 'cursor-pointer',
                              isActive && (sectionColor ? '' : 'bg-am-purple-alt border-transparent'),
                              !isActive && 'border-white/40 bg-white/10',
                              isPast && !isActive && !sectionColor && 'bg-white/40 hover:bg-am-purple-alt/40',
                            )}
                            style={
                              isActive
                                ? sectionColor
                                  ? { backgroundColor: sectionColor, borderColor: 'transparent' }
                                  : undefined
                                : isPast && !isActive
                                  ? sectionColor
                                    ? { backgroundColor: `${sectionColor}66`, borderColor: sectionColor }
                                    : undefined
                                  : !isActive && sectionColor
                                    ? { borderColor: sectionColor, backgroundColor: 'rgba(255,255,255,0.1)' }
                                    : undefined
                            }
                          />
                        )
                      })}
                    </>
                  ) : (
                    <>
                      {Array.from({ length: stepsCount }, (_, i) => (
                        <CompressedBar
                          key={i}
                          filled={isCompleted}
                          progressColor={sectionColor}
                          className="h-2 w-2"
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
