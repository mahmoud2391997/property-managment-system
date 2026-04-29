import RoomOverviewContent from './overview-content'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomOverviewPage({ params }: Props) {
  await requirePermission('rooms.access')
  const { id } = await params
  return <RoomOverviewContent roomId={id} />
}
