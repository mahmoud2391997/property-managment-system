import LeasesSection from '@/components/sections/leases-section'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

const Leases = async ({ params }: Props) => {
  await requirePermission('leases.access')
  const { id } = await params

  return <LeasesSection propertyId={id} />
}

export default Leases
