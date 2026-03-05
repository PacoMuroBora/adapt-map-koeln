import type { ReactNode } from 'react'

import '../(frontend)/globals.css'

import { GeistMono } from 'geist/font/mono'

import { Providers } from '@/providers'

export default function ProtectedRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={GeistMono.variable}>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

