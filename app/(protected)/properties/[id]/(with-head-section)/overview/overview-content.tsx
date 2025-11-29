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
  Plus
} from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import PaymentsSection from '@/components/payments-section'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { showFeedbackToast } from '@/components/costume-ui/feedback-toast'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

// Types for overview data
type LeaseOverview = {
  id: string
  monthly_rent: number
  due_date: string
  tenant: {
    id: string
    name: string
    profile_thumb: string | null
  }
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

type OverviewData = {
  lease: LeaseOverview | null
  contract: ContractOverview | null
  booking: BookingOverview | null
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
  user_type,
  user_avatar,
  menuItems
}: CardProps) => {
  const renderAvatar = (item: ComboBoxitemsType) => {
    return (
      <div className='flex items-center gap-2.5 select-none'>
        {item.avatar ? (
          <span className='w-10 h-10 relative rounded-full overflow-hidden'>
            <Image
              src={item.avatar as string}
              alt='Profile pic'
              fill
              className='object-cover'
            />
          </span>
        ) : (
          <UserAvatar
            name={item.label}
            size={40}
            className={'texts-body-large-medium'}
          />
        )}
        <div className='flex-1 flex flex-col'>
          <span className='texts-body-large-medium'>{item.label}</span>
          {item.subtitle && (
            <span className='texts-caption-large text-(--text-secondary)'>
              {item.subtitle}
            </span>
          )}
        </div>
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
  buttonLabel: string
  href: string
}

const EmptyCard = ({
  iconStyles,
  Icon,
  title,
  subtitle,
  buttonLabel,
  href
}: EmptyCardProps) => {
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
      <Link
        href={href}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-2',
          'mt-4 mx-1 mb-1 rounded-lg',
          'border-2 border-dashed border-neutral-200',
          'hover:border-neutral-300 hover:bg-neutral-50/50',
          'transition-all duration-200 cursor-pointer group'
        )}
      >
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
      </Link>
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

export default function OverviewContent({ propertyId }: Props) {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOverviewData = useCallback(async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}/overview`)
      if (response.ok) {
        const data = await response.json()
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

  return (
    <>
      {/* Cards */}
      <div className='flex items-start gap-5 w-full'>
        {/* Lease Card */}
        {loading ? (
          <CardSkeleton />
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
            user_type='Tenant'
            user_avatar={overviewData.lease.tenant.profile_thumb}
            menuItems={
              <>
                <DropdownMenuSeparator />
                <ConfirmationDialog
                  openDialogButton={
                    <DropdownMenuItem
                      onSelect={e => e.preventDefault()}
                      className='text-error-main focus:text-error-main'
                    >
                      End Lease
                    </DropdownMenuItem>
                  }
                  title='End Lease'
                  description={
                    <div className='space-y-3'>
                      <p>
                        You are about to <strong>permanently end this lease</strong>. This action is <strong>irreversible</strong> and will:
                      </p>
                      <ul className='list-disc list-inside space-y-1 text-sm'>
                        <li>Change the lease status to <strong>Ended</strong></li>
                        <li>Cancel all pending payments linked to this lease</li>
                        <li>Stop any recurring payment schedules</li>
                      </ul>
                      <p className='text-sm text-neutral-500'>
                        This cannot be undone. Please make sure all outstanding payments have been collected before proceeding.
                      </p>
                    </div>
                  }
                  confirmationText='END'
                  confirmButtonLabel='End Lease'
                  confirmButtonLoadingLabel='Ending...'
                  confirmButtonClassName='bg-amber-600! hover:bg-amber-700!'
                  inputLabel='Type END to confirm'
                  variant='warning'
                  onConfirm={async () => {
                    const response = await fetch(
                      `/api/leases/end/${overviewData.lease!.id}`,
                      { method: 'POST' }
                    )
                    if (!response.ok) {
                      const data = await response.json()
                      showFeedbackToast({
                        title: 'Failed to end lease',
                        description: data.error || 'Please try again.',
                        type: 'error'
                      })
                      throw new Error(data.error)
                    }
                    showFeedbackToast({
                      title: 'Lease ended successfully',
                      description: 'All pending payments have been cancelled.',
                      type: 'success'
                    })
                    fetchOverviewData()
                  }}
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
            href={`/properties/${propertyId}/leases/add-lease`}
          />
        )}

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
            date={overviewData.contract.due_date ? formatDate(overviewData.contract.due_date) : '—'}
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
            buttonLabel='Add Contract'
            href={`#`}
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
          />
        ) : (
          <EmptyCard
            iconStyles='bg-(--info-light) text-(--info-main)'
            Icon={CalendarCheck2}
            title='Booking Overview'
            subtitle='Property reservation'
            buttonLabel='Add Booking'
            href={`#`}
          />
        )}
      </div>
      {/* Payments */}
      <PaymentsSection propertyId={propertyId} />
    </>
  )
}
