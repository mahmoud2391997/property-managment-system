import BookingsSection from '@/components/sections/bookings-section'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomBookingsPage({ params }: Props) {
  await requirePermission('bookings.access')
  const { id } = await params

  return <BookingsSection roomId={id} />
}
