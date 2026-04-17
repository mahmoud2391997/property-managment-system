import { cn } from '@/lib/utils'
import OwnersSection from '@/components/sections/owners-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/server-permissions'

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
          properties: true
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  // Get current contract counts for all owners
  const ownerIds = owners.map(o => o.id)
  let contractCountMap = new Map<string, number>()

  if (ownerIds.length > 0) {
    const currentContracts = await prisma.contracts.findMany({
      where: {
        owner_id: { in: ownerIds },
        organization_id: staff.organization_id,
        status: 'Current'
      },
      select: { owner_id: true }
    })

    for (const contract of currentContracts) {
      const count = contractCountMap.get(contract.owner_id) || 0
      contractCountMap.set(contract.owner_id, count + 1)
    }
  }

  return owners.map(owner => ({
    ...owner,
    currentContractCount: contractCountMap.get(owner.id) || 0
  }))
}

const Owners = async () => {
  await requirePermission('owners.access')
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
