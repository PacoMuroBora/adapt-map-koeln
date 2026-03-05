'use client'

import {
  BookOpenText,
  LayoutDashboard,
  Map,
  Settings2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'
import { UserPanel } from './UserPanel'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const primaryNav: NavItem[] = [
  {
    label: 'Submissions',
    href: '/dashboard/submissions',
    icon: LayoutDashboard,
  },
  {
    label: 'Map',
    href: '/dashboard/map',
    icon: Map,
  },
  {
    label: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: BookOpenText,
  },
  {
    label: 'Site settings',
    href: '/dashboard/site-settings',
    icon: Settings2,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-secondary text-foreground">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo className="text-am-darker" height={22} />
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {primaryNav.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/dashboard')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-full px-3 py-2 text-lg transition-colors',
                'hover:bg-muted/20 hover:text-foreground',
                isActive ? 'bg-am-green/25 text-foreground' : 'text-foreground-alt',
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-am-white text-foreground',
                  isActive && 'border-am-green-alt bg-am-green/20 text-am-darker',
                )}
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

