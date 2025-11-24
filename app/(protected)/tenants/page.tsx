import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { DeleteButtonIcon } from '@/components/costume-ui/icon'
import TenantsTable from '@/components/tables/tenants-table'
import AddTenantDialog from '@/components/dialogs/add-tenant-dialog'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

const Tenants = async () => {
  const { staff: currentStaff, error } = await getUserAndStaff()

  if (error) {
    redirect('/login')
  }

  // Fetch tenants for this organization via organizations_tenants junction table
  const organizationTenants = await prisma.organizations_tenants.findMany({
    where: {
      organization_id: currentStaff.organization_id
    },
    select: {
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
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  // Extract tenants from the junction table results and filter for Individual type
  const tenants = organizationTenants
    .map(ot => ot.tenants)
    .filter(tenant => tenant.type === 'Individual')

  // Get account activation status and email from Supabase Auth
  const supabaseAdmin = createAdminClient()
  const tenantsWithStatus = await Promise.all(
    tenants.map(async (tenant) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(tenant.id)

      const wasInvited = !!authUser?.user?.invited_at
      const passwordSet = authUser?.user?.app_metadata?.password_set === true
      const isActivated = wasInvited ? passwordSet : true

      return {
        ...tenant,
        email: authUser?.user?.email || '',
        accountStatus: isActivated ? 'Activated' as const : 'Pending' as const
      }
    })
  )

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tenants</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search tenants' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />
          <AddTenantDialog />
        </div>
      </div>
      {/* Table */}
      <TenantsTable data={tenantsWithStatus} />
    </div>
  )
}

export default Tenants
