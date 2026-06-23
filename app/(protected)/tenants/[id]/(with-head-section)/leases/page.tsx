import LeasesContent from './leases-content'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeasesPage({ params }: Props) {
  await requirePermission('leases.access')
  const { id } = await params

  return <LeasesContent tenantId={id} />
}
