import type { ReactNode } from 'react'

import { SidebarNav } from './SidebarNav'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-am-darker text-am-light">
      <SidebarNav />
      <main className="flex-1 overflow-hidden bg-background/95 text-foreground">
        <div className="mx-auto flex h-screen max-w-6xl flex-col gap-4 px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

