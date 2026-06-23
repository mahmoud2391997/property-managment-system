import RolesManagementContent from './roles-management-content'
import { requirePermission } from '@/lib/server-permissions'

type Props = {
  params: Promise<{}> // No params needed for this page
}

export default async function RolesManagementPage({ params }: Props) {
  await requirePermission('roles.access')
  
  return <RolesManagementContent />
}
