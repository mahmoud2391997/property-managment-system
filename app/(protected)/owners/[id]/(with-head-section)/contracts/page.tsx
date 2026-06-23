import ContractsContent from './contracts-content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ContractsPage({ params }: Props) {
  await requirePermission('contracts.access')
  const { id } = await params

  return <ContractsContent ownerId={id} />
}
