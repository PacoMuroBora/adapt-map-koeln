import { cn } from '@/utilities/ui'
import * as React from 'react'
import Link from 'next/link'

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  variant?: 'black' | 'white'
  shape?: 'default' | 'round'
  size?: 'default' | 'sm' | 'lg' | 'mini'
  external?: boolean
}

const variantClasses = {
  black: 'text-foreground',
  white: 'text-white',
} as const

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      className,
      href,
      variant = 'black',
      shape = 'default',
      size = 'default',
      external,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses = cn(
      'relative inline-block font-sans no-underline transition-colors focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)]',
      'after:absolute after:bottom-0 after:left-0 after:block after:h-px after:w-full after:scale-x-0 after:bg-current after:content-[""] after:transition after:duration-200 after:ease-out after:delay-0 hover:after:scale-x-100 after:origin-right hover:after:origin-left',
      variantClasses[variant],
    )

    const sizeClasses = {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      mini: 'text-xs',
    }

    const shapeClasses = {
      default: 'rounded-sm',
      round: 'rounded-full',
    }

    const content = (
      <>
        {children}
        {external && <span className="ml-1">↗</span>}
      </>
    )

    if (external || href.startsWith('http')) {
      return (
        <a
          ref={ref}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className={cn(baseClasses, sizeClasses[size], shapeClasses[shape], className)}
          {...props}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(baseClasses, sizeClasses[size], shapeClasses[shape], className)}
        {...props}
      >
        {content}
      </Link>
    )
  },
)
LinkButton.displayName = 'LinkButton'

export { LinkButton }
