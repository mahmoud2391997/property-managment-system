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

async function getTenants(): Promise<{ data: TenantWithDetails[]; total: number }> {
  try {
    const { staff: currentStaff, error } = await getUserAndStaff()

    if (error) {
      return { data: [], total: 0 }
    }

    const whereClause = {
      organization_id: currentStaff.organization_id,
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

        return transformTenant(ot, email, accountStatus)
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

  const { data: initialData, total: initialTotal } = await getTenants()

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
