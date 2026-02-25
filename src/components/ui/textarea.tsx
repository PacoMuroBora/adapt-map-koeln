import { cn } from '@/utilities/ui'
import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'default' | 'sm' | 'lg'
  color: 'purple' | 'orange' | 'green' | 'pink' | 'turquoise'
}

const borderClasses = {
  purple: 'border-am-purple-alt',
  orange: 'border-am-orange-alt',
  green: 'border-am-green-alt',
  pink: 'border-am-pink-alt',
  turquoise: 'border-am-turquoise-alt',
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, color, size = 'default', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] border rounded-2xl w-full font-body text-sm font-normal bg-background text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50',
          // Size variants
          {
            'px-3 py-2': size === 'default',
            'px-2 py-1.5 text-sm': size === 'sm',
            'px-4 py-3': size === 'lg',
          },
          borderClasses[color],
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
