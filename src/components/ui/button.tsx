import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-sans text-base font-normal leading-none tracking-[1px] ring-offset-background transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
      shape: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
        mini: 'h-8 w-8',
        tiny: 'h-6 w-6 text-xs',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 disabled:bg-gray-300 disabled:text-gray-500',
        secondary: 'bg-[#141418] text-white hover:bg-[#1e1e20] active:bg-[#2a2a2e] disabled:bg-gray-300 disabled:text-gray-500',
        outline: 'border border-border bg-background text-foreground hover:bg-muted active:bg-muted/80 disabled:border-dashed disabled:bg-gray-100 disabled:text-gray-400',
        destructive: 'bg-[#ff8429] text-white hover:bg-[#e6731f] active:bg-[#d4661a] disabled:bg-orange-200 disabled:text-orange-400',
        ghost: 'bg-transparent text-foreground hover:bg-muted/50 active:bg-muted/70 disabled:text-gray-400',
        'ghost-muted': 'bg-transparent text-muted-foreground/50 hover:bg-muted/30 active:bg-muted/50 disabled:opacity-20 disabled:text-gray-300',
      },
      shape: {
        default: 'rounded-lg',
        round: 'rounded-full',
      },
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
