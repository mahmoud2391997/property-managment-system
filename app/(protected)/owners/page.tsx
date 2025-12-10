import { cn } from '@/lib/utils'
import OwnersSection from '@/components/sections/owners-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getOwners() {
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
      profile_thumb: true,
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
      <OwnersSection owners={owners} />
    </div>
  )
}

export default Owners
