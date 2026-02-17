import BookingsSection from '@/components/sections/bookings-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomBookingsPage({ params }: Props) {
  const { id } = await params

  return <BookingsSection roomId={id} />
}
