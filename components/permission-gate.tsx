'use client'

import { useUser } from '@/contexts/user-context'

export function PermissionGate({
  permission,
  fallback = null,
  children
}: {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { can, isLoading } = useUser()
  if (isLoading) return null
  if (!can(permission)) return <>{fallback}</>
  return <>{children}</>
}
