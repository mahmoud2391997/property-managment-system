import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import TenantsSection from '@/components/sections/tenants-section'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { transformTenant, TenantWithDetails } from '@/lib/tenants-utils'
import TablePageSkeleton from '@/components/loading-ui/table-page-skeleton'

const PAGE_SIZE = 10

// Shared select for tenant queries via organizations_tenants junction table
const tenantSelect = {
  tenants: {
    select: {
      id: true,
      type: true,
      profile_pic: true,
      profile_thumb: true,
      individual_tenants: {
        select: {
          identity_type: true,
          identity_number: true,
          first_name: true,
          last_name: true,
          phone_number: true
        }
      }
    }
  }
}

async function getTenants(organizationId: string): Promise<{ data: TenantWithDetails[]; total: number }> {
  try {
    const whereClause = {
      organization_id: organizationId,
      tenants: {
        type: 'Individual' as const
      }
    }

    // Fetch first page of tenants and total count in parallel
    const [organizationTenants, total] = await Promise.all([
      prisma.organizations_tenants.findMany({
        where: whereClause,
        select: tenantSelect,
        orderBy: { created_at: 'desc' },
        take: PAGE_SIZE
      }),
      prisma.organizations_tenants.count({ where: whereClause })
    ])

    // Get tenant IDs for active lease count query
    const tenantIds = organizationTenants.map(ot => ot.tenants.id)

    // Get active lease counts for all tenants in one query
    let leaseCountMap = new Map<string, number>()

    if (tenantIds.length > 0) {
      const activeLeases = await prisma.leases.findMany({
        where: {
          tenant_id: { in: tenantIds },
          organization_id: organizationId,
          status: 'Current'
        },
        select: { tenant_id: true }
      })

      // Count leases per tenant
      for (const lease of activeLeases) {
        const currentCount = leaseCountMap.get(lease.tenant_id) || 0
        leaseCountMap.set(lease.tenant_id, currentCount + 1)
      }
    }

    // Get account activation status and email from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const tenantsWithStatus = await Promise.all(
      organizationTenants.map(async (ot) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(ot.tenants.id)

        const wasInvited = !!authUser?.user?.invited_at
        const passwordSet = authUser?.user?.app_metadata?.password_set === true
        const isActivated = wasInvited ? passwordSet : true
        const email = authUser?.user?.email || ''
        const accountStatus = isActivated ? 'Activated' as const : 'Pending' as const
        const activeLeaseCount = leaseCountMap.get(ot.tenants.id) || 0

        return transformTenant(ot, email, accountStatus, activeLeaseCount)
      })
    )

    return {
      data: tenantsWithStatus,
      total
    }
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return { data: [], total: 0 }
  }
}

const Tenants = async () => {
  const { staff: currentStaff, error } = await getUserAndStaff()

  if (error) {
    redirect('/login')
  }

  const { data: initialData, total: initialTotal } = await getTenants(currentStaff.organization_id)

  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <div className={cn('flex flex-col gap-2.5', 'h-full')}>
        {/* Heading */}
        <div>
          <h1>Tenants</h1>
        </div>
        <TenantsSection
          initialData={initialData}
          initialTotal={initialTotal}
        />
      </div>
    </Suspense>
  )
}

export default Tenants
