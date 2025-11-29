import OverviewContent from './overview-content'

type Props = {
  params: Promise<{ id: string }>
}

export default async function OverviewPage({ params }: Props) {
  const { id } = await params

  return <OverviewContent propertyId={id} />
}
