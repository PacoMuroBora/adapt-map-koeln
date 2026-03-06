'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'
import { primaryNav } from './nav-config'
import { UserPanel } from './UserPanel'

export function SidebarNav() {
  const pathname = usePathname()
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const justClickedRef = useRef<string | null>(null)

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-border bg-secondary text-foreground md:flex">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo className="text-am-darker" height={22} />
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {primaryNav.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard')
          const isHovered = hoveredHref === item.href
          const justClicked = justClickedRef.current === item.href
          const showActiveStyle = isActive && !isHovered && !justClicked

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredHref(item.href)}
              onMouseLeave={() => {
                setHoveredHref(null)
                justClickedRef.current = null
              }}
              onMouseDown={() => {
                justClickedRef.current = item.href
              }}
              className={cn(
                'group flex items-center gap-3 rounded-full px-3 py-2 text-lg transition-colors',
                'hover:bg-muted/10 hover:text-foreground',
                showActiveStyle && 'bg-am-green/40',
                isActive && 'text-foreground',
                !isActive && 'text-foreground-alt',
              )}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-am-white text-foreground"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <UserPanel />
    </aside>
  )
}

