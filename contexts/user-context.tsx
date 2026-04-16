'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type UserData = {
  user: { id: string; email: string } | null
  staff: { id: string; organization_id: string } | null
  role: string | null
  permissions: string[]
}

type UserContextValue = {
  user: UserData['user']
  staff: UserData['staff']
  role: UserData['role']
  permissions: Set<string>
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isLoading: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/user/info', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(json => { if (!cancelled) setData(json) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const permissions = useMemo(
    () => new Set<string>(data?.permissions ?? []),
    [data]
  )

  const value: UserContextValue = useMemo(() => ({
    user: data?.user ?? null,
    staff: data?.staff ?? null,
    role: data?.role ?? null,
    permissions,
    can: (perm: string) => permissions.has(perm),
    canAny: (...perms: string[]) => perms.some(p => permissions.has(p)),
    isLoading
  }), [data, permissions, isLoading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
