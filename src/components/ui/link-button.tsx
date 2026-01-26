import { cn } from '@/utilities/ui'
import * as React from 'react'
import Link from 'next/link'

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  shape?: 'default' | 'round'
  size?: 'default' | 'sm' | 'lg' | 'mini'
  external?: boolean
}

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, href, shape = 'default', size = 'default', external, children, ...props }, ref) => {
    const baseClasses = 'font-sans text-foreground no-underline transition-all hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.1)]'
    
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
  }
)
LinkButton.displayName = 'LinkButton'

export { LinkButton }
