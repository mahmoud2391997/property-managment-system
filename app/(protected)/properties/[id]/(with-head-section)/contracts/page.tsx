import ContractsSection from '@/components/sections/contracts-section'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{ id: string }>
}

const Contracts = async ({ params }: Props) => {
  await requirePermission('contracts.access')
  const { id } = await params

  return <ContractsSection propertyId={id} />
}

export default Contracts
