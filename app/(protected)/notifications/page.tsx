import { createClient } from '@/utils/supabase/server'
import { requirePermission } from '@/lib/server-permissions'
import NotificationsSection from '@/components/notifications-section'

const Notifications = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userType = user?.user_metadata?.user_type

  if (userType !== 'tenant') {
    await requirePermission('notifications.access')
  }
  return <NotificationsSection />
}

export default Notifications
