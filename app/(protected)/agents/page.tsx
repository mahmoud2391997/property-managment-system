import { cn } from '@/lib/utils'
import AgentsSection from '@/components/sections/agents-section'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

async function getAgents() {
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

  const agents = await prisma.agents.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone_number: true,
      email: true,
      _count: {
        select: {
          leases: true
        }
      }
    }
  })

  return agents
}

const Agents = async () => {
  const agents = await getAgents()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Agents</h1>
      </div>
      <AgentsSection agents={agents} />
    </div>
  )
}

export default Agents
