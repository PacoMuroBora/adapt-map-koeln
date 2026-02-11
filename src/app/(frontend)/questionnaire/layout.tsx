import type React from 'react'

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[calc(100vh-3.5rem)] overflow-hidden bg-black">{children}</div>
}
