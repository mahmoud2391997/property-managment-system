import { UnderDevelopment } from '@/components/costume-ui/under-development'
import { requirePermission } from '@/lib/server-permissions'

export default async function TenantScreening () {
  await requirePermission('tenant_screening.access')
  return <UnderDevelopment />
}
