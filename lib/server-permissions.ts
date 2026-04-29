import { redirect } from 'next/navigation'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function requirePermission(perm: string) {
  const { permissions, error } = await getUserAndStaff()
  if (error) redirect('/login')
  if (!permissions.has(perm)) redirect('/unauthorized')
}

export async function requireAnyPermission(...perms: string[]) {
  const { permissions, error } = await getUserAndStaff()
  if (error) redirect('/login')
  if (!perms.some((p) => permissions.has(p))) redirect('/unauthorized')
}
