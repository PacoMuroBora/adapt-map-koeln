import type { User } from '@/payload-types'

export type DashboardUser = User

export interface UserContextValue {
  user: DashboardUser | null
  loading: boolean
  error: string | null
  initialized: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

