'use server'

import { cache } from 'react'
import { NextResponse } from 'next/server'

type UserType = 'staff' | 'tenant' | null
type OrganizationId = string | null
type TenantId = string | null

type Success = {
  user: any
  userType: UserType
  organizationId: OrganizationId
  tenantId: TenantId
  error: null
}

type Failure = {
  user: null
  userType: null
  organizationId: null
  tenantId: null
  error: NextResponse
}

export const getUserType = cache(async (): Promise<Success | Failure> => {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      userType: null,
      organizationId: null,
      tenantId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Check if user is staff
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (staff) {
    return {
      user,
      userType: 'staff',
      organizationId: staff.organization_id,
      tenantId: null,
      error: null
    }
  }

  // Check if user is tenant
  const tenant = await prisma.tenants.findUnique({
    where: { id: user.id },
    select: { id: true }
  })

  if (tenant) {
    return {
      user,
      userType: 'tenant',
      organizationId: null,
      tenantId: tenant.id,
      error: null
    }
  }

  // User exists in auth but not in either table
  return {
    user: null,
    userType: null,
    organizationId: null,
    tenantId: null,
    error: NextResponse.json({ error: 'User not found in tenant or staff table' }, { status: 404 })
  }
})
