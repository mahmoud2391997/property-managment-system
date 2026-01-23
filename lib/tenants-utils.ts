// Type for tenant with details used in the tenants table
export type TenantWithDetails = {
  id: string
  type: 'Individual' | 'Company'
  profile_pic: string | null
  profile_thumb: string | null
  first_name: string
  last_name: string | null
  identity_type: 'mykad' | 'passport'
  identity_number: string
  phone_number: string
  email: string
  accountStatus: 'Activated' | 'Pending'
  inviteSent: boolean
  activeLeaseCount: number
  rental_status: 'Renting' | 'Not Renting'
}

// Raw tenant type from Prisma query
type RawTenant = {
  tenants: {
    id: string
    type: string
    profile_pic: string | null
    profile_thumb: string | null
    invite_sent: boolean | null
    individual_tenants: {
      identity_type: string
      identity_number: string
      first_name: string
      last_name: string | null
      phone_number: string
    } | null
  }
}

// Transform raw tenant from Prisma to TenantWithDetails
export function transformTenant(
  raw: RawTenant,
  email: string,
  accountStatus: 'Activated' | 'Pending',
  activeLeaseCount: number = 0
): TenantWithDetails {
  const tenant = raw.tenants
  const individual = tenant.individual_tenants

  return {
    id: tenant.id,
    type: tenant.type as 'Individual' | 'Company',
    profile_pic: tenant.profile_pic,
    profile_thumb: tenant.profile_thumb,
    first_name: individual?.first_name || '',
    last_name: individual?.last_name || null,
    identity_type: (individual?.identity_type as 'mykad' | 'passport') || 'mykad',
    identity_number: individual?.identity_number || '',
    phone_number: individual?.phone_number || '',
    email,
    accountStatus,
    inviteSent: tenant.invite_sent ?? false,
    activeLeaseCount,
    rental_status: activeLeaseCount > 0 ? 'Renting' : 'Not Renting'
  }
}
