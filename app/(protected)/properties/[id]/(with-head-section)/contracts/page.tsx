import ContractsSection from '@/components/sections/contracts-section'

type Props = {
  params: Promise<{ id: string }>
}

const Contracts = async ({ params }: Props) => {
  const { id } = await params

  return <ContractsSection propertyId={id} />
}

export default Contracts
