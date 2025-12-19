import type { Access } from 'payload'

import type { User } from '@/payload-types'

export const adminOrEditor: Access<User> = ({ req: { user } }) => {
  const roles = (user as any)?.roles
  return roles === 'admin' || roles === 'editor'
}

