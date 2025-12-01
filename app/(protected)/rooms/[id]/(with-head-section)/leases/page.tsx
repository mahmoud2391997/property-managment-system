import LeasesSection from '@/components/leases-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomLeasesPage({ params }: Props) {
  const { id } = await params

  return <LeasesSection roomId={id} />
}
