import { cn } from '@/utilities/ui'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from './button'

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        error: 'bg-error/10 text-error border-error',
        success: 'bg-success/10 text-success border-success',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean
  showLine2?: boolean
  showButtons?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, showIcon = false, showLine2 = false, showButtons = false, children, ...props }, ref) => {
    const icon = variant === 'error' ? <AlertCircle className="h-4 w-4" /> 
                : variant === 'success' ? <CheckCircle2 className="h-4 w-4" />
                : showIcon ? <div className="h-4 w-4 border border-muted-foreground" /> : null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && icon}
        <div className={cn('flex items-center justify-between', showButtons && 'gap-4')}>
          <div className={cn('flex flex-col', showLine2 && 'space-y-1')}>
            {children}
          </div>
          {showButtons && (
            <Button variant="ghost" size="sm">
              Action
            </Button>
          )}
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
