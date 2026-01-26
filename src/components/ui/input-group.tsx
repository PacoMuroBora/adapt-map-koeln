import { cn } from '@/utilities/ui'
import * as React from 'react'
import { Input, type InputProps } from './input'

export interface InputGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'prefix' | 'suffix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  size?: 'default' | 'sm' | 'lg' | 'mini'
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, prefix, suffix, prefixIcon, suffixIcon, size = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center w-full rounded-lg border border-border bg-background overflow-hidden focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.1)]', className)}
        {...props}
      >
        {prefix && (
          <span className="px-3 py-2 font-body text-sm text-muted-foreground border-r border-border bg-muted/50">
            {prefix}
          </span>
        )}
        {prefixIcon && (
          <span className="px-3 text-muted-foreground flex items-center">
            {prefixIcon}
          </span>
        )}
        <div className="flex-1">
          {React.Children.map(children, (child) => {
            if (React.isValidElement<InputProps>(child) && child.type === Input) {
              return React.cloneElement(child, {
                size,
                className: cn(
                  'border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0',
                  child.props.className
                ),
              })
            }
            return child
          })}
        </div>
        {suffix && (
          <span className="px-3 py-2 font-body text-sm text-muted-foreground border-l border-border bg-muted/50">
            {suffix}
          </span>
        )}
        {suffixIcon && (
          <span className="px-3 text-muted-foreground flex items-center">
            {suffixIcon}
          </span>
        )}
      </div>
    )
  }
)
InputGroup.displayName = 'InputGroup'

export { InputGroup }
