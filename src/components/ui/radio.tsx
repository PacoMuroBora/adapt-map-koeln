'use client'

import * as React from 'react'
import { cn } from '@/utilities/ui'

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
        'relative aspect-square h-4 w-4 rounded-full border-2 transition-colors ring-offset-background',
        'focus:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Unchecked state
        !checked && [
          'border-border bg-background',
          'hover:border-primary/50',
          'disabled:border-gray-300 disabled:bg-gray-100',
        ],
        // Checked state
        checked && [
          'border-primary bg-primary',
          'hover:bg-primary/90',
          'disabled:border-primary/30 disabled:bg-primary/20',
        ],
        className
      )}
      onClick={() => !disabled && onValueChange?.(itemValue)}
      {...props}
    />
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
