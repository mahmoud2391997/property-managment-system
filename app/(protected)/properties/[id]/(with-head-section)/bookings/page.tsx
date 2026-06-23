import BookingsSection from '@/components/sections/bookings-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function PropertyBookingsPage({ params }: Props) {
  await requirePermission('bookings.access')
  const { id } = await params

  return <BookingsSection propertyId={id} />
}
