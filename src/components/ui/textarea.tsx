import { cn } from '@/utilities/ui'
import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  shape?: 'default' | 'round'
  size?: 'default' | 'sm' | 'lg'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, shape = 'default', size = 'default', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full font-body text-sm font-normal bg-background text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50',
          // Shape variants
          {
            'rounded-lg border border-border': shape === 'default',
            'rounded-full border border-border': shape === 'round',
          },
          // Size variants
          {
            'px-3 py-2': size === 'default',
            'px-2 py-1.5 text-sm': size === 'sm',
            'px-4 py-3': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
