'use client'

import { Button } from '@/components/ui/button'
import { Droplets, Leaf, Sun, Trees, Waves, Wind, Building2, Sprout } from 'lucide-react'
import React from 'react'

interface IconOption {
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const ICON_MAP: Record<string, IconOption> = {
  greening: {
    value: 'greening',
    label: 'Begrünung',
    icon: Leaf,
    color: 'text-green-600',
  },
  water: {
    value: 'water',
    label: 'Wasser',
    icon: Droplets,
    color: 'text-blue-500',
  },
  shadow: {
    value: 'shadow',
    label: 'Schatten',
    icon: Sun,
    color: 'text-yellow-600',
  },
  shading: {
    value: 'shading',
    label: 'Verschattung',
    icon: Wind,
    color: 'text-gray-600',
  },
  cooling: {
    value: 'cooling',
    label: 'Kühlung',
    icon: Waves,
    color: 'text-cyan-500',
  },
  roof_greening: {
    value: 'roof_greening',
    label: 'Dachbegrünung',
    icon: Building2,
    color: 'text-green-700',
  },
  facade_greening: {
    value: 'facade_greening',
    label: 'Fassadenbegrünung',
    icon: Trees,
    color: 'text-green-800',
  },
  water_fountain: {
    value: 'water_fountain',
    label: 'Wasserspender',
    icon: Sprout,
    color: 'text-blue-600',
  },
}

interface IconSelectionProps {
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (value: string[]) => void
  required?: boolean
}

export default function IconSelection({
  options,
  value = [],
  onChange,
  required = false,
}: IconSelectionProps) {
  const handleToggle = (optionValue: string) => {
    const currentValues = Array.isArray(value) ? value : []
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter((v) => v !== optionValue))
    } else {
      onChange([...currentValues, optionValue])
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {options.map((option) => {
          const iconConfig = ICON_MAP[option.value]
          const Icon = iconConfig?.icon || Leaf
          const iconColor = iconConfig?.color || 'text-gray-600'
          const isSelected = Array.isArray(value) && value.includes(option.value)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-muted ${
                isSelected ? 'border-primary bg-primary/10' : 'border-muted bg-card'
              }`}
            >
              <Icon className={`h-8 w-8 ${isSelected ? iconColor : 'text-muted-foreground'}`} />
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
      {required && value.length === 0 && (
        <p className="text-sm text-destructive">Bitte wähle mindestens eine Option aus.</p>
      )}
    </div>
  )
}
