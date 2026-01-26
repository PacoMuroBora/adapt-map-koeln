import { cn } from '@/utilities/ui'
import * as React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'block' | 'avatar' | 'line' | 'object'
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'block', ...props }, ref) => {
    const baseClasses = 'animate-pulse bg-muted rounded-lg'
    
    const variantClasses = {
      block: 'w-[200px] h-[100px]',
      avatar: 'w-8 h-8 rounded-full',
      line: 'w-[150px] h-3',
      object: 'w-[100px] h-[50px]',
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Avatar with line skeleton
export const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
    <Skeleton variant="avatar" />
    <Skeleton variant="line" className="w-20" />
  </div>
))
SkeletonAvatar.displayName = 'SkeletonAvatar'

export { Skeleton }
