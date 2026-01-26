import React from 'react'

import { SubmissionProvider } from './Submission'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return <SubmissionProvider>{children}</SubmissionProvider>
}
