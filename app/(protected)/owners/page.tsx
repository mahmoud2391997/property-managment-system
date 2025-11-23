import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { DeleteButtonIcon } from '@/components/costume-ui/icon'
import OwnersTable from '@/components/tables/owners-table'
import AddOwnerDialog from '@/components/dialogs/add-owner-dialog'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getOwners() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get staff info to find organization
  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return []
  }

  // Get owners with property count
  const owners = await prisma.owners.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone_number: true,
      email: true,
      profile_pic: true,
      _count: {
        select: {
          contracts: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return owners
}

const Owners = async () => {
  const owners = await getOwners()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Owners</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search owners' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />
          <AddOwnerDialog />
        </div>
      </div>
      {/* Table */}
      <div>
        <OwnersTable data={owners} />
      </div>
    </div>
  )
}

export default Owners
