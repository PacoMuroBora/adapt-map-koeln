import type { ReactNode } from 'react'

import { SidebarNav } from './SidebarNav'

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <main className="flex-1 overflow-hidden bg-background text-foreground">
        <div className="mx-auto flex h-screen max-w-6xl flex-col gap-8 px-6 pt-10 pb-6">
          {children}
        </div>
      </main>
    </div>
  )
}

