import type React from 'react'

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Full-viewport background so it covers the entire screen including behind the navbar */}
      <div className="fixed inset-0 z-0 bg-black" aria-hidden />
      <div className="relative z-10 flex min-h-[calc(100vh-3.5rem)] flex-col bg-black md:justify-center">
        {children}
      </div>
    </>
  )
}
