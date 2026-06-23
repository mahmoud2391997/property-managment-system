import { UnderDevelopment } from '@/components/costume-ui/under-development'

export default async function TenantScreening () {
  await requirePermission('tenant_screening.access')
  return <UnderDevelopment />
}
