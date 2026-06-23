import { UnderDevelopment } from '@/components/costume-ui/under-development'

export default async function Reports () {
  await requirePermission('reports.access')
  return <UnderDevelopment />
}