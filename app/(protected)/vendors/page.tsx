import { cn } from '@/lib/utils'
import VendorsSection from '@/components/sections/vendors-section'
import { requirePermission } from '@/lib/server-permissions'

async function getVendors() {
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

  const vendors = await prisma.vendors.findMany({
    where: {
      organization_id: staff.organization_id
    },
    select: {
      id: true,
      name: true,
      phone_number: true,
      email: true
    }
  })

  return vendors
}

const Vendors = async () => {
  await requirePermission('vendors.access')
  const vendors = await getVendors()

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Vendors</h1>
      </div>
      <VendorsSection vendors={vendors} />
    </div>
  )
}

export default Vendors
