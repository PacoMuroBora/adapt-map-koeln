import { cn } from '@/utilities/ui'
import * as React from 'react'
import { Label } from './label'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  required?: boolean
  error?: string
  helpText?: string
  layout?: 'vertical' | 'horizontal'
  children: React.ReactNode
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, label, required, error, helpText, layout = 'vertical', children, ...props }, ref) => {
    const fieldId = React.useId()
    const errorId = error ? `${fieldId}-error` : undefined
    const helpId = helpText ? `${fieldId}-help` : undefined
    const ariaDescribedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined

    return (
      <div
        ref={ref}
        className={cn('space-y-2', layout === 'horizontal' && 'flex flex-col md:flex-row md:items-start md:gap-4', className)}
        {...props}
      >
        {label && (
          <Label
            htmlFor={fieldId}
            className={cn(
              'font-body text-sm font-normal text-foreground',
              required && "after:content-['*'] after:ml-0.5 after:text-destructive",
              layout === 'horizontal' && 'md:w-32 md:pt-2'
            )}
          >
            {label}
          </Label>
        )}
        <div className={cn('flex-1', layout === 'horizontal' && 'md:flex-1')}>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                id: fieldId,
                'aria-invalid': error ? true : undefined,
                'aria-describedby': ariaDescribedBy,
                ...(error && { className: cn(child.props.className, 'border-error focus-visible:ring-error') }),
              })
            }
            return child
          })}
          {error && (
            <p id={errorId} className="mt-1 font-body text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {helpText && !error && (
            <p id={helpId} className="mt-1 font-body text-sm text-muted-foreground">
              {helpText}
            </p>
          )}
        </div>
      </div>
    )
  }
)
Field.displayName = 'Field'

export { Field }
