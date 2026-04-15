'use client'
// components/app-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroupLabel,
  useSidebar
} from '@/components/ui/sidebar'
import { Menu, X } from 'lucide-react'
// import { IoIosArrowForward } from "react-icons/io";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import {
  GaugeIcon,
  ProjectIcon,
  HouseIcon,
  TransactionsIcon,
  PoepleIcon,
  ScreeningIcon,
  ClipboardIcon,
  NoticesIcon,
  ReportsIcon,
  NotificationIcon,
  LogoutIcon
} from './costume-ui/icon'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppSidebarSkeleton, AppSidebarFooterSkeleton } from './loading-ui/app-sidebar-skeleton'
import { useNotifications } from '@/contexts/notification-context'
import { logout } from '@/app/(auth)/logout/actions'
import { UserAvatar } from './costume-ui/name-avatar'
import ConfirmationDialog from './costume-ui/confirmation-dialog'
import { CommandPalette, CommandPaletteTrigger } from './command-palette'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export default function AppSidebar () {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const [sidebarHovered, setSidebarHovered] = useState<boolean>(false)
  const [userType, setUserType] = useState<'staff' | 'tenant' | null>(null)
  const [userInfo, setUserInfo] = useState<{
    firstName: string
    lastName: string
    profileThumb: string | null
    role: string
  } | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { hasUnreadNotifications } = useNotifications()
  const {
    open: isSidebarOpen,
    setOpen: setIsSidebarOpen,
    isMobile,
    setOpenMobile
  } = useSidebar()
  const pathname = usePathname()

  // On mobile, sidebar is always "open" (expanded) since it's in a sheet
  const effectiveSidebarOpen = isMobile ? true : isSidebarOpen

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user/info')

        if (!response.ok) {
          console.error(`Failed to fetch user info: HTTP ${response.status}`)
          setUserType('staff') // Fallback to staff on error
          return
        }

        const data = await response.json()

        if (data.userType) {
          setUserType(data.userType)
          setUserInfo({
            firstName: data.firstName,
            lastName: data.lastName,
            profileThumb: data.profileThumb,
            role: data.role
          })
        } else {
          console.error('Failed to fetch user info: No userType in response', data.error || '')
          setUserType('staff') // Fallback to staff on error
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        setUserType('staff') // Fallback to staff on error
      }
    }
    fetchUserInfo()
  }, [])

  type menuItemContentType = {
    icon: any
    label: string
    width?: string
    href?: string
    subMenu?: {
      label: string
      href?: string
    }[]
  }

  // Menu items based on user type
  const staffMenuItems: menuItemContentType[] = [
    {
      icon: GaugeIcon,
      label: 'Dashboard',
      width: 'w-6!',
      href: '/dashboard'
    },
    {
      icon: ProjectIcon,
      label: 'Projects',
      width: 'w-6!',
      href: '/projects'
    },
    {
      icon: HouseIcon,
      label: 'Properties',
      width: 'w-5.5!',
      subMenu: [
        { label: 'Properties', href: '/properties' },
        { label: 'Rooms', href: '/rooms' }
      ]
    },
    {
      icon: TransactionsIcon,
      label: 'Transactions',
      width: 'w-6! -mr-0.5',
      subMenu: [
        { label: 'Payments', href: '/payments' },
        { label: 'Expenses', href: '/expenses' }
      ]
    },
    {
      icon: PoepleIcon,
      label: 'People',
      width: 'w-6!',
      subMenu: [
        { label: 'Tenants', href: '/tenants' },
        { label: 'Owners', href: '/owners' },
        { label: 'Agents', href: '/agents' },
        { label: 'Vendors', href: '/vendors' },
        { label: 'Staff', href: '/staff' }
      ]
    },
    {
      icon: ScreeningIcon,
      label: 'Tenant Screening',
      width: 'w-5!',
      href: '/tenant-screening'
    },
    {
      icon: ClipboardIcon,
      label: 'Work Operations',
      width: 'w-5! ml-[1px]! mr-1!',
      subMenu: [
        { label: 'Tickets', href: '/tickets' },
        { label: 'Tasks', href: '/tasks' }
      ]
    },
    {
      icon: NoticesIcon,
      label: 'Notices',
      width: 'w-5!',
      href: '/notices'
    },
    {
      icon: NotificationIcon,
      label: 'Notifications',
      width: 'w-4.5!',
      href: '/notifications'
    },
    {
      icon: ReportsIcon,
      label: 'Reports',
      width: 'w-5!',
      href: '/reports'
    }
  ]

  const tenantMenuItems: menuItemContentType[] = [
    {
      icon: HouseIcon,
      label: 'Rentals',
      width: 'w-5.5!',
      href: '/rentals'
    },
    {
      icon: TransactionsIcon,
      label: 'Payments',
      width: 'w-6!',
      href: '/payments'
    },
    {
      icon: ClipboardIcon,
      label: 'Tickets',
      width: 'w-5! ml-[1px]!',
      href: '/tickets'
    },
    {
      icon: NotificationIcon,
      label: 'Notifications',
      width: 'w-4.5! ml-0.5!',
      href: '/notifications'
    }
  ]

  // Don't render menu items until userType is loaded
  const menuItemContent =
    userType === null
      ? []
      : userType === 'tenant'
      ? tenantMenuItems
      : staffMenuItems

  // const helpItemContent: menuItemContentType[] = [
  //   {
  //     icon: SupportIcon,
  //     label: 'Support',
  //     width: 'w-5!'
  //   },
  //   {
  //     icon: SettingsIcon,
  //     label: 'Settings',
  //     width: 'w-5!'
  //   }
  // ]

  useEffect(() => {
    if (effectiveSidebarOpen) {
      setSidebarHovered(false)
    } else {
      setOpenMenus({})
    }
  }, [effectiveSidebarOpen])

  return (
    <Sidebar
      className={cn(
        'relative!',
        'h-full min-h-100 max-h-300 px-2.5!',
        'border-none',
        'select-none'
      )}
      variant='sidebar'
      onMouseEnter={() => {
        !effectiveSidebarOpen && setSidebarHovered(true)
      }}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      {/* bg-(--background-secondary) */}
      <SidebarHeader
        className={cn(
          'relative flex flex-row items-center justify-between overflow-hidden',
          !effectiveSidebarOpen && 'justify-between!',
          'px-2 py-4 pb-5 h-[85px] mb-5',
          'border-b border-(--border-strong)'
        )}
      >
        <div
          className={cn(
            'flex items-center  w-full pl-2.5 transition-opacity duration-0 opacity-100 gap-2',
            !effectiveSidebarOpen && sidebarHovered && 'opacity-0'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button type='button' className='shrink-0 cursor-default' aria-label='Build info'>
                <Image src='/icons/logo.png' width={18} height={18} alt='logo' />
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='font-mono'>
              {(() => {
                const env = process.env.NEXT_PUBLIC_APP_ENV
                const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '-'
                const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? '-'
                const envLabel =
                  env === 'development' ? 'DEV · ' :
                  env === 'staging' ? 'STAGING · ' : ''
                return `${envLabel}v${version} · ${sha}`
              })()}
            </TooltipContent>
          </Tooltip>
          {/* <img src={logo} className='w-10 h-10' alt='logo' /> */}
          <div
            className='overflow-hidden transition-all duration-200'
            style={{ maxWidth: effectiveSidebarOpen ? '200px' : '0px' }}
          >
            <h3 className='texts-heading-h2 text-[22px]! opacity-100 transition-opacity duration-200'>
              TenancyPilot
            </h3>
          </div>
        </div>

        {!effectiveSidebarOpen && (
          <SidebarTrigger
            className={cn(
              'absolute! top-1/2 left-1/2 -translate-1/2 transition-opacity duration-0',
              sidebarHovered ? 'opacity-100' : 'opacity-0',
              'h-8.5! w-8.5!',
              'hover:bg-neutral-200/70 active:bg-neutral-200 text-neutral-100!',
              'rounded-[10px]! cursor-e-resize'
            )}
          />
        )}

        <div
          className={cn(
            'absolute left-0 pointer-events-none',
            'flex items-center justify-end',
            'w-60 h-fit pr-1',
            !effectiveSidebarOpen && '-z-50',
            // Hide collapse trigger on mobile since we use the sheet close button
            isMobile && 'hidden'
          )}
        >
          <SidebarTrigger
            className={cn(
              'pointer-events-auto',
              'h-8.5! w-8.5!',
              'hover:bg-neutral-200/70 active:bg-neutral-200 text-neutral-100!',
              'rounded-[10px]! cursor-e-resize'
            )}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className='gap-4! py-2!'>
        {/* Command Palette (staff only) */}
        {userType === 'staff' && <CommandPalette />}

        {userType === null ? (
          // Show skeleton while loading
          <AppSidebarSkeleton isSidebarOpen={effectiveSidebarOpen} />
        ) : (
          <>
            {/* Menu */}
            <SidebarGroup className='p-0 gap-2.5!'>
              {userType === 'staff' && <CommandPaletteTrigger />}
              <SidebarGroupLabel
                className={cn(
                  'texts-label-small text-neutral-500',
                  'p-0 h-auto'
                )}
              >
                MENU
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className='gap-2.5'>
                  {menuItemContent.map((item, index) => {
                    const hasSubMenu = item.subMenu && item.subMenu.length > 0
                    const hasActiveSubItem =
                      hasSubMenu &&
                      item.subMenu?.some(subItem => pathname === subItem.href)

                    // Sub menu
                    if (hasSubMenu) {
                      return (
                        <Collapsible
                          key={`collapsible-${index}-${item.label}`}
                          open={!!openMenus[item.label]}
                          onOpenChange={open => {
                            setOpenMenus(prev => ({
                              ...prev,
                              [item.label]: open
                            }))
                            if (!effectiveSidebarOpen && !isMobile) {
                              setIsSidebarOpen(true)
                            }
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className={cn(
                                `${
                                  hasActiveSubItem
                                    ? 'border border-(--border-strong) bg-(--background-primary) shadows-sm duration-0'
                                    : 'hover:bg-neutral-200/50 active:bg-neutral-200/90 cursor-pointer duration-100'
                                }`,
                                !effectiveSidebarOpen && index === 0 && 'mt-1',
                                'text-neutral-600!',
                                'transition-colors',
                                'texts-body-medium-medium leading-none',
                                'h-11! px-4',
                                'rounded-lg',
                                'justify-between'
                              )}
                            >
                              <span className='flex items-center gap-2'>
                                <item.icon
                                  className={cn(item.width, 'shrink-0')}
                                />
                                <span
                                  className={`${
                                    !effectiveSidebarOpen &&
                                    'transition-opacity delay-100 opacity-0'
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </span>
                              <svg
                                className={cn(
                                  'w-4 h-4 transition-transform duration-200',
                                  !!openMenus[item.label] && 'rotate-90'
                                )}
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M9 5l7 7-7 7'
                                />
                              </svg>
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent
                            className={cn(
                              'mt-2 ml-4 space-y-1 overflow-hidden',
                              'transition-all duration-200 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
                            )}
                          >
                            {item.subMenu?.map((subItem, subIndex) => {
                              const isSubItemActive = pathname === subItem.href
                              return (
                                <SidebarMenuButton
                                  key={`${item.label}-${subIndex}`}
                                  asChild
                                >
                                  <Link
                                    href={subItem.href || '/under-development'}
                                    onClick={e => {
                                      e.stopPropagation()
                                      // Close mobile sidebar when navigating
                                      if (isMobile) setOpenMobile(false)
                                    }}
                                    className={cn(
                                      `${
                                        isSubItemActive
                                          ? 'bg-neutral-200/70 text-neutral-900 font-medium'
                                          : 'hover:bg-neutral-200/50 active:bg-neutral-200/90'
                                      }`,
                                      'cursor-pointer',
                                      'text-neutral-600!',
                                      'texts-body-medium-medium',
                                      'h-10! pl-8 pr-4',
                                      'rounded-lg',
                                      'transition-colors'
                                    )}
                                  >
                                    {subItem.label}
                                  </Link>
                                </SidebarMenuButton>
                              )
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    }

                    // Regular menu item
                    const isActive = pathname === item?.href

                    return (
                      <SidebarMenuItem key={item.label} className='px-0!'>
                        <SidebarMenuButton
                          className={cn(
                            `${
                              isActive
                                ? 'border border-(--border-strong) bg-(--background-primary) hover:bg-(--background-primary) shadows-sm duration-0 cursor-default'
                                : 'hover:bg-neutral-200/50 active:bg-neutral-200/90 duration-100'
                            }`,
                            !effectiveSidebarOpen && index === 0 && 'mt-1',
                            'text-neutral-600!',
                            'transition-colors ',
                            'texts-body-medium-medium leading-none',
                            'h-11! px-4',
                            'rounded-lg'
                          )}
                          asChild
                        >
                          <Link
                            className={cn(
                              'flex items-center gap-2!',
                              'w-[30px] h-[30px]'
                            )}
                            href={item.href || '/under-development'}
                            onClick={() => {
                              // Close mobile sidebar when navigating
                              if (isMobile) setOpenMobile(false)
                            }}
                          >
                            <div
                              className={cn(
                                'flex justify-center items-center',
                                'w-6 h-auto'
                              )}
                            >
                              <div className='relative'>
                                <item.icon
                                  className={`text-neutral-600 ${item.width} h-auto!`}
                                />
                                {/* Red dot for unread notifications */}
                                {item.label === 'Notifications' &&
                                  hasUnreadNotifications && (
                                    <span
                                      className={
                                        'absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full'
                                      }
                                    />
                                  )}
                              </div>
                            </div>
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
          </>
        )}
      </SidebarContent>
      <SidebarFooter
        className={cn(
          'p-0! mt-auto',
          'border-t border-(--border-strong)'
        )}
      >
        {userInfo === null ? (
          <AppSidebarFooterSkeleton isSidebarOpen={effectiveSidebarOpen} />
        ) : (
          <div
            className={cn(
              'flex items-center justify-between',
              'px-4 py-3',
              effectiveSidebarOpen ? 'gap-3' : 'justify-center'
            )}
          >
            <div className={cn(
              'flex items-center gap-3 min-w-0',
              !effectiveSidebarOpen && 'hidden'
            )}>
              <UserAvatar
                name={`${userInfo.firstName} ${userInfo.lastName}`.trim()}
                imgSrc={userInfo.profileThumb || undefined}
                size={30}
                className='shrink-0 text-sm'
              />
              <div className='flex flex-col min-w-0'>
                <span className='texts-body-medium-medium truncate'>
                  {`${userInfo.firstName} ${userInfo.lastName || ''}`.trim()}
                </span>
                <span className='texts-body-small text-(--text-secondary) truncate'>
                  {userInfo.role || ''}
                </span>
              </div>
            </div>
            <ConfirmationDialog
              openDialogButton={
                <button
                  className={cn(
                    'flex items-center justify-center',
                    'w-9 h-9 shrink-0',
                    'rounded-lg',
                    'hover:bg-neutral-200/70 active:bg-neutral-200',
                    'transition-colors cursor-pointer'
                  )}
                  title='Logout'
                >
                  <LogoutIcon className='w-5 h-5 text-neutral-600' />
                </button>
              }
              title='Logout'
              description='Are you sure you want to logout?'
              variant='confirm'
              confirmButtonLabel='Logout'
              confirmButtonLoadingLabel='Logging out...'
              confirmButtonClassName='bg-primary-main! hover:bg-primary-main/90!'
              onConfirm={async () => {
                setIsLoggingOut(true)
                await logout('/login')
              }}
            />
          </div>
        )}
      </SidebarFooter>

      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className='fixed inset-0 z-9999 flex items-center justify-center bg-white/80 backdrop-blur-sm'>
          <div className='flex flex-col items-center gap-3'>
            <div className='w-8 h-8 border-3 border-primary-main border-t-transparent rounded-full animate-spin' />
            <span className='texts-body-medium-medium text-neutral-600'>Logging out...</span>
          </div>
        </div>
      )}
    </Sidebar>
  )
}

// Mobile header component with hamburger menu
export function MobileHeader () {
  const { openMobile, setOpenMobile } = useSidebar()

  return (
    <div
      className={cn(
        'md:hidden flex items-center justify-between',
        'h-[60px] px-4',
        'bg-(--background-primary) border-b border-(--border-default)',
        'fixed top-0 left-0 right-0 z-40'
      )}
    >
      <div className='flex items-center gap-2'>
        <Image src='/icons/logo.png' width={18} height={18} alt='logo' />
        <h2 className='texts-heading-h2'>TenancyPilot</h2>
      </div>
      <button
        onClick={() => setOpenMobile(!openMobile)}
        className={cn(
          'relative flex items-center justify-center',
          'w-10 h-10',
          'rounded-lg',
          'hover:bg-neutral-200/50 active:bg-neutral-200',
          'transition-colors'
        )}
        aria-label={openMobile ? 'Close menu' : 'Open menu'}
      >
        {/* Menu icon - fades out and rotates when open */}
        <Menu
          className={cn(
            'absolute w-6 h-6 text-neutral-600',
            'transition-all duration-300 ease-in-out',
            openMobile
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100'
          )}
        />
        {/* X icon - fades in and rotates when open */}
        <X
          className={cn(
            'absolute w-6 h-6 text-neutral-600',
            'transition-all duration-300 ease-in-out',
            openMobile
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </button>
    </div>
  )
}
