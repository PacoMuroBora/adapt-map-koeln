'use client'

import React, { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

import { dashboardFetch } from '@/lib/dashboard-api'
import type { UserContextValue, DashboardUser } from './types'

const UserContext = createContext<UserContextValue | null>(null)

async function fetchMe(): Promise<DashboardUser | null> {
  try {
    const data = await dashboardFetch<{ user: DashboardUser | null }>('/api/dashboard/auth/me', {
      method: 'GET',
    })
    return data.user ?? null
  } catch (error: any) {
    if (typeof error?.status === 'number' && (error.status === 401 || error.status === 403)) {
      return null
    }
    throw error
  }
}

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await fetchMe()
      setUser(me)
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden des Benutzers')
      setUser(null)
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      // Payload's REST auth endpoint; cookie will be set HttpOnly
      const data = await dashboardFetch<{ user: DashboardUser }>('/api/users/login', {
        method: 'POST',
        body: { email, password },
      })
      setUser(data.user)
    } catch (err: any) {
      setError(err?.message || 'Login fehlgeschlagen')
      setUser(null)
      throw err
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await dashboardFetch('/api/dashboard/auth/logout', { method: 'POST' })
    } catch (err: any) {
      // Even if logout fails, clear local state
      setError(err?.message || 'Logout fehlgeschlagen')
    } finally {
      setUser(null)
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  const value: UserContextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      initialized,
      refresh,
      login,
      logout,
    }),
    [user, loading, error, initialized, refresh, login, logout],
  )

  return <UserContext value={value}>{children}</UserContext>
}

export const useUser = (): UserContextValue => {
  const ctx = use(UserContext)
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return ctx
}

