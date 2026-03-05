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
        <div className="mx-auto flex h-screen max-w-6xl flex-col gap-6 px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

