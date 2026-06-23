import RoomsSection from '@/components/rooms-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function Rooms({ params }: Props) {
  await requirePermission('rooms.access')
  const { id } = await params

  return <RoomsSection propertyId={id} />
}