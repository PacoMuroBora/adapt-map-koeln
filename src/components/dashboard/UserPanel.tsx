'use client'

import { LogOut, UserCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { useUser } from '@/providers/User'

export function UserPanel() {
  const router = useRouter()
  const { user, loading, logout } = useUser()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="border-t border-border px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/40 text-foreground">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {loading ? 'Lade…' : user?.name || user?.email || 'Unbekannt'}
          </p>
          {user?.roles && (
            <p className="truncate text-xs text-foreground-alt">
              {typeof user.roles === 'string' ? user.roles : String(user.roles)}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost-muted"
        size="mini"
        shape="round"
        className="mt-3 w-full justify-center gap-2 text-xs text-foreground-alt hover:text-foreground"
        onClick={handleLogout}
        disabled={loading}
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </Button>
    </div>
  )
}

