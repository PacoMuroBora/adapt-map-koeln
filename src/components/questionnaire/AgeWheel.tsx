'use client'

import * as React from 'react'
import { motion, useMotionValue, useMotionValueEvent, animate } from 'motion/react'
import { cn } from '@/utilities/ui'
import { MoveHorizontal } from 'lucide-react'

const VISIBLE_COUNT = 7
const COPIES = 3
/** Fixed width of each number cell (px) */
const ITEM_WIDTH = 32
/** Horizontal gap between numbers (included in step for all position math) */
const GAP = 12
/** Curve steepness */
const CURVE_STRENGTH_MOBILE = 4
const CURVE_STRENGTH_DESKTOP = 2.5
const CURVE_BREAKPOINT = 768

const HEIGHT = 300

export type AgeWheelProps = {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export default function AgeWheel({
  value,
  onValueChange,
  min = 1,
  max = 110,
  className,
}: AgeWheelProps) {
  const N = max - min + 1
  const totalItems = N * COPIES
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth : CURVE_BREAKPOINT,
  )
  const [translateX, setTranslateX] = React.useState(0)

  // Fixed item width; step = distance from start of one item to next. All position math uses step.
  const itemWidth = ITEM_WIDTH
  const step = itemWidth + GAP
  const stripWidth = totalItems * step - GAP
  const middleStart = N
  const middleEnd = 2 * N - 1

  const x = useMotionValue(0)
  const skipNextValueSyncRef = React.useRef(false)
  const momentumPhaseRef = React.useRef(false)
  const momentumSettleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSnapToNearest = React.useCallback(() => {
    if (!containerWidth) return
    momentumPhaseRef.current = false
    if (momentumSettleTimeoutRef.current) {
      clearTimeout(momentumSettleTimeoutRef.current)
      momentumSettleTimeoutRef.current = null
    }
    const tx = x.get()
    const rawCenter = (tx - containerWidth / 2 + itemWidth / 2) / -step
    let snapped = Math.round(rawCenter)
    while (snapped < middleStart) snapped += N
    while (snapped > middleEnd) snapped -= N
    const newTranslateX = containerWidth / 2 - itemWidth / 2 - snapped * step
    animate(x, newTranslateX, {
      type: 'tween',
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    })
    const newValue = min + (snapped - middleStart)
    skipNextValueSyncRef.current = true
    onValueChange(newValue)
  }, [x, step, itemWidth, containerWidth, middleStart, middleEnd, N, min, onValueChange])

  // Sync motion value when value prop or container size changes (e.g. initial load or parent change)
  React.useEffect(() => {
    if (skipNextValueSyncRef.current) {
      skipNextValueSyncRef.current = false
      return
    }
    if (!containerWidth) return
    const v = Math.min(Math.max(value, min), max)
    const centerIndex = middleStart + (v - min)
    const targetX = containerWidth / 2 - itemWidth / 2 - centerIndex * step
    x.set(targetX)
    setTranslateX(targetX)
  }, [value, min, max, middleStart, step, itemWidth, containerWidth, x])

  useMotionValueEvent(x, 'change', (latest) => {
    setTranslateX(latest)
    if (momentumPhaseRef.current) {
      if (momentumSettleTimeoutRef.current) clearTimeout(momentumSettleTimeoutRef.current)
      momentumSettleTimeoutRef.current = setTimeout(runSnapToNearest, 120)
    }
  })

  React.useEffect(() => {
    return () => {
      if (momentumSettleTimeoutRef.current) clearTimeout(momentumSettleTimeoutRef.current)
    }
  }, [])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      setContainerWidth(w)
    })
    ro.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  React.useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const centerIndex =
    containerWidth > 0
      ? (-translateX + containerWidth / 2 - itemWidth / 2) / step
      : middleStart + (value - min)

  const curveStrength =
    windowWidth < CURVE_BREAKPOINT ? CURVE_STRENGTH_MOBILE : CURVE_STRENGTH_DESKTOP

  const getItemValue = (index: number) => min + (index % N)

  const handleDragEnd = React.useCallback(() => {
    momentumPhaseRef.current = true
    if (momentumSettleTimeoutRef.current) clearTimeout(momentumSettleTimeoutRef.current)
    momentumSettleTimeoutRef.current = setTimeout(runSnapToNearest, 120)
  }, [runSnapToNearest])

  if (containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('w-full overflow-hidden', className)}
        style={{ height: 56 }}
      />
    )
  }

  return (
    <div className="absolute left-0 bottom-0 w-full">
      {/* background shape: semicircle + rect below (absolute so no layout shift) */}
      <div className="absolute inset-x-0 -top-6 w-full">
        <svg
          className="relative z-0 w-full h-auto"
          viewBox="0 0 1 1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
        >
          <path
            d="M0.501582 0C0.683503 0 0.853876 0.0503165 1 0.138018V1H0V0.139927C0.146827 0.0510478 0.318346 0 0.501582 0Z"
            fill="#9F94FF"
          />
        </svg>
        <div
          className="absolute left-0 right-0 top-full z-0 h-[100vh] bg-[#9F94FF]"
          aria-hidden
        />
      </div>
      {/* active value indicator */}
      <div
        className="absolute left-1/2 -top-10 w-0.5 bg-am-darker"
        style={{ height: 40 }}
        aria-hidden
      />
      <div className="relative w-full overflow-hidden touch-none select-none">
        <div ref={containerRef} className="-translate-x-3" style={{ height: HEIGHT }}>
          <motion.div
            drag="x"
            dragElastic={0}
            dragMomentum={true}
            dragTransition={{
              power: 0.5,
              timeConstant: 500,
            }}
            onDragEnd={handleDragEnd}
            className="absolute flex items-end justify-start"
            style={{
              left: 0,
              top: 0,
              height: HEIGHT,
              width: stripWidth,
              gap: GAP,
              x,
            }}
          >
            {Array.from({ length: totalItems }, (_, i) => {
              const dist = centerIndex - i
              const absDist = Math.abs(dist)
              const isCenter = absDist < 0.5
              const scale = isCenter ? 1 : 0.8
              const opacity = isCenter ? 1 : 0.5
              const yOffset = curveStrength * dist * dist
              return (
                <motion.div
                  key={i}
                  className="flex shrink-0 grow-0 justify-center font-mono font-light text-am-darker"
                  animate={{
                    fontSize: isCenter ? '2.5rem' : '1.25rem',
                  }}
                  transition={{
                    duration: 0.35,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  style={{
                    width: isCenter ? itemWidth * 2 : itemWidth,
                    minWidth: isCenter ? itemWidth * 2 : itemWidth,
                    maxWidth: isCenter ? itemWidth * 2 : itemWidth,
                    height: HEIGHT,
                    boxSizing: 'border-box',
                    transform: `translateY(${yOffset}px) scale(${scale})`,
                    paddingTop: isCenter ? 8 : 0,
                    opacity,
                  }}
                >
                  {getItemValue(i)}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 text-body-sm text-muted-foreground text-center">
        <MoveHorizontal className="w-4 h-4" />
        <p>ziehe zum Auswählen</p>
      </div>
    </div>
  )
}
