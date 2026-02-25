'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/utilities/ui'

/**
 * Vertical slider matching Figma Heat-Slider (2178:27079):
 * Top label, vertical gradient track (warm top → light bottom), horizontal handle, bottom label.
 * No units. Single value.
 */
export type VerticalSliderProps = {
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
  step: number
  /** Label above the slider (e.g. "viel zu heiß") */
  labelTop: string
  /** Label below the slider (e.g. "angenehm") */
  labelBottom: string
  className?: string
}

const VERTICAL_GRADIENT_TOP = '#ff8429'
const VERTICAL_GRADIENT_BOTTOM = '#eae1d1'

export default function VerticalSlider({
  value,
  onValueChange,
  min,
  max,
  step,
  labelTop,
  labelBottom,
  className,
}: VerticalSliderProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <p className="text-body text-am-darker text-center tracking-[0.08px]">{labelTop}</p>

      <div className="relative flex flex-col items-center">
        {/* Gradient track (Figma: 189px h, ~119px w, rounded 8px, border am_light_alt) */}
        <SliderPrimitive.Root
          value={[value]}
          onValueChange={(v) => onValueChange(v[0])}
          min={min}
          max={max}
          step={step}
          orientation="vertical"
          className="relative flex h-[189px] w-[119px] touch-none select-none items-center justify-center"
        >
          <SliderPrimitive.Track className="relative h-full w-full rounded-lg border border-muted overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom, ${VERTICAL_GRADIENT_TOP}, ${VERTICAL_GRADIENT_BOTTOM})`,
              }}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="absolute left-1/2 w-[140px] h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-am-darker bg-am-white/30 focus-visible:outline-none focus-visible:ring-none focus-visible:bg-am-orange-alt/50 disabled:pointer-events-none z-10 duration-200 ease-out" />
        </SliderPrimitive.Root>
      </div>

      <p className="text-body text-am-darker text-center tracking-[0.08px]">{labelBottom}</p>
    </div>
  )
}
