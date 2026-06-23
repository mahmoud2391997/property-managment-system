import NotificationsSection from '@/components/notifications-section'

const Notifications = async () => {
  const { data: { user } } = 
  const userType = user?.user_metadata?.user_type

  if (userType !== 'tenant') {
    await requirePermission('notifications.access')
  }
  return <NotificationsSection />
}

export default Notifications
