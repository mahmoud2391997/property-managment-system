import RoomOverviewContent from './overview-content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomOverviewPage({ params }: Props) {
  const { id } = await params
  return <RoomOverviewContent roomId={id} />
}
