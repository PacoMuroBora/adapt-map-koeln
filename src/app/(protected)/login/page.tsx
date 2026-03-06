'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo/Logo'
import { useUser } from '@/providers/User'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email || !password) return

    setSubmitting(true)
    try {
      await login(email, password)
      router.push('/dashboard/submissions')
    } catch {
      // error state is handled in context
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy = loading || submitting

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-lg bg-background p-8">
        <div className="mb-6 flex flex-col items-center justify-center gap-5">
          <Logo className="text-foreground" height={36} />
          <span className="font-headings text-lg font-semibold tracking-label uppercase leading-none pb-[1px] text-foreground">
            Dashboard
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              E-Mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isBusy}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            size="lg"
            shape="round"
            className="w-full justify-center"
            disabled={isBusy || !email || !password}
          >
            {isBusy ? 'Anmeldung…' : 'Anmelden'}
          </Button>
        </form>
      </div>
    </div>
  )
}
