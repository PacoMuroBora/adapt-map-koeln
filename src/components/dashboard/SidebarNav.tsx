'use client'

import {
  BarChart3,
  BookOpenText,
  LayoutDashboard,
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
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-am-darker text-am-light">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Logo className="text-am-white" height={20} />
        <div className="flex flex-col">
          <span className="font-headings text-xs font-semibold uppercase tracking-[0.18em] text-am-light">
            AdaptMap
          </span>
          <span className="text-[11px] text-foreground-alt">Editor Dashboard</span>
        </div>
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
                'group flex items-center gap-3 rounded-full px-3 py-2 text-sm transition-colors',
                'hover:bg-am-light/10 hover:text-am-white',
                isActive
                  ? 'bg-am-light/15 text-am-white'
                  : 'text-foreground-alt',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border border-border text-am-light',
                  isActive && 'border-am-green-alt bg-am-green/10 text-am-green-alt',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}

        <div className="mt-6 rounded-lg border border-border/40 bg-am-darker/80 p-3 text-xs text-foreground-alt">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-am-light">
            <BarChart3 className="h-3 w-3" />
            <span>Analytics Overview</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Behalte Submissions und Knowledge-Base-Empfehlungen im Blick – alles in einem Dashboard.
          </p>
        </div>
      </nav>

      <UserPanel />
    </aside>
  )
}

