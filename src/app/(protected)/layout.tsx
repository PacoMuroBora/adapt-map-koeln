import type { ReactNode } from 'react'

import '../(frontend)/globals.css'

import { GeistMono } from 'geist/font/mono'

import { Providers } from '@/providers'

export default function ProtectedRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={GeistMono.variable}>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon-light.svg" rel="icon" type="image/svg+xml" media="(prefers-color-scheme: light)" />
        <link href="/favicon-dark.svg" rel="icon" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <link href="/favicon-light.svg" rel="icon" type="image/svg+xml" />
        <link href="/favicon-light.svg" rel="apple-touch-icon" sizes="180x180" media="(prefers-color-scheme: light)" />
        <link href="/favicon-dark.svg" rel="apple-touch-icon" sizes="180x180" media="(prefers-color-scheme: dark)" />
        <link href="/favicon-light.svg" rel="apple-touch-icon" sizes="180x180" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

