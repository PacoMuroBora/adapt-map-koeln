'use client'

import { cn } from '@/utilities/ui'
import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

export type RadioCardVariant = 'default' | 'orange'

export interface RadioCardItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {
  icon?: React.ReactNode
  label: string
  /** Unchecked border: "default" = grey/purple (Teil 1), "orange" = orange (Teil 2) */
  variant?: RadioCardVariant
}

const RadioCardItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioCardItemProps
>(({ icon, label, className, disabled, variant = 'default', ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col justify-end gap-4 px-4 py-3 min-h-[120px] rounded-2xl border transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
        // Unchecked states
        'data-[state=unchecked]:bg-background data-[state=unchecked]:text-foreground',
        variant === 'default' &&
          'data-[state=unchecked]:border-border data-[state=unchecked]:hover:bg-[#FBFBF6]',
        variant === 'orange' &&
          'data-[state=unchecked]:border-am-orange-alt data-[state=unchecked]:hover:bg-[#FBFBF6]',
        // Checked states
        'data-[state=checked]:bg-am-green-alt',
        // Disabled
        disabled &&
          'data-[state=unchecked]:!border-border/40 data-[state=unchecked]:!bg-background data-[state=unchecked]:!text-muted-foreground',
        disabled &&
          'data-[state=checked]:!bg-[#E6F7CC] data-[state=checked]:!border-border/40 data-[state=checked]:!text-muted-foreground',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="absolute top-4 right-4 text-foreground group-[&:disabled]:text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      )}
      <span className="text-left w-full uppercase font-mono font-normal text-body">{label}</span>
    </RadioGroupPrimitive.Item>
  )
})
RadioCardItem.displayName = 'RadioCardItem'

const RadioCardGroup = RadioGroupPrimitive.Root

export { RadioCardGroup, RadioCardItem }
