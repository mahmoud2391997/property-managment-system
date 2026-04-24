import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import LeaseDetailsContent from '@/components/lease-details/lease-details-content'
import { getLeaseDetails } from '@/utils/get-lease-details'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ leaseId: string }>
}

export default async function RentalLeaseDetailsPage({ params }: Props) {
  await requirePermission('leases.access')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
