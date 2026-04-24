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
  ArrowUpRight,
  CalendarCheck2,
  Plus,
  Ban,
  X
} from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import PaymentsSection from '@/components/payments-section'
import RecurringSection from '@/components/recurring-section'
import InitiateLeaseEndingDrawer from '@/components/dialogs/initiate-lease-ending-drawer'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buildWhatsAppLink } from '@/utils/functions'
import { useScrollToSection } from '@/hooks/useScrollToSection'
import ScheduleRentalChangeDialog from '@/components/dialogs/schedule-rental-change-dialog'
import AddBookingWizard from '@/components/add-booking-wizard'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import RentalHistoryDialog from '@/components/dialogs/rental-history-dialog'
import ScheduledRentChangeBanner from '@/components/costume-ui/scheduled-rent-change-banner'
import ScheduledLeaseEndBanner from '@/components/costume-ui/scheduled-lease-end-banner'
import ScheduleLeaseEndDialog from '@/components/dialogs/schedule-lease-end-dialog'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'
import { usePermissions } from '@/hooks/use-permissions'

// Types for overview data
type ScheduledChange = {
  id: string
  old_rent: number
  new_rent: number
  effective_from: string
}

type ScheduledLeaseEnd = {
  id: string
  scheduled_date: string
  is_lapsed?: boolean
  days_until_dismissed?: number | null
}

type LeaseOverview = {
  id: string
  reference_id: string
  monthly_rent: number
  due_date: string
  start_date: string
  number_of_months: number | null
  tenant: {
    id: string
    name: string
    profile_thumb: string | null
    phone_number: string | null
  }
  scheduled_change: ScheduledChange | null
  scheduled_lease_end: ScheduledLeaseEnd | null
}

type ContractOverview = {
  id: string
  amount: number
  due_date: string | null
  owner: {
    id: string
    name: string
    profile_thumb: string | null
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

type PropertyOwner = {
  id: string
  name: string
  profile_thumb: string | null
}

type OverviewData = {
  propertyCode: string
  propertyStatus: string
  lease: LeaseOverview | null
  contract: ContractOverview | null
  booking: BookingOverview | null
  propertyOwner: PropertyOwner | null
  canAddLease: boolean
  leaseBlockedReason: string | null
  canAddBooking: boolean
  bookingBlockedReason: string | null
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
  detailsLink?: string
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
  detailsLink,
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
      <div className='flex items-center gap-2.5 select-none '>
        <UserAvatar
          imgSrc={item.avatar as string}
          name={item.label}
          size={40}
          className={'texts-body-large-medium'}
        />
        {user_link ? (
          <Link
            href={user_link}
            className='flex-1 flex flex-col hover:underline'
          >
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
            {detailsLink ? (
              <DropdownMenuItem asChild>
                <Link href={detailsLink}>View details</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>View details</DropdownMenuItem>
            )}
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
  footer?: React.ReactNode
}

const EmptyCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  buttonLabel,
  href,
  onClick,
  children,
  footer
}: EmptyCardProps) => {
  const content = (
    <>
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-neutral-100 group-hover:bg-neutral-200/70',
          'transition-colors duration-200'
        )}
        title={buttonLabel ? buttonLabel : 'Add Contract'}
      >
        <Plus
          className='text-neutral-400 group-hover:text-neutral-500 transition-colors duration-200'
          size={20}
          strokeWidth={2}
        />
      </div>
      {buttonLabel && <span className='texts-body-small-medium text-neutral-400 group-hover:text-neutral-500 transition-colors duration-200'>
        {buttonLabel}
      </span>}
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
      {/* Optional Footer */}
      {footer && (
        <div className='w-full pt-[15] border-t border-(--border-light) mt-auto'>
          {footer}
        </div>
      )}
    </div>
  )
}

// Blocked card when lease cannot be added
type BlockedCardProps = {
  iconStyles: string
  Icon: LucideIcon
  title: string
  subtitle: string
  blockedReason: string
}

const BlockedCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  blockedReason
}: BlockedCardProps) => {
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
      {/* Blocked State */}
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-2',
          'mt-4 mx-1 mb-1 rounded-lg',
          'border-2 border-dashed border-neutral-200',
          'bg-neutral-50/50'
        )}
      >
        <div className='flex items-center justify-center w-10 h-10 rounded-full bg-neutral-100'>
          <Ban className='text-neutral-400' size={20} strokeWidth={2} />
        </div>
        <span className='texts-body-small text-neutral-500 text-center px-4'>
          {blockedReason}
        </span>
      </div>
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
  propertyId: string
}

const StatusCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  status,
  propertyId
}: StatusCardProps) => {
  const [inspectionTaskId, setInspectionTaskId] = useState<string | null>(null)
  const isPendingInspection = status === 'Pending_Inspection'
  const isUnderPreparation = status === 'Under_Preparation'

  // Fetch the inspection task ID for this property
  useEffect(() => {
    const fetchInspectionTask = async () => {
      try {
        const response = await fetch(
          `/api/properties/${propertyId}/inspection-task`
        )
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
  }, [propertyId, isPendingInspection, isUnderPreparation])

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
            ? 'An inspection task is in progress for this property.'
            : isUnderPreparation
            ? 'Preparation tasks are in progress for this property.'
            : 'Property is not ready for lease.'}
        </p>
        {inspectionTaskId && (
          <Link href={`/tasks/${inspectionTaskId}`}>
            <Button variant='outline' size='sm' className='gap-2'>
              View Tasks
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
  propertyId: string
}

export default function OverviewContent ({ propertyId }: Props) {
  const { can } = usePermissions()
  const router = useRouter()
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  // Handle auto-scroll to section based on URL query parameter
  useScrollToSection(loading)

  const fetchOverviewData = useCallback(async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/overview`)
      if (response.ok) {
        const data = await response.json()
        console.log(data)
        setOverviewData(data)
      }
    } catch (error) {
      console.error('Error fetching overview data:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchOverviewData()
  }, [fetchOverviewData])

  // Handle add lease - navigate directly, trigger handles conflict checking
  const handleAddLease = () => {
    router.push(`/properties/${propertyId}/leases/add-lease`)
  }

  const handleUnassignOwner = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/assign-owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: null })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unassign owner')
      }
      FeedbackToasts.updated('Owner', 'Owner unassigned successfully')
      fetchOverviewData()
    } catch (err: any) {
      FeedbackToasts.operationFailed('Unassign owner', err.message)
    }
  }

  const handleCancelBooking = async () => {
    if (!overviewData?.booking) return
    try {
      const response = await fetch(`/api/bookings/${overviewData.booking.id}/cancel`, {
        method: 'PATCH'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }
      FeedbackToasts.updated('Booking', 'Booking has been cancelled')
      fetchOverviewData()
    } catch (err: any) {
      FeedbackToasts.operationFailed('Cancel booking', err.message)
    }
  }

  return (
    <>
      {/* Cards */}
      <div className='flex items-start gap-5 w-full'>
        {/* Lease Card */}
        <PermissionGate 
          permission="leases.access" 
          fallback={
            <NoAccessCard 
              label="Lease Overview" 
            />
          }
        >
          {loading ? (
            <CardSkeleton />
          ) : overviewData?.propertyStatus === 'Pending_Inspection' ||
            overviewData?.propertyStatus === 'Under_Preparation' ? (
            <StatusCard
              iconStyles='bg-[#DEFFE2] text-(--success-dark)'
              Icon={ArrowDownLeft}
              title='Lease Overview'
              subtitle='Income from tenant'
              status={overviewData.propertyStatus}
              propertyId={propertyId}
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
              detailsLink={`/properties/${propertyId}/leases/${overviewData.lease.id}/details`}
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
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/properties/${propertyId}/leases/${overviewData.lease!.id}/transfer`}
                    >
                      Transfer Lease
                    </Link>
                  </DropdownMenuItem>
                  <ScheduleLeaseEndDialog
                    leaseId={overviewData.lease!.id}
                    onSuccess={fetchOverviewData}
                    trigger={
                      <DropdownMenuItem onSelect={e => e.preventDefault()}>
                        Schedule Lease End
                      </DropdownMenuItem>
                    }
                  />
                  <InitiateLeaseEndingDrawer
                    leaseId={overviewData.lease!.id}
                    propertyName={overviewData.propertyCode}
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
          ) : overviewData?.canAddLease && can('leases.create') ? (
            <EmptyCard
              iconStyles='bg-[#DEFFE2] text-(--success-dark)'
              Icon={ArrowDownLeft}
              title='Lease Overview'
              subtitle='Income from tenant'
              buttonLabel='Add Lease'
              onClick={handleAddLease}
            />
          ) : (
            <BlockedCard
              iconStyles='bg-[#DEFFE2] text-(--success-dark)'
              Icon={ArrowDownLeft}
              title='Lease Overview'
              subtitle='Income from tenant'
              blockedReason={overviewData?.leaseBlockedReason || 'Cannot add lease'}
            />
          )}
        </PermissionGate>

        {/* Contract Card */}
        {loading ? (
          <CardSkeleton />
        ) : overviewData?.contract ? (
          <Card
            iconStyles='bg-(--warning-light) text-(--warning-dark)'
            Icon={ArrowUpRight}
            title='Contract Overview'
            subtitle='Payment to owner'
            amount={formatCurrency(overviewData.contract.amount)}
            date_label='Due'
            date={
              overviewData.contract.due_date
                ? formatDate(overviewData.contract.due_date)
                : '—'
            }
            user_name={overviewData.contract.owner.name}
            user_type='Owner'
            user_avatar={overviewData.contract.owner.profile_thumb}
          />
        ) : (
          <EmptyCard
            iconStyles='bg-(--warning-light) text-(--warning-dark)'
            Icon={ArrowUpRight}
            title='Contract Overview'
            subtitle='Payment to owner'
            buttonLabel={overviewData?.propertyOwner ? undefined : 'Add Contract'}
            href={`/properties/${propertyId}/contracts/add-contract`}
            footer={
              overviewData?.propertyOwner && (
                <div className='flex items-center gap-2.5 select-none'>
                  <UserAvatar
                    imgSrc={overviewData.propertyOwner.profile_thumb}
                    name={overviewData.propertyOwner.name}
                    size={40}
                    className='texts-body-large-medium'
                  />
                  <div className='flex-1 flex flex-col'>
                    <span className='texts-body-large-medium'>
                      {overviewData.propertyOwner.name}
                    </span>
                    <span className='texts-caption-large text-(--text-secondary)'>
                      Owner
                    </span>
                  </div>
                  <ConfirmationDialog
                    openDialogButton={
                      <button
                        type='button'
                        className='p-1 rounded-full hover:bg-neutral-100 transition-colors'
                        title='Unassign owner'
                      >
                        <X size={16} className='text-neutral-400 hover:text-neutral-600' />
                      </button>
                    }
                    title='Unassign Owner'
                    description={<>Are you sure you want to unassign <strong>{overviewData.propertyOwner.name}</strong> from this property?</>}
                    onConfirm={handleUnassignOwner}
                    confirmButtonLabel='Unassign'
                    confirmButtonLoadingLabel='Unassigning...'
                    variant='confirm'
                  />
                </div>
              )
            }
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
            subtitle='Property reservation'
            amount={formatCurrency(overviewData.booking.amount)}
            date_label='Move in'
            date={formatDate(overviewData.booking.move_in_date)}
            user_name={overviewData.booking.tenant.name}
            user_type='Tenant'
            user_avatar={overviewData.booking.tenant.profile_thumb}
            menuItems={
              <>
                <DropdownMenuItem
                  onClick={() => router.push(`/properties/${propertyId}/leases/add-lease?bookingId=${overviewData!.booking!.id}`)}
                >
                  Convert to Lease
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <ConfirmationDialog
                  openDialogButton={
                    <button type='button' className='delete-dropdown-button'>
                      Cancel Booking
                    </button>
                  }
                  title='Cancel Booking'
                  description='Are you sure you want to cancel this booking? This action cannot be undone.'
                  onConfirm={handleCancelBooking}
                  confirmButtonLabel='Cancel Booking'
                  confirmButtonLoadingLabel='Cancelling...'
                  variant='confirm'
                />
              </>
            }
          />
        ) : overviewData?.canAddBooking ? (
          <EmptyCard
            iconStyles='bg-(--info-light) text-(--info-main)'
            Icon={CalendarCheck2}
            title='Booking Overview'
            subtitle='Property reservation'
            buttonLabel='Add Booking'
            onClick={() => setBookingDialogOpen(true)}
          />
        ) : (
          <BlockedCard
            iconStyles='bg-(--info-light) text-(--info-main)'
            Icon={CalendarCheck2}
            title='Booking Overview'
            subtitle='Property reservation'
            blockedReason={overviewData?.bookingBlockedReason || 'Cannot add booking'}
          />
        )}
      </div>

      {/* Scheduled Rental Change Banner */}
      {!loading && overviewData?.lease?.scheduled_change && (
        <ScheduledRentChangeBanner
          leaseId={overviewData.lease.id}
          scheduledChange={overviewData.lease.scheduled_change}
          currentRent={overviewData.lease.monthly_rent}
          onCancelSuccess={fetchOverviewData}
        />
      )}

      {/* Scheduled Lease End Banner */}
      {!loading && overviewData?.lease?.scheduled_lease_end && (
        <ScheduledLeaseEndBanner
          leaseId={overviewData.lease.id}
          scheduledEnd={overviewData.lease.scheduled_lease_end}
          onCancelSuccess={fetchOverviewData}
          endLeaseAction={
            overviewData.lease.scheduled_lease_end.is_lapsed ? (
              <InitiateLeaseEndingDrawer
                leaseId={overviewData.lease.id}
                propertyName={overviewData.propertyCode}
                tenantName={overviewData.lease.tenant.name}
                onSuccess={fetchOverviewData}
                trigger={
                  <Button
                    variant='ghost'
                    className='h-8 px-3 bg-red-600 text-white hover:bg-red-700 hover:text-white'
                  >
                    End Lease
                  </Button>
                }
              />
            ) : undefined
          }
        />
      )}

      {/* Payments */}
      <PermissionGate
        permission="payments.access"
        fallback={<NoAccessCard label="Recent Payments" />}
      >
        <PaymentsSection
          propertyId={propertyId}
          hasActiveLease={!!overviewData?.lease}
          activeLeaseId={overviewData?.lease?.id}
        />
      </PermissionGate>
      {/* Recurring Payments & Expenses */}
      <PermissionGate
        permission="recurring.access"
        fallback={<NoAccessCard label="Recurring Payments & Expenses" />}
      >
        <RecurringSection propertyId={propertyId} />
      </PermissionGate>

      {/* Add Booking Wizard */}
      <AddBookingWizard
        propertyId={propertyId}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onSuccess={fetchOverviewData}
      />
    </>
  )
}
