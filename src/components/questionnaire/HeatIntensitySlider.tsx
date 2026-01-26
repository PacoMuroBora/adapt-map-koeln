'use client'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import React from 'react'

interface HeatIntensitySliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  required?: boolean
}

// Color stops matching the reference image (0-9, 10 colors)
const COLOR_STOPS = [
  '#1a5f5f', // Dark Teal/Blue-Green
  '#1e3a5f', // Dark Blue
  '#2e5a8a', // Medium Blue
  '#4a90c2', // Lighter Blue
  '#87ceeb', // Pale Blue
  '#fffacd', // Pale Yellow
  '#ffd700', // Bright Yellow
  '#ffb347', // Light Orange/Peach
  '#cd853f', // Medium Orange/Reddish-Brown
  '#8b4513', // Dark Brown/Reddish-Brown
]

export default function HeatIntensitySlider({
  value,
  onChange,
  min = 0,
  max = 9,
  required = false,
}: HeatIntensitySliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0])
  }

  // Calculate position for pointer indicator
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="heat-intensity-slider">
            Intensität: {value}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <span className="text-sm text-muted-foreground">
            {min} - {max}
          </span>
        </div>

        {/* Container for gradient bar and slider */}
        <div className="relative">
          {/* Color gradient bar */}
          <div className="relative h-12 w-full overflow-hidden rounded-lg border-2 border-gray-800 pointer-events-none">
            {/* Gradient background */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${COLOR_STOPS.join(', ')})`,
              }}
            />

            {/* Pointer indicator */}
            <div
              className="absolute top-0 h-full w-0.5 bg-black transition-all duration-150 z-10"
              style={{
                left: `${percentage}%`,
                transform: 'translateX(-50%)',
              }}
            >
              {/* Triangle pointer */}
              <div
                className="absolute -top-2 left-1/2 h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-black"
                style={{
                  transform: 'translateX(-50%)',
                }}
              />
            </div>
          </div>

          {/* Slider positioned behind gradient bar */}
          <div className="absolute inset-0 flex items-center">
            <Slider
              id="heat-intensity-slider"
              value={[value]}
              onValueChange={handleValueChange}
              min={min}
              max={max}
              step={1}
              showMarks={false}
              className="w-full"
            />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Niedrig</span>
          <span>Hoch</span>
        </div>
      </div>
    </div>
  )
}
