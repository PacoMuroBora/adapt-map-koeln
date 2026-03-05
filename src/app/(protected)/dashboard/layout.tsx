import type { ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { getMeUser } from '@/utilities/getMeUser'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Enforce authentication based on Payload cookie / REST API
  const { user } = await getMeUser({
    nullUserRedirect: '/login',
  })

  const roles = (user as any)?.roles
  if (roles !== 'admin' && roles !== 'editor') {
    redirect('/')
  }

  return <>{children}</>
}

