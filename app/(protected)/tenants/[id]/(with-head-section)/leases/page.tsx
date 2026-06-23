import LeasesContent from './leases-content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function LeasesPage({ params }: Props) {
  await requirePermission('leases.access')
  const { id } = await params

  return <LeasesContent tenantId={id} />
}
