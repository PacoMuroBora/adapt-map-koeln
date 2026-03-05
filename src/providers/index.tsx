import React from 'react'

import { SubmissionProvider } from './Submission'
import { UserProvider } from './User'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <UserProvider>
      <SubmissionProvider>{children}</SubmissionProvider>
    </UserProvider>
  )
}
