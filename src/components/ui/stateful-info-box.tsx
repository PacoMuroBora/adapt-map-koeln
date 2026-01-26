'use client'

import { cn } from '@/utilities/ui'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { Button } from './button'
import { Square, CheckSquare, AlertCircle } from 'lucide-react'

const statefulInfoBoxVariants = cva(
  'relative w-full rounded-lg border p-4 flex items-center justify-between gap-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        error: 'bg-error/10 text-error border-2 border-dashed border-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface StatefulInfoBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statefulInfoBoxVariants> {
  line1: string
  line2?: string
  showIcon?: boolean
  flipIcon?: boolean
  showButton?: boolean
  buttonLabel?: string
  iconType?: 'square' | 'checkbox'
  onButtonClick?: () => void
}

const StatefulInfoBox = React.forwardRef<HTMLDivElement, StatefulInfoBoxProps>(
  (
    {
      line1,
      line2,
      showIcon = false,
      flipIcon = false,
      showButton = false,
      buttonLabel = 'Label',
      iconType = 'square',
      variant = 'default',
      onButtonClick,
      className,
      ...props
    },
    ref
  ) => {
    const IconComponent = iconType === 'checkbox' ? CheckSquare : Square
    const isError = variant === 'error'

    return (
      <div
        ref={ref}
        className={cn(statefulInfoBoxVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn('flex items-center gap-2', {
            'flex-row-reverse': flipIcon,
          })}
        >
          {showIcon && (
            <IconComponent
              className={cn('h-5 w-5 flex-shrink-0', {
                'text-foreground': !isError,
                'text-error': isError,
              })}
            />
          )}
          <div className={cn('flex flex-col', { 'space-y-1': line2 })}>
            <span
              className={cn('font-medium', {
                'text-foreground': !isError,
                'text-error': isError,
              })}
            >
              {line1}
            </span>
            {line2 && (
              <span
                className={cn('text-sm', {
                  'text-muted-foreground': !isError,
                  'text-error': isError,
                })}
              >
                {line2}
              </span>
            )}
          </div>
        </div>

        {showButton && (
          <Button
            variant={isError ? 'destructive' : 'secondary'}
            size="sm"
            onClick={onButtonClick}
            className="rounded-full text-sm h-auto py-1 px-3"
          >
            {buttonLabel}
          </Button>
        )}
      </div>
    )
  }
)
StatefulInfoBox.displayName = 'StatefulInfoBox'

export { StatefulInfoBox }
