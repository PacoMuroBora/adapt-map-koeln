'use client'

import { cn } from '@/utilities/ui'
import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

export interface RadioFancyItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  icon?: React.ReactNode
  label: string
}

const RadioFancyItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioFancyItemProps
>(
  (
    { icon, label, className, disabled, ...props },
    ref
  ) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex flex-col gap-4 p-4 min-h-[120px] rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed',
          'data-[state=unchecked]:bg-background data-[state=unchecked]:border-border data-[state=unchecked]:text-foreground data-[state=unchecked]:hover:bg-lime-50',
          'data-[state=checked]:bg-lime-300 data-[state=checked]:border-lime-500 data-[state=checked]:text-foreground data-[state=checked]:hover:bg-lime-200',
          disabled && 'bg-gray-100 border-border text-gray-400 opacity-50',
          disabled && 'data-[state=checked]:bg-lime-100',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="self-end">
            {icon}
          </div>
        )}
        <span className="text-center w-full">{label}</span>
      </RadioGroupPrimitive.Item>
    )
  }
)
RadioFancyItem.displayName = 'RadioFancyItem'

const RadioFancyGroup = RadioGroupPrimitive.Root

export { RadioFancyGroup, RadioFancyItem }
