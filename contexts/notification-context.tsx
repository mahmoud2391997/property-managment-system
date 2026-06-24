'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

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

  // Poll for notification updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
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
