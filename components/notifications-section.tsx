'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from './costume-ui/search-input'
import { Notification } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { UserAvatar } from './costume-ui/name-avatar'
import NotificationsSkeleton from './loading-ui/notifications-skeleton'
import { useNotifications } from '@/contexts/notification-context'

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsSection () {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { markAllAsRead: markAllAsReadInContext, refetch: refetchUnreadCount } = useNotifications()

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      // First, optimistically update the context to hide the red dot immediately
      markAllAsReadInContext()

      // Then mark as read in the database
      const response = await fetch('/api/notifications', { method: 'PATCH' })
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

      // Refetch the count from the server to ensure accuracy
      await refetchUnreadCount()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      // On error, refetch to restore correct state
      await refetchUnreadCount()
    }
  }, [markAllAsReadInContext, refetchUnreadCount])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Auto mark all as read when component mounts and notifications are loaded
  useEffect(() => {
    if (!loading && notifications.some(n => !n.is_read)) {
      markAllAsRead()
    }
  }, [loading, notifications, markAllAsRead])

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !n.is_read) ||
      (filter === 'read' && n.is_read)

    if (searchQuery === '') {
      return matchesFilter
    }

    const lowerSearch = searchQuery.toLowerCase()
    const matchesSearch =
      n.title.toLowerCase().includes(lowerSearch) ||
      n.message.toLowerCase().includes(lowerSearch) ||
      n.performer_name?.toLowerCase().includes(lowerSearch) ||
      n.reference_type?.toLowerCase().includes(lowerSearch) ||
      n.page?.toLowerCase().includes(lowerSearch)

    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return <NotificationsSkeleton />
  }

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div className='flex items-center gap-3'>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full',
              'bg-(--primary-color) text-white',
              'texts-label-small font-medium'
            )}
          >
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <SearchInput
          placeholder='Search notifications'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-1 p-1 bg-(--background-secondary) rounded-lg w-fit'>
        {(['all', 'unread', 'read'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-md texts-label-large capitalize transition-colors cursor-pointer',
              filter === f
                ? 'bg-(--background-primary) text-(--text-primary) shadows-xs'
                : 'text-(--text-secondary) hover:text-(--text-primary)'
            )}
          >
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className='ml-1.5 text-xs'>({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className='flex flex-col mt-2'>
        {filteredNotifications.length === 0 ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-20',
              'text-(--text-secondary)'
            )}
          >
            <div className='w-20 h-20 mb-6 rounded-full bg-(--background-secondary) flex items-center justify-center'>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                className='w-10 h-10 text-neutral-400'
              >
                <path
                  d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z'
                  fill='currentColor'
                />
              </svg>
            </div>
            <p className='texts-body-large-medium text-(--text-primary)'>
              {filter === 'unread'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </p>
            <p className='texts-body-medium-regular text-neutral-400 mt-1'>
              {filter === 'unread'
                ? 'All notifications have been read'
                : "When you receive notifications, they'll appear here"}
            </p>
          </div>
        ) : (
          <div className='divide-y divide-(--border-default)'>
            {filteredNotifications.map((notification, index) => {
              const hasPage = notification.page && notification.page.length > 0

              // Build the navigation URL
              // For tickets, navigate to the detail page with reference_id
              const getNavigationUrl = () => {
                if (!notification.page) return '/'
                if (
                  notification.page === 'tickets' &&
                  notification.reference_id
                ) {
                  return `/tickets/${notification.reference_id}`
                }
                // If page already starts with '/', use as-is, otherwise prepend '/'
                return notification.page.startsWith('/')
                  ? notification.page
                  : `/${notification.page}`
              }

              const content = (
                <div
                  className={cn(
                    'flex items-start gap-4 py-5 px-4 -mx-4',
                    'transition-colors duration-150',
                    hasPage &&
                      'hover:bg-(--background-secondary) cursor-pointer',
                    index === 0 && 'pt-3'
                  )}
                >
                  {/* Avatar */}

                  {notification.performer_type !== 'system' && (
                    <UserAvatar
                      name={notification.performer_name || 'Not Found'}
                      imgSrc={notification.performer_picture || undefined}
                      size={44}
                    />
                  )}

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1'>
                        <p className='texts-body-medium-medium text-(--text-primary)'>
                          {notification.title}
                        </p>
                        <p className='texts-body-medium-regular text-(--text-secondary) mt-1 line-clamp-2'>
                          {notification.performer_name && (
                            <span className='font-medium text-(--text-primary)'>
                              {notification.performer_name}
                            </span>
                          )}{' '}
                          {notification.message}
                        </p>
                        <p className='texts-label-small text-neutral-400 mt-2'>
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true
                            }
                          )}
                        </p>
                      </div>

                      {/* Arrow indicator for navigable items */}
                      {hasPage && (
                        <div className='flex-shrink-0 mt-1'>
                          <ChevronRight className='w-5 h-5 text-neutral-400' />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )

              if (hasPage) {
                return (
                  <Link
                    key={notification.id}
                    href={getNavigationUrl()}
                    className='block'
                  >
                    {content}
                  </Link>
                )
              }

              return <div key={notification.id}>{content}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
