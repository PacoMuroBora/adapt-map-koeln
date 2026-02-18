import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Check,
  Locate,
  X,
} from 'lucide-react'
import { cn } from '@/utilities/ui'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import Link from 'next/link'
import * as React from 'react'

import type { LinkIconOption } from '@/fields/link'

const BUTTON_ICON_SIZE = 16

const buttonIconMap: Record<
  LinkIconOption,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-right': ArrowUpRight,
  'external-link': ExternalLink,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  check: Check,
  plus: Plus,
  close: X,
  locate: Locate,
}

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-body ring-offset-background transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
      shape: 'round',
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
          'bg-white text-white-foreground hover:bg-primary active:bg-primary disabled:bg-gray-300 disabled:text-gray-500',
        black:
          'bg-black text-black-foreground border border-black hover:bg-white hover:text-black active:bg-black disabled:bg-gray-300 disabled:text-gray-500',
        outline:
          'border border-border bg-background text-foreground hover:bg-accent/60 hover:text-accent-foreground active:bg-accent/40 disabled:border disabled:bg-gray-100 disabled:text-gray-400',
        'outline-white':
          'border border-white/30 bg-white/5 text-white hover:bg-white hover:text-black active:bg-white/40 disabled:border disabled:bg-gray-100 disabled:text-gray-400',
        destructive:
          'bg-[#ff8429] text-white hover:bg-[#e6731f] active:bg-[#d4661a] disabled:bg-orange-200 disabled:text-orange-400',
        ghost:
          'bg-transparent text-foreground hover:bg-muted/50 active:bg-muted/70 disabled:text-gray-400',
        'ghost-muted':
          'bg-transparent text-muted-foreground hover:bg-muted/30 active:bg-muted/50 disabled:text-gray-400',
        muted:
          'bg-muted text-muted-foreground/50 hover:bg-muted/30 active:bg-muted/50 disabled:opacity-20 disabled:text-gray-300',
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
  /** When provided, renders as a Next.js Link instead of a button. */
  href?: string
  /** Open link in new tab. Only used when href is provided. */
  newTab?: boolean
  /** Icon before the text (Payload link icon option). When size is "lg", wrapped in a bordered div. */
  iconBefore?: LinkIconOption | null
  /** Icon after the text (Payload link icon option). When size is "lg", wrapped in a bordered div. */
  iconAfter?: LinkIconOption | null
}

const iconSlotClasses = (shape: 'default' | 'round') =>
  cn(
    'inline-flex shrink-0 items-center justify-center border border-current p-0.5 h-full aspect-square',
    shape === 'round' ? 'rounded-full' : 'rounded-[0.25rem]',
  )

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      asChild = false,
      href,
      newTab,
      iconBefore,
      iconAfter,
      children,
      ...props
    },
    ref,
  ) => {
    const isLarge = size === 'lg'
    const wrapIcon = (node: React.ReactNode) =>
      node != null && isLarge ? (
        <div className={iconSlotClasses(shape ?? 'default')}>{node}</div>
      ) : (
        node
      )
    const renderIcon = (option: LinkIconOption | null | undefined): React.ReactNode => {
      if (!option || !(option in buttonIconMap)) return null
      const Icon = buttonIconMap[option as LinkIconOption]
      const node = Icon ? <Icon className="shrink-0" size={BUTTON_ICON_SIZE} /> : null
      return node ? wrapIcon(node) : null
    }
    const iconBeforeSlot = renderIcon(iconBefore)
    const iconAfterSlot = renderIcon(iconAfter)
    const hasText = React.Children.count(children) > 0
    const hasIcon = iconBeforeSlot !== null || iconAfterSlot !== null
    const isIconOnly = !hasText && hasIcon && !(iconBefore && iconAfter)
    const content = (
      <>
        {iconBeforeSlot}
        <span className={isLarge ? 'px-2' : ''}>{children}</span>
        {iconAfterSlot}
      </>
    )
    const classes = cn(
      buttonVariants({ variant, size, shape, className }),
      hasIcon && hasText && 'gap-2',
      isIconOnly && 'aspect-square p-0',
    )

    // Render as Link when href is provided
    if (href) {
      const linkProps = newTab ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}
      return (
        <Link href={href} className={classes} {...linkProps}>
          {content}
        </Link>
      )
    }

    // Render as button or Slot
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={classes} ref={ref} {...props}>
        {content}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
