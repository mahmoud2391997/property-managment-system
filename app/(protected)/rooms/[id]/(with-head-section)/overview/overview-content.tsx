'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ComboBoxitemsType } from '@/types'
import {
  type LucideIcon,
  MoreVertical,
  ArrowDownLeft,
  CalendarCheck2,
  Plus
} from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import PaymentsSection from '@/components/payments-section'
import RecurringSectionRoom from '@/components/recurring-section-room'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import InitiateLeaseEndingDrawer from '@/components/dialogs/initiate-lease-ending-drawer'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buildWhatsAppLink } from '@/utils/functions'
import { useActionUnderDevelopment } from '@/components/costume-ui/under-development'
import { useScrollToSection } from '@/hooks/useScrollToSection'
import ScheduleRentalChangeDialog from '@/components/dialogs/schedule-rental-change-dialog'
import RentalHistoryDialog from '@/components/dialogs/rental-history-dialog'
import { TrendingUp, TrendingDown, Calendar, X } from 'lucide-react'

// Types for room overview data
type ScheduledChange = {
  id: string
  old_rent: number
  new_rent: number
  effective_from: string
}

type LeaseOverview = {
  id: string
  reference_id: string
  monthly_rent: number
  due_date: string
  start_date: string
  number_of_months: number | null
  scheduled_change: ScheduledChange | null
  tenant: {
    id: string
    name: string
    profile_thumb: string | null
    phone_number: string | null
  }
}

type BookingOverview = {
  id: string
  amount: number
  move_in_date: string
  tenant: {
    id: string
    name: string
    profile_thumb: string | null
  }
}

type RoomOverviewData = {
  roomTitle: string
  propertyCode: string | null
  roomStatus: string
  lease: LeaseOverview | null
  booking: BookingOverview | null
  propertyId: string | null
}

// Card component for displaying data
type CardProps = {
  iconStyles: string
  Icon: LucideIcon
  title: string
  subtitle: string
  amount: string
  date_label: string
  date: string
  user_name: string
  user_link?: string
  user_type: string
  user_avatar?: string | null
  menuItems?: React.ReactNode
}

const Card = ({
  iconStyles = '',
  Icon,
  title,
  subtitle,
  amount,
  date_label,
  date,
  user_name,
  user_link,
  user_type,
  user_avatar,
  menuItems
}: CardProps) => {
  const renderAvatar = (item: ComboBoxitemsType) => {
    const content = (
      <>
        <span className='texts-body-large-medium'>{item.label}</span>
        {item.subtitle && (
          <span className='texts-caption-large text-(--text-secondary)'>
            {item.subtitle}
          </span>
        )}
      </>
    )
    return (
      <div className='flex items-center gap-2.5 select-none'>
        <UserAvatar
          imgSrc={item.avatar as string}
          name={item.label}
          size={40}
          className={'texts-body-large-medium'}
        />
        {user_link ? (
          <Link href={user_link} className='flex-1 flex flex-col hover:underline'>
            {content}
          </Link>
        ) : (
          <div className='flex-1 flex flex-col'>{content}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-5 w-full',
        'w-full p-5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      {/* Head */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <div className='flex gap-2.5'>
          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center rounded-[7px]',
              'h-[31] w-[31]',
              iconStyles
            )}
          >
            <Icon size={19} strokeWidth={1.5} />
          </div>
          {/* Title */}
          <div className='flex flex-col'>
            <h3>{title}</h3>
            <span className='texts-caption-large text-(--text-secondary)'>
              {subtitle}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreVertical className='h-6! w-6! text-neutral-600' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View details</DropdownMenuItem>
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Body */}
      <div className='flex flex-col gap-2.5'>
        <h2>{amount}</h2>
        <span className='texts-body-small'>
          <span className='texts-body-small-medium'>{date_label}</span> {date}
        </span>
      </div>
      {/* Footer */}
      <div className='w-full pt-[15] border-t border-(--border-light)'>
        {renderAvatar({
          label: user_name,
          subtitle: user_type,
          avatar: user_avatar
        })}
      </div>
    </div>
  )
}

// Empty state card with Add button
type EmptyCardProps = {
  iconStyles: string
  Icon: LucideIcon
  title: string
  subtitle: string
  buttonLabel?: string
  href?: string
  onClick?: () => void
  children?: React.ReactNode
}

const EmptyCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  buttonLabel,
  href,
  onClick,
  children
}: EmptyCardProps) => {
  const content = (
    <>
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-neutral-100 group-hover:bg-neutral-200/70',
          'transition-colors duration-200'
        )}
      >
        <Plus
          className='text-neutral-400 group-hover:text-neutral-500 transition-colors duration-200'
          size={20}
          strokeWidth={2}
        />
      </div>
      <span className='texts-body-small-medium text-neutral-400 group-hover:text-neutral-500 transition-colors duration-200'>
        {buttonLabel}
      </span>
    </>
  )

  const containerClasses = cn(
    'flex flex-1 flex-col items-center justify-center gap-2',
    'mt-4 mx-1 mb-1 rounded-lg',
    'border-2 border-dashed border-neutral-200',
    'hover:border-neutral-300 hover:bg-neutral-50/50',
    'transition-all duration-200 cursor-pointer group'
  )

  return (
    <div
      className={cn(
        'flex flex-col w-full',
        'w-full p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'min-h-[232px]'
      )}
    >
      {/* Head */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <div className='flex gap-2.5'>
          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center rounded-[7px]',
              'h-[31] w-[31]',
              iconStyles
            )}
          >
            <Icon size={19} strokeWidth={1.5} />
          </div>
          {/* Title */}
          <div className='flex flex-col'>
            <h3>{title}</h3>
            <span className='texts-caption-large text-(--text-secondary)'>
              {subtitle}
            </span>
          </div>
        </div>
      </div>
      {/* Body - Empty State */}
      {children ? (
        children
      ) : onClick ? (
        <button type='button' onClick={onClick} className={containerClasses}>
          {content}
        </button>
      ) : href ? (
        <Link href={href} className={containerClasses}>
          {content}
        </Link>
      ) : (
        <div className={containerClasses}>{content}</div>
      )}
    </div>
  )
}

// Status action card for Pending Inspection / Under Preparation
type StatusCardProps = {
  iconStyles: string
  Icon: LucideIcon
  title: string
  subtitle: string
  status: string
  roomId: string
}

const StatusCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  status,
  roomId
}: StatusCardProps) => {
  const [inspectionTaskId, setInspectionTaskId] = useState<string | null>(null)
  const isPendingInspection = status === 'Pending_Inspection'
  const isUnderPreparation = status === 'Under_Preparation'

  // Fetch the inspection task ID for this room
  useEffect(() => {
    const fetchInspectionTask = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/inspection-task`)
        if (response.ok) {
          const data = await response.json()
          setInspectionTaskId(data.inspectionTaskId)
        }
      } catch (error) {
        console.error('Error fetching inspection task:', error)
      }
    }

    if (isPendingInspection || isUnderPreparation) {
      fetchInspectionTask()
    }
  }, [roomId, isPendingInspection, isUnderPreparation])

  return (
    <div
      className={cn(
        'flex flex-col w-full',
        'w-full p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'min-h-[232px]'
      )}
    >
      {/* Head */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <div className='flex gap-2.5'>
          <div
            className={cn(
              'flex items-center justify-center rounded-[7px]',
              'h-[31] w-[31]',
              iconStyles
            )}
          >
            <Icon size={19} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <h3>{title}</h3>
            <span className='texts-caption-large text-(--text-secondary)'>
              {subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className='mt-4 mb-2'>
        <span
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
            isPendingInspection && 'bg-orange-100 text-orange-800',
            isUnderPreparation && 'bg-yellow-100 text-yellow-800'
          )}
        >
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status Information */}
      <div className='flex flex-1 flex-col items-center justify-center gap-3 mt-2 px-3'>
        <p className='text-sm text-center text-(--text-secondary)'>
          {isPendingInspection
            ? 'An inspection task is in progress for this room.'
            : isUnderPreparation
            ? 'Preparation tasks are in progress for this room.'
            : 'Room is not ready for lease.'}
        </p>
        {inspectionTaskId && (
          <Link href={`/tasks/${inspectionTaskId}`}>
            <Button variant='outline' size='sm' className='gap-2'>
              View Inspection Task
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Loading skeleton for cards
const CardSkeleton = () => {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 w-full',
        'w-full p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'animate-in fade-in duration-300'
      )}
    >
      {/* Head */}
      <div className='flex justify-between items-center w-full'>
        <div className='flex gap-2.5'>
          <Skeleton className='h-[31px] w-[31px] rounded-[7px] bg-neutral-200' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-5 w-28 bg-neutral-200' />
            <Skeleton className='h-3 w-24 bg-neutral-200' />
          </div>
        </div>
        <Skeleton className='h-8 w-8 rounded bg-neutral-200' />
      </div>
      {/* Body */}
      <div className='flex flex-col gap-2.5'>
        <Skeleton className='h-8 w-32 bg-neutral-200' />
        <Skeleton className='h-4 w-40 bg-neutral-200' />
      </div>
      {/* Footer */}
      <div className='w-full pt-[15] border-t border-(--border-light)'>
        <div className='flex items-center gap-2.5'>
          <Skeleton className='h-10 w-10 rounded-full bg-neutral-200' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-4 w-24 bg-neutral-200' />
            <Skeleton className='h-3 w-16 bg-neutral-200' />
          </div>
        </div>
      </div>
    </div>
  )
}

type Props = {
  roomId: string
}

export default function RoomOverviewContent ({ roomId }: Props) {
  const router = useRouter()
  const [overviewData, setOverviewData] = useState<RoomOverviewData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const { showUnderDevelopment, ActionUnderDevelopmentOverlay } =
    useActionUnderDevelopment()

  // Handle auto-scroll to section based on URL query parameter
  useScrollToSection(loading)

  const fetchOverviewData = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/overview`)
      if (response.ok) {
        const data = await response.json()
        setOverviewData(data)
      }
    } catch (error) {
      console.error('Error fetching room overview data:', error)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  // Handle add lease - navigate directly, trigger handles conflict checking
  const handleAddLease = () => {
    router.push(`/rooms/${roomId}/leases/add-lease`)
  }

  // Handle cancel scheduled rental change
  const [cancellingChange, setCancellingChange] = useState(false)
  const handleCancelScheduledChange = async () => {
    if (!overviewData?.lease?.scheduled_change) return

    setCancellingChange(true)
    try {
      const response = await fetch(
        `/api/leases/${overviewData.lease.id}/cancel-rental-change`,
        { method: 'POST' }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel')
      }

      FeedbackToasts.deleted('Scheduled rental change')
      fetchOverviewData()
    } catch (error: any) {
      FeedbackToasts.deleteFailed('scheduled rental change', error.message)
    } finally {
      setCancellingChange(false)
    }
  }

  return (
    <>
      {/* Cards - Only Lease and Booking for rooms (no Contract) */}
      <div className='flex items-start gap-5 w-full'>
        {/* Lease Card */}
        {loading ? (
          <CardSkeleton />
        ) : overviewData?.roomStatus === 'Pending_Inspection' ||
          overviewData?.roomStatus === 'Under_Preparation' ? (
          <StatusCard
            iconStyles='bg-[#DEFFE2] text-(--success-dark)'
            Icon={ArrowDownLeft}
            title='Lease Overview'
            subtitle='Income from tenant'
            status={overviewData.roomStatus}
            roomId={roomId}
          />
        ) : overviewData?.lease ? (
          <Card
            iconStyles='bg-[#DEFFE2] text-(--success-dark)'
            Icon={ArrowDownLeft}
            title='Lease Overview'
            subtitle='Income from tenant'
            amount={formatCurrency(overviewData.lease.monthly_rent)}
            date_label='Due'
            date={formatDate(overviewData.lease.due_date)}
            user_name={overviewData.lease.tenant.name}
            user_link={`/tenants/${overviewData.lease.tenant.id}/overview`}
            user_type='Tenant'
            user_avatar={overviewData.lease.tenant.profile_thumb}
            menuItems={
              <>
                {overviewData.lease?.tenant.phone_number && (
                  <DropdownMenuItem
                    onClick={() => {
                      const whatsappUrl = buildWhatsAppLink(
                        overviewData.lease!.tenant.phone_number!
                      )
                      window.open(whatsappUrl, '_blank')
                    }}
                  >
                    WhatsApp {overviewData.lease.tenant.name.split(' ')[0]}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(
                      overviewData.lease!.reference_id
                    )
                  }
                >
                  Copy lease ID
                </DropdownMenuItem>
                <DropdownMenuItem>Edit lease</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Rental</DropdownMenuLabel>
                <ScheduleRentalChangeDialog
                  leaseId={overviewData.lease!.id}
                  onSuccess={fetchOverviewData}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Schedule rental change
                    </DropdownMenuItem>
                  }
                />
                <RentalHistoryDialog
                  leaseId={overviewData.lease!.id}
                  trigger={
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      View rental history
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <InitiateLeaseEndingDrawer
                  leaseId={overviewData.lease!.id}
                  propertyName={overviewData.propertyCode || 'Property'}
                  unitName={overviewData.roomTitle}
                  tenantName={overviewData.lease!.tenant.name}
                  onSuccess={fetchOverviewData}
                  trigger={
                    <button type='button' className='delete-dropdown-button'>
                      End Lease
                    </button>
                  }
                />
              </>
            }
          />
        ) : (
          <EmptyCard
            iconStyles='bg-[#DEFFE2] text-(--success-dark)'
            Icon={ArrowDownLeft}
            title='Lease Overview'
            subtitle='Income from tenant'
            buttonLabel='Add Lease'
            onClick={handleAddLease}
          />
        )}

        {/* Booking Card */}
        {loading ? (
          <CardSkeleton />
        ) : overviewData?.booking ? (
          <Card
            iconStyles='bg-(--info-light) text-(--info-main)'
            Icon={CalendarCheck2}
            title='Booking Overview'
            subtitle='Room reservation'
            amount={formatCurrency(overviewData.booking.amount)}
            date_label='Move in'
            date={formatDate(overviewData.booking.move_in_date)}
            user_name={overviewData.booking.tenant.name}
            user_type='Tenant'
            user_avatar={overviewData.booking.tenant.profile_thumb}
          />
        ) : (
          <EmptyCard
            iconStyles='bg-(--info-light) text-(--info-main)'
            Icon={CalendarCheck2}
            title='Booking Overview'
            subtitle='Room reservation'
            buttonLabel='Add Booking'
            onClick={showUnderDevelopment}
          />
        )}
      </div>

      {/* Scheduled Rental Change Banner - only show if rent hasn't already changed */}
      {!loading &&
        overviewData?.lease?.scheduled_change &&
        Math.abs(overviewData.lease.monthly_rent - overviewData.lease.scheduled_change.new_rent) > 0.01 && (
        <div className='w-full p-4 bg-amber-50 border border-amber-200 rounded-lg'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <Calendar className='h-5 w-5 text-amber-600 shrink-0' />
              <div>
                <p className='text-sm font-medium text-amber-800'>
                  Rental Change Scheduled
                </p>
                <p className='text-sm text-amber-700'>
                  {formatCurrency(overviewData.lease.scheduled_change.old_rent)} →{' '}
                  {formatCurrency(overviewData.lease.scheduled_change.new_rent)}
                  <span className='ml-1.5 inline-flex items-center gap-0.5'>
                    {overviewData.lease.scheduled_change.new_rent >
                    overviewData.lease.scheduled_change.old_rent ? (
                      <TrendingUp className='h-3 w-3' />
                    ) : (
                      <TrendingDown className='h-3 w-3' />
                    )}
                    {(
                      ((overviewData.lease.scheduled_change.new_rent -
                        overviewData.lease.scheduled_change.old_rent) /
                        overviewData.lease.scheduled_change.old_rent) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <span className='ml-2 text-amber-600'>
                    • Effective{' '}
                    {new Date(
                      overviewData.lease.scheduled_change.effective_from
                    ).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>
            <ConfirmationDialog
              title='Cancel Scheduled Rental Change'
              description={`Are you sure you want to cancel the scheduled rental change from ${formatCurrency(overviewData.lease.scheduled_change.old_rent)} to ${formatCurrency(overviewData.lease.scheduled_change.new_rent)}?`}
              confirmButtonLabel='Cancel Change'
              onConfirm={handleCancelScheduledChange}
              variant='warning'
              openDialogButton={
                <Button
                  variant='ghost'
                  className='h-8 px-3 text-amber-700 hover:text-amber-800 hover:bg-amber-100'
                  disabled={cancellingChange}
                >
                  Cancel
                </Button>
              }
            />
          </div>
        </div>
      )}

      {/* Payments */}
      <PaymentsSection roomId={roomId} hasActiveLease={!!overviewData?.lease} />
      {/* Recurring Payments */}
      <RecurringSectionRoom roomId={roomId} />
      <ActionUnderDevelopmentOverlay />
    </>
  )
}
