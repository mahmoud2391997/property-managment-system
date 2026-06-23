'use client'
import { useUser } from '@/contexts/user-context'

export function usePermissions() {
  const { can, canAny, permissions, isLoading } = useUser()
  return { can, canAny, permissions, isLoading }
}
