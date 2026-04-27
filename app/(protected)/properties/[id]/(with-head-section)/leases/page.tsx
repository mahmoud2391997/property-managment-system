import LeasesSection from '@/components/sections/leases-section'

type Props = {
  params: Promise<{ id: string }>
}

const Leases = async ({ params }: Props) => {
  const { id } = await params

  return <LeasesSection propertyId={id} />
}

export default Leases
