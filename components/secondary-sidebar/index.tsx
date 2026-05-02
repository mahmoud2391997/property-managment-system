'use client'

import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LogoutIcon } from '@/components/costume-ui/icon'
import { useState, useEffect } from 'react'
import { logout } from '@/app/(auth)/logout/actions'

export default function SecondarySidebar({ className }: { className?: string }) {
  const [userInfo, setUserInfo] = useState<{
    firstName: string
    lastName: string | null
    profileThumb: string | null
    role: string
  } | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info')
        if (response.ok) {
          const data = await response.json()
          console.log(data);

          setUserInfo({
            firstName: data.firstName,
            lastName: data.lastName,
            profileThumb: data.profileThumb,
            role: data.role
          })
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }
    fetchUserInfo()
  }, [])

  return (
    <aside
      className={cn(
        'flex flex-col items-center py-4 gap-4',
        'w-[60px] bg-(--background-primary) border border-(--border-default) rounded-[15px]',
        className
      )}
    >
      {/* Profile avatar popover placeholder */}
      <Popover>
        <PopoverTrigger className="outline-none">
          {userInfo ? (
            <UserAvatar
              name={`${userInfo.firstName}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim()}
              imgSrc={userInfo.profileThumb || undefined}
              size={36}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-200 animate-pulse" />
          )}
        </PopoverTrigger>
        <PopoverContent side="left" align="start" className="w-64 p-3 flex flex-col gap-3">
          {userInfo && (
            <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
              <UserAvatar
                name={`${userInfo.firstName}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim()}
                imgSrc={userInfo.profileThumb || undefined}
                size={40}
              />
              <div className="flex flex-col overflow-hidden">
                <span className="texts-body-medium-medium truncate">
                  {`${userInfo.firstName}${userInfo.lastName ? ` ${userInfo.lastName}` : ''}`.trim()}
                </span>
                <span className="texts-body-small text-(--text-secondary) truncate">
                  {userInfo.role || 'Staff'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={async () => {
              setIsLoggingOut(true)
              await logout('/login')
            }}
            disabled={isLoggingOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <LogoutIcon className="w-4 h-4 text-red-600" />
            {isLoggingOut ? 'Logging out...' : 'Sign out'}
          </button>
        </PopoverContent>
      </Popover>

      <div className="w-8 h-[1px] bg-(--border-default)" />

      {/* Calendar icon */}
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
