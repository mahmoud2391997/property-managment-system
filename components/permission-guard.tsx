'use client'

import { useUser } from '@/contexts/user-context'
import Unauthorized from '@/app/(protected)/unauthorized'

export function PermissionGuard({
  permission,
  children
}: {
  permission: string
  children: React.ReactNode
}) {
  const { can, isLoading } = useUser()
  if (isLoading) return <div className="flex items-center justify-center h-32">Loading...</div>
  if (!can(permission)) return <Unauthorized />
  return <>{children}</>
}
