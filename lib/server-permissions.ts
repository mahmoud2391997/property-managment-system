import { redirect } from 'next/navigation'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { getUserType } from '@/utils/getUserType'

const TENANT_PERMISSIONS = new Set<string>([
  'tenants.access',
  'tenants.create',
  'tenants.update',
  'tenants.delete',
  'tenants.view_own',
  'tenants.view_lease',
  'tenants.make_payment',
  'tenants.view_property',
  'tickets.access',
  'tickets.create',
  'tickets.update',
  'notifications.access'
])

export async function requirePermission(perm: string) {
  const { userType, error } = await getUserType()
  if (error) redirect('/login')

  if (userType === 'tenant') {
    if (!TENANT_PERMISSIONS.has(perm)) redirect('/unauthorized')
    return
  }

  const { permissions, error: staffError } = await getUserAndStaff()
  if (staffError) redirect('/login')
  if (!permissions.has(perm)) redirect('/unauthorized')
}

export async function requireAnyPermission(...perms: string[]) {
  const { userType, error } = await getUserType()
  if (error) redirect('/login')

  if (userType === 'tenant') {
    if (!perms.some(p => TENANT_PERMISSIONS.has(p))) redirect('/unauthorized')
    return
  }

  const { permissions, error: staffError } = await getUserAndStaff()
  if (staffError) redirect('/login')
  if (!perms.some(p => permissions.has(p))) redirect('/unauthorized')
}
