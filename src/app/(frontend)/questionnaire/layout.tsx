import type React from 'react'
import QuestionnaireLayoutClient from './QuestionnaireLayoutClient'

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return <QuestionnaireLayoutClient>{children}</QuestionnaireLayoutClient>
}
