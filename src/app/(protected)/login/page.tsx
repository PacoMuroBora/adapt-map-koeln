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
    <div className="min-h-screen bg-am-darker text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-am-dark/80 border border-border p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo className="text-am-white" height={20} />
          <span className="font-headings text-lg font-semibold tracking-[0.18em] uppercase text-am-light">
            Editor Dashboard
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground-alt">
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
            <Label htmlFor="password" className="text-foreground-alt">
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

