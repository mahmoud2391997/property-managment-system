import { notFound, redirect } from 'next/navigation'
import LeaseDetailsContent from '@/components/lease-details/lease-details-content'
import { getLeaseDetails } from '@/utils/get-lease-details'

type Props = {
  params: Promise<{ leaseId: string }>
}

export default async function RentalLeaseDetailsPage({ params }: Props) {
  const { data: { user } } = 
  const userType = user?.user_metadata?.user_type

  if (userType !== 'tenant') {
    await requirePermission('leases.access')
  }

  if (!user) {
    redirect('/login')
  }

  // Verify user is a tenant
  const tenant = await prisma.tenants.findUnique({
    where: { id: user.id },
    select: { id: true }
  })

  if (!tenant) {
    // Not a tenant, redirect to login or show not found
    redirect('/login')
  }

  const { leaseId } = await params

  // Fetch lease details for this tenant
  const data = await getLeaseDetails(leaseId, null, tenant.id)

  if (!data) {
    notFound()
  }

  // Determine sourceType based on whether lease has a room
  const sourceType = data.lease.room ? 'room' : 'property'
  const sourceId = data.lease.room?.id || data.lease.property.id

  return (
    <LeaseDetailsContent
      data={data}
      sourceType={sourceType}
      sourceId={sourceId}
      userType="tenant"
    />
  )
}
