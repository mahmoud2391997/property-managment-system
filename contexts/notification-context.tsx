'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'

type NotificationContextType = {
  hasUnreadNotifications: boolean
  refetch: () => Promise<void>
  markAllAsRead: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setHasUnreadNotifications(data.count > 0)
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
    }
  }, [])

  const markAllAsRead = useCallback(() => {
    setHasUnreadNotifications(false)
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Subscribe to real-time notifications for current user
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('notifications-unread')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // New notification inserted for this user - check if it's unread
            const newRecord = payload.new as { is_read?: boolean }
            if (newRecord.is_read === false) {
              setHasUnreadNotifications(true)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Notification updated - check if marked as read
            const newRecord = payload.new as { is_read?: boolean }
            if (newRecord.is_read === true) {
              // Refetch to check if any unread remain
              fetchUnreadCount()
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        hasUnreadNotifications,
        refetch: fetchUnreadCount,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
