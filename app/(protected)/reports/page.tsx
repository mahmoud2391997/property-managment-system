import { UnderDevelopment } from '@/components/costume-ui/under-development'
import { requirePermission } from '@/lib/server-permissions'

export default async function Reports () {
  await requirePermission('reports.access')
  return <UnderDevelopment />
}