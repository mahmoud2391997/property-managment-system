import ViewsSection from '@/components/views-section'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

const Views = async ({ params }: Props) => {
  await requirePermission('views.access')
  const { id } = await params

  return <ViewsSection propertyId={id} />
}

export default Views
