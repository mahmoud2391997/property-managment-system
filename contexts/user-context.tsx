'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { mockGetCurrentUser, mockLogout, type MockUser } from '@/lib/mock-auth'

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
  const [data, setData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get current user from mock auth storage
    const mockUser = mockGetCurrentUser()
    
    if (mockUser) {
      const permissions = mockUser.user_type === 'admin' 
        ? ['read', 'write', 'delete', 'manage_users']
        : mockUser.user_type === 'staff'
        ? ['read', 'write']
        : ['read']

      setData({
        user: mockUser,
        role: mockUser.user_type,
        permissions,
      })
    } else {
      setData(null)
    }
    
    setIsLoading(false)
  }, [])

  const permissions = useMemo(
    () => new Set<string>(data?.permissions ?? []),
    [data]
  )

  const handleLogout = () => {
    mockLogout()
    setData(null)
  }

  const value: UserContextValue = useMemo(() => ({
    user: data?.user ?? null,
    role: data?.role ?? null,
    permissions,
    can: (perm: string) => permissions.has(perm),
    canAny: (...perms: string[]) => perms.some(p => permissions.has(p)),
    isLoading,
    logout: handleLogout
  }), [data, permissions, isLoading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
