'use client'

import type { ReactNode } from 'react'

import { Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Logo } from '@/components/Logo/Logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/utilities/ui'
import { primaryNav } from './nav-config'
import { SidebarNav } from './SidebarNav'
import { UserPanel } from './UserPanel'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-background text-foreground md:flex-row">
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-secondary px-4 md:hidden">
        <Logo className="text-am-darker" height={22} />
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Menü öffnen"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="flex w-3/4 max-w-xs flex-col border-r border-border bg-secondary p-0"
        >
          <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-6">
            <Logo className="text-am-darker" height={22} />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {primaryNav.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (pathname?.startsWith(item.href) && item.href !== '/dashboard')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-3 py-2.5 text-lg transition-colors',
                    'hover:bg-muted/10 hover:text-foreground',
                    isActive ? 'bg-am-green/40 text-foreground' : 'text-foreground-alt',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-am-white text-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <UserPanel />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <SidebarNav />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground pt-14 md:pt-0">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col gap-8 px-3 pb-0 pt-4 md:px-6 md:pb-6 md:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
