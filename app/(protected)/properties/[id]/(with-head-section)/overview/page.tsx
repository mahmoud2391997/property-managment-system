import OverviewContent from './overview-content'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function OverviewPage({ params }: Props) {
  await requirePermission('properties.access')
  const { id } = await params

  return <OverviewContent propertyId={id} />
}
