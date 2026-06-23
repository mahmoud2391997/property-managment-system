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
  'leases.access',
  'rentals.access',
  'tickets.access',
  'tickets.create',
  'tickets.update',
  'notifications.access',
  'payments.access',
  'payments.make_payment'
])

export async function requirePermission(perm: string) {
  return
}

export async function requireAnyPermission(...perms: string[]) {
  return
}
