import ViewsSection from '@/components/views-section'

type Props = {
  params: Promise<{ id: string }>
}

export default async function RoomViewsPage({ params }: Props) {
  await requirePermission('views.access')
  const { id } = await params

  return <ViewsSection roomId={id} />
}
