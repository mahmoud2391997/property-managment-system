import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import TicketsSection from '@/components/tickets-section'

async function getUserType(): Promise<'staff' | 'tenant'> {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return 'staff'
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (staff) {
      return 'staff'
    }

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (tenant) {
      return 'tenant'
    }

    return 'staff'
  } catch (error) {
    console.error('Error getting user type:', error)
    return 'staff'
  }
}

const Tickets = async () => {
  const userType = await getUserType()

  return <TicketsSection userType={userType} />
}

export default Tickets
