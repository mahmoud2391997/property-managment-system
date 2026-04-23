import { cn } from '@/lib/utils'
import StaffSection from '@/components/sections/staff-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { requirePermission } from '@/lib/server-permissions'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeft } from 'lucide-react'

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
      <div className="flex items-center justify-between">
        <h1>Staff</h1>
        <ManageRolesButton />
      </div>
      <StaffSection staff={staffList} currentUserId={currentUserId} />
    </div>
  )
}

async function ManageRolesButton() {
  'use server'
  
  try {
    const { user, staff, permissions, error } = await getUserAndStaff()
    
    if (error) return null
    
    console.log('ManageRolesButton Debug:', {
      userId: user?.id,
      staffId: staff?.id,
      permissionsCount: permissions?.size || 0,
      hasRolesAccess: hasPermission(permissions, 'roles.access')
    })
    
    if (!permissions || !hasPermission(permissions, 'roles.access')) {
      return null
    }

    return (
      <Link href="/staff/roles">
        <Button variant="default" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Manage Roles
        </Button>
      </Link>
    )
  } catch (error) {
    console.error('Error in ManageRolesButton:', error)
    return null
  }
}

export default Staff
