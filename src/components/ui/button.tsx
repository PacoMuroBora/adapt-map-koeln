import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-body ring-offset-background transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
      shape: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-4 py-2 text-body uppercase',
        sm: 'h-9 px-3 text-body',
        lg: 'h-14 p-2 text-body uppercase',
        icon: 'h-10 w-10',
        mini: 'h-8 px-3',
        tiny: 'h-6 px-2 text-body-sm',
      },
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary-hover border border-primary active:bg-hover disabled:bg-gray-300 disabled:text-gray-500',
        white:
          'bg-white text-white-foreground border border-white hover:bg-black hover:text-white active:bg-black disabled:bg-gray-300 disabled:text-gray-500',
        black:
          'bg-black text-black-foreground border border-black hover:bg-white hover:text-black active:bg-black disabled:bg-gray-300 disabled:text-gray-500',
        outline:
          'border border-border bg-background text-foreground hover:bg-muted active:bg-muted/80 disabled:border disabled:bg-gray-100 disabled:text-gray-400',
        destructive:
          'bg-[#ff8429] text-white hover:bg-[#e6731f] active:bg-[#d4661a] disabled:bg-orange-200 disabled:text-orange-400',
        ghost:
          'bg-transparent text-foreground hover:bg-muted/50 active:bg-muted/70 disabled:text-gray-400',
        'ghost-muted':
          'bg-transparent text-muted-foreground/50 hover:bg-muted/30 active:bg-muted/50 disabled:opacity-20 disabled:text-gray-300',
      },
      shape: {
        default: 'rounded-lg',
        round: 'rounded-full',
      },
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Named slot: icon before the text. When size is "lg", wrapped in a bordered div. */
  iconBefore?: React.ReactNode
  /** Named slot: icon after the text. When size is "lg", wrapped in a bordered div. */
  iconAfter?: React.ReactNode
}

const iconSlotClasses = (shape: 'default' | 'round') =>
  cn(
    'inline-flex shrink-0 items-center justify-center border border-current p-0.5 h-full aspect-square',
    shape === 'round' ? 'rounded-full' : 'rounded-[0.25rem]',
  )

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, shape, asChild = false, iconBefore, iconAfter, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isLarge = size === 'lg'
    const wrapIcon = (node: React.ReactNode) =>
      isLarge ? <div className={iconSlotClasses(shape ?? 'default')}>{node}</div> : node
    const iconBeforeSlot =
      iconBefore !== undefined && iconBefore !== null ? wrapIcon(iconBefore) : null
    const iconAfterSlot = iconAfter !== undefined && iconAfter !== null ? wrapIcon(iconAfter) : null
    const hasText = React.Children.count(children) > 0
    const hasIcon = iconBeforeSlot !== null || iconAfterSlot !== null
    const content = (
      <>
        {iconBeforeSlot}
        <span className={isLarge ? 'px-2' : ''}>{children}</span>
        {iconAfterSlot}
      </>
    )
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, shape, className }),
          hasIcon && hasText && 'gap-2',
        )}
        ref={ref}
        {...props}
      >
        {content}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
