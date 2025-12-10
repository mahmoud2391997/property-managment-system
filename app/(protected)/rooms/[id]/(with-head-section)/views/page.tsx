import ViewsSection from '@/components/views-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomViewsPage({ params }: Props) {
  const { id } = await params

  return <ViewsSection roomId={id} />
}
