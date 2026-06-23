import LeasesSection from '@/components/sections/leases-section'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomLeasesPage({ params }: Props) {
  await requirePermission('leases.access')
  const { id } = await params

  return <LeasesSection roomId={id} />
}
