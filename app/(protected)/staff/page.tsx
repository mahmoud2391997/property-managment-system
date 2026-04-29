import { cn } from '@/lib/utils'
import StaffSection from '@/components/sections/staff-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { requirePermission } from '@/lib/server-permissions'

async function getStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  const staffList = await prisma.staff.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      staff_id: true,
      first_name: true,
      last_name: true,
      phone_number: true,
      profile_pic: true,
      profile_thumb: true,
      roles: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  const supabaseAdmin = createAdminClient()
  const staffWithStatus = await Promise.all(
    staffList.map(async (staffMember) => {
      try {
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(staffMember.id)

        // Check if user account is activated:
        // 1. If they have invited_at: check if they completed password setup (password_set flag in app_metadata)
        // 2. If they don't have invited_at: they were created normally with password already set
        const wasInvited = !!authUser?.invited_at
        const passwordSet = authUser?.app_metadata?.password_set === true

        const isActivated = wasInvited ? passwordSet : true
        const accountStatus = isActivated ? 'Activated' : 'Pending'

        return {
          ...staffMember,
          email: authUser?.email || '',
          accountStatus: accountStatus as 'Activated' | 'Pending'
        }
      } catch (error) {
        return {
          ...staffMember,
          email: '',
          accountStatus: 'Pending' as 'Activated' | 'Pending'
        }
      }
    })
  )

  return staffWithStatus
}



const Staff = async () => {
  await requirePermission('staff.access')
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  const staffList = await getStaff()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div className="flex items-center">
        <h1>Staff</h1>
      </div>
      <StaffSection staff={staffList} currentUserId={currentUserId} />
    </div>
  )
}

export default Staff
