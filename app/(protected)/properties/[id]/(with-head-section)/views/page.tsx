import ViewsSection from '@/components/views-section'

type Props = {
  params: Promise<{ id: string }>
}

const Views = async ({ params }: Props) => {
  const { id } = await params

  return <ViewsSection propertyId={id} />
}

export default Views
