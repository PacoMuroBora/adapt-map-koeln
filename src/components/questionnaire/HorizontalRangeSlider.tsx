'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/utilities/ui'

/**
 * Horizontal range slider matching Figma Days-Range-Slider (2178-27570):
 * Track with tick marks, two thumbs, two values below (min/max), units below from CMS.
 */
export type HorizontalRangeSliderProps = {
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  min: number
  max: number
  step: number
  /** Unit label from CMS (e.g. "TAGE / JAHR"). Shown below the values, uppercase. */
  unit?: string
  className?: string
}

export default function HorizontalRangeSlider({
  value: [minVal, maxVal],
  onValueChange,
  min,
  max,
  step,
  unit,
  className,
}: HorizontalRangeSliderProps) {
  const range = max - min
  const toPercent = (v: number) => ((v - min) / range) * 100
  const tickCount = Math.min(24, Math.max(2, Math.floor(range / step) + 1))

  return (
    <div className={cn('flex w-full flex-1 flex-col min-h-[260px]', className)}>
      {/* Slider + values centered in the card */}
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2">
        <div className="relative flex w-full max-w-[268px] items-center">
          {/* Tick marks along the track (evenly spaced) */}
          <div className="absolute inset-0 flex items-center justify-between">
            {Array.from({ length: tickCount }, (_, i) => (
              <div key={i} className="h-3 w-px shrink-0 bg-am-dark/30" />
            ))}
          </div>

          <SliderPrimitive.Root
            value={[minVal, maxVal]}
            onValueChange={(v) => onValueChange([v[0], v[1]])}
            min={min}
            max={max}
            step={step}
            className="relative flex w-full touch-none select-none items-center"
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-am-light/60">
              <SliderPrimitive.Range className="absolute h-full rounded-full bg-am-dark/40" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-5 -translate-y-1/2 rounded-full border-2 border-am-darker bg-am-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none" />
            <SliderPrimitive.Thumb className="block size-5 -translate-y-1/2 rounded-full border-2 border-am-darker bg-am-white shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none" />
          </SliderPrimitive.Root>
        </div>

        {/* Two values below thumbs (Figma: 28px Geist Mono, black) */}
        <div className="relative h-8 w-full max-w-[268px]">
          <span
            className="absolute top-0 font-mono text-[28px] leading-6 text-am-darker -translate-x-1/2"
            style={{ left: `${toPercent(minVal)}%` }}
          >
            {minVal}
          </span>
          <span
            className="absolute top-0 font-mono text-[28px] leading-6 text-am-darker -translate-x-1/2"
            style={{ left: `${toPercent(maxVal)}%` }}
          >
            {maxVal}
          </span>
        </div>
      </div>

      {/* Units at the bottom of the card */}
      {unit && (
        <p className="mt-auto shrink-0 text-center font-mono text-lg uppercase tracking-wide text-am-darker">
          {unit}
        </p>
      )}
    </div>
  )
}
