import NotificationsSection from '@/components/notifications-section'
import { requirePermission } from '@/lib/server-permissions'

const Notifications = async () => {
  await requirePermission('notifications.access')
  return <NotificationsSection />
}

export default Notifications
