import { Footer } from '@/Footer/Component'
import React from 'react'

export default function WithFooterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
