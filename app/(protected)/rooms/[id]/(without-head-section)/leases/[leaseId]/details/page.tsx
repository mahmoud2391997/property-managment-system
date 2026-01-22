import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { redirect } from 'next/navigation'
import LeaseDetailsContent from '@/components/lease-details/lease-details-content'
import { getLeaseDetails } from '@/utils/get-lease-details'

type Props = {
  params: Promise<{ id: string; leaseId: string }>
}

export default async function LeaseDetailsPage({ params }: Props) {
  const { staff, error } = await getUserAndStaff()

  if (error) {
    redirect('/login')
  }

  const { id: roomId, leaseId } = await params

  const data = await getLeaseDetails(leaseId, staff.organization_id)

  if (!data) {
    redirect(`/rooms/${roomId}/leases`)
  }

  return (
    <LeaseDetailsContent
      data={data}
      sourceType="room"
      sourceId={roomId}
    />
  )
}
