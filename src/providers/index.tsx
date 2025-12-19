import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { SubmissionProvider } from './Submission'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <SubmissionProvider>{children}</SubmissionProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
