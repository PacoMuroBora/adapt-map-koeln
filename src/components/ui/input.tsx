import { cn } from '@/utilities/ui'
import * as React from 'react'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  shape?: 'default' | 'round'
  size?: 'default' | 'sm' | 'lg' | 'mini'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, shape = 'default', size = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full font-body text-sm font-normal bg-background text-foreground placeholder:text-muted-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50',
          // Size variants
          {
            'h-10 px-3 py-2': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-4': size === 'lg',
            'h-8 px-2 text-xs': size === 'mini',
          },
          // Shape variants
          {
            'rounded-lg border border-border': shape === 'default',
            'rounded-full border border-border': shape === 'round',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
