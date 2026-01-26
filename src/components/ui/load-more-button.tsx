'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { ChevronDown, Loader2 } from 'lucide-react'
import * as React from 'react'

export interface LoadMoreButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  isLoading?: boolean
}

const LoadMoreButton = React.forwardRef<HTMLButtonElement, LoadMoreButtonProps>(
  ({ className, children = 'WEITER', isLoading = false, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        shape="round"
        size="lg"
        disabled={disabled || isLoading}
        className={cn('gap-2', className)}
        {...props}
      >
        <span>{children}</span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
    )
  }
)
LoadMoreButton.displayName = 'LoadMoreButton'

export { LoadMoreButton }
