import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import LeaseDetailsContent from '@/components/lease-details/lease-details-content'
import { getLeaseDetails } from '@/utils/get-lease-details'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string; leaseId: string }>
}

async function getUserType(): Promise<{ userType: 'staff' | 'tenant'; organizationId: string | null; tenantId: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { userType: 'staff', organizationId: null, tenantId: null }
  }

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (staff) {
    return { userType: 'staff', organizationId: staff.organization_id, tenantId: null }
  }

  const tenant = await prisma.tenants.findUnique({
    where: { id: user.id },
    select: { id: true }
  })

  return { userType: 'tenant', organizationId: null, tenantId: tenant?.id || null }
}

export default async function LeaseDetailsPage({ params }: Props) {
  await requirePermission('leases.access')
  const { userType, organizationId, tenantId } = await getUserType()

  if (!organizationId && !tenantId) {
    redirect('/login')
  }

  const { id: roomId, leaseId } = await params

  // For staff, use organization_id; for tenant, pass null and verify tenant ownership in getLeaseDetails
  const data = await getLeaseDetails(leaseId, organizationId, tenantId)

  if (!data) {
    notFound()
  }

  return (
    <LeaseDetailsContent
      data={data}
      sourceType="room"
      sourceId={roomId}
      userType={userType}
    />
  )
}
