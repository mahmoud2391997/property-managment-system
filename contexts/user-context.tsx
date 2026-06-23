'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { MOCK_ADMIN_USER, mockLogout, type MockUser } from '@/lib/mock-auth'

type UserData = {
  user: MockUser | null
  role: string | null
  permissions: string[]
}

type UserContextValue = {
  user: UserData['user']
  role: UserData['role']
  permissions: Set<string>
  can: (perm: string) => boolean
  canAny: (...perms: string[]) => boolean
  isLoading: boolean
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Auto-load demo admin user for demo purposes
  const [data] = useState<UserData>(() => {
    const permissions = ['read', 'write', 'delete', 'manage_users']
    return {
      user: MOCK_ADMIN_USER,
      role: 'admin',
      permissions,
    }
  })

  const permissions = useMemo(
    () => new Set<string>(data?.permissions ?? []),
    [data]
  )

  const handleLogout = () => {
    mockLogout()
  }

  const value: UserContextValue = useMemo(() => ({
    user: data?.user ?? null,
    role: data?.role ?? null,
    permissions,
    can: (perm: string) => permissions.has(perm),
    canAny: (...perms: string[]) => perms.some(p => permissions.has(p)),
    isLoading: false,
    logout: handleLogout
  }), [data, permissions])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
