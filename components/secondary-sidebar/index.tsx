'use client'

import { Calendar, Mail, Shield, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useState, useEffect } from 'react'
import { mockLogout } from '@/lib/mock-auth'
import { formatDistanceToNow } from 'date-fns'
import { useUser } from '@/contexts/user-context'

export default function SecondarySidebar({ className }: { className?: string }) {
  const [userInfo, setUserInfo] = useState<{
    firstName: string
    lastName: string | null
    profileThumb: string | null
    role: string
    email?: string
    userType?: string
    organizationName?: string
    activeLeasesCount?: number
    lastSignIn?: string
  } | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          setUserInfo({
            firstName: data.firstName,
            lastName: data.lastName,
            profileThumb: data.profileThumb,
            role: data.role,
            email: data.user?.email,
            userType: data.userType,
            organizationName: data.staff?.organization_name,
            activeLeasesCount: data.tenant?.active_leases_count ?? 0,
            lastSignIn: data.user?.lastSignIn,
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }
    fetchUserInfo()
  }, [])

  const fullName = `${userInfo?.firstName ?? ''}${userInfo?.lastName ? ` ${userInfo.lastName}` : ''}`.trim()

  return (
    <aside
      className={cn(
        'flex flex-col items-center py-4 gap-4',
        'w-[60px] bg-(--background-primary) border border-(--border-default) rounded-[15px]',
        className
      )}
    >
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="focus:outline-none">
            {userInfo ? (
              <UserAvatar
                name={fullName}
                imgSrc={userInfo.profileThumb || undefined}
                size={36}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-neutral-200 animate-pulse" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start" side="right" sideOffset={8}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-strong)">
            <UserAvatar
              name={fullName}
              imgSrc={userInfo?.profileThumb || undefined}
              size={40}
            />
            <div className="flex-1 min-w-0">
              <p className="texts-body-medium-medium truncate">{fullName || 'User'}</p>
              <p className="texts-body-small text-(--text-secondary) truncate">{userInfo?.role || 'Staff'}</p>
            </div>
          </div>
          <div className="p-3 space-y-1.5">
            {userInfo?.email && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-(--background-secondary) rounded">
                <Mail size={14} className="text-(--text-secondary) shrink-0" />
                <span className="texts-body-small text-(--text-primary) truncate">{userInfo.email}</span>
              </div>
            )}
            {userInfo?.userType === 'staff' && userInfo.organizationName && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-(--background-secondary) rounded">
                <Shield size={14} className="text-(--text-secondary) shrink-0" />
                <span className="texts-body-small text-(--text-primary) truncate">{userInfo.organizationName}</span>
              </div>
            )}
            {userInfo?.userType === 'tenant' && userInfo.activeLeasesCount !== undefined && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-(--background-secondary) rounded">
                <Shield size={14} className="text-(--text-secondary) shrink-0" />
                <span className="texts-body-small text-(--text-primary)">{userInfo.activeLeasesCount} active lease{userInfo.activeLeasesCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {userInfo?.lastSignIn && (
              <div className="flex items-center gap-2.5 px-2 py-1.5 bg-(--background-secondary) rounded">
                <Clock size={14} className="text-(--text-secondary) shrink-0" />
                <span className="texts-body-small text-(--text-secondary)">Signed in {formatDistanceToNow(new Date(userInfo.lastSignIn))} ago</span>
              </div>
            )}
          </div>
          <div className="border-t border-(--border-strong) p-3">
            <button
              onClick={async () => {
                setIsLoggingOut(true)
                setPopoverOpen(false)
                mockLogout()
                window.location.href = '/login'
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 h-9 px-3.5 rounded-md border border-red-200 bg-(--background-primary) text-red-600 texts-body-small-medium hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-8 h-[1px] bg-(--border-default)" />

      <Link
        href='/calendar'
        className='flex items-center justify-center w-10 h-10 rounded-lg hover:bg-(--background-secondary) transition-colors text-(--text-secondary) hover:text-(--text-primary)'
        title='Calendar'
      >
        <Calendar size={20} />
      </Link>
    </aside>
  )
}
