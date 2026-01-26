'use client'

import * as React from 'react'
import { cn } from '@/utilities/ui'
import { Circle } from 'lucide-react'

interface RadioGroupContextType {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
  }
>(({ className, value, onValueChange, name, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div
        ref={ref}
        className={cn('grid gap-2', className)}
        role="radiogroup"
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = 'RadioGroup'

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
    disabled?: boolean
  }
>(({ className, value: itemValue, disabled, ...props }, ref) => {
  const { value, onValueChange, name } = React.useContext(RadioGroupContext)
  const checked = value === itemValue
  const id = React.useId()

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      id={id}
      name={name}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-border text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked && 'border-primary bg-primary',
        className
      )}
      onClick={() => !disabled && onValueChange?.(itemValue)}
      {...props}
    >
      {checked && (
        <Circle className="h-2.5 w-2.5 fill-current text-current mx-auto" />
      )}
    </button>
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
