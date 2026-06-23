'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Breadcrumb from '@/components/costume-ui/breadcrumb'
import Button from '@/components/costume-ui/button'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import TimestampWithTooltip from '@/components/costume-ui/timestamp-with-tooltip'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import ScheduleRentalChangeDialog from '@/components/dialogs/schedule-rental-change-dialog'
import InitiateLeaseEndingDrawer from '@/components/dialogs/initiate-lease-ending-drawer'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import ScheduledRentChangeBanner from '@/components/costume-ui/scheduled-rent-change-banner'
import ScheduledLeaseEndBanner from '@/components/costume-ui/scheduled-lease-end-banner'
import ScheduleLeaseEndDialog from '@/components/dialogs/schedule-lease-end-dialog'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { buildWhatsAppLink } from '@/utils/functions'
import { cn } from '@/lib/utils'
import type { LeaseDetailsData } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Building2,
  DoorOpen,
  User,
  Repeat,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  ArrowRightLeft,
  Bell,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  Banknote,
  History,
  Timer,
  CalendarX2,
  Pencil
} from 'lucide-react'

type Props = {
  data: LeaseDetailsData
  sourceType: 'property' | 'room'
  sourceId: string
  userType: 'staff' | 'tenant'
}


export default function LeaseDetailsContent({ data, sourceType, sourceId, userType }: Props) {
  const router = useRouter()
  const { lease, pending_rental, recent_payments, recurring_payments } = data

  // Build breadcrumb - different paths for staff vs tenant
  const breadcrumbItems = userType === 'tenant'
    ? [
        { label: 'Rentals', href: '/rentals' },
        { label: lease.reference_id }
      ]
    : sourceType === 'property'
      ? [
          { label: 'Properties', href: '/properties' },
          { label: lease.property.code, href: `/properties/${sourceId}/leases` },
          { label: lease.reference_id }
        ]
      : [
          { label: 'Rooms', href: '/rooms' },
          { label: `${lease.property.code}(${lease.room?.title})`, href: `/rooms/${sourceId}/leases` },
          { label: lease.reference_id }
        ]

  // Status styling
  const statusKey = lease.status.toLowerCase()

  // Transfer info helpers
  const getTransferInfo = () => {
    if (lease.transfer.is_transferred_from && lease.transfer.transferred_to_lease) {
      // This is the OLD lease - tenant moved FROM here TO another property
      const target = lease.transfer.transferred_to_lease
      const locationLabel = target.room_title
        ? `${target.property_code}(${target.room_title})`
        : target.property_code

      // Use /rentals/ path for tenants, property/room paths for staff
      const link = userType === 'tenant'
        ? `/rentals/${target.id}`
        : target.room_id
          ? `/rooms/${target.room_id}/leases/${target.id}/details`
          : `/properties/${target.property_id}/leases/${target.id}/details`

      return {
        label: 'Tenant transferred to',
        location: locationLabel,
        link,
        variant: 'transferred-out' as const
      }
    }

    if (lease.transfer.is_transferred_to && lease.transfer.transferred_from_lease) {
      // This is the NEW lease - tenant moved here FROM another property
      const source = lease.transfer.transferred_from_lease
      const locationLabel = source.room_title
        ? `${source.property_code}(${source.room_title})`
        : source.property_code

      // Use /rentals/ path for tenants, property/room paths for staff
      const link = userType === 'tenant'
        ? `/rentals/${source.id}`
        : source.room_id
          ? `/rooms/${source.room_id}/leases/${source.id}/details`
          : `/properties/${source.property_id}/leases/${source.id}/details`

      return {
        label: 'Tenant transferred from',
        location: locationLabel,
        link,
        variant: 'transferred-in' as const
      }
    }

    return null
  }

  const transferInfo = getTransferInfo()

  // Calculate tenure display
  const getTenureDisplay = () => {
    if (lease.number_of_months === null) return 'Ongoing (No end date)'
    if (lease.number_of_months === 1) return '1 month'
    if (lease.number_of_months === 12) return '1 year'
    if (lease.number_of_months % 12 === 0) return `${lease.number_of_months / 12} years`
    return `${lease.number_of_months} months`
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(lease.reference_id)
    toast.success('Copied to clipboard')
  }

  const canEndLease = lease.db_status === 'Current'
  const canTransfer = lease.db_status === 'Current'
  const canScheduleChange = lease.db_status === 'Current' && !lease.upcoming_change
  const canScheduleLeaseEnd = lease.db_status === 'Current' && !lease.upcoming_lease_end
  const canEdit = ['Current', 'Scheduled'].includes(lease.db_status)

  return (
    <div className='flex flex-col gap-5'>
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <h2>{lease.reference_id}</h2>
            <div
              data-status={statusKey}
              className={cn(
                'status-styles',
                'data-[status=current]:bg-green-100 data-[status=current]:text-green-800',
                'data-[status=scheduled]:bg-blue-100 data-[status=scheduled]:text-blue-800',
                'data-[status=expired]:bg-yellow-100 data-[status=expired]:text-yellow-800',
                'data-[status=ended]:bg-red-100 data-[status=ended]:text-red-800'
              )}
            >
              {lease.status}
            </div>
          </div>
          <span className='texts-body-medium text-(--text-secondary)'>
            {lease.is_property_lease ? 'Property Lease' : 'Room Lease'}
            {' • '}
            {getTenureDisplay()}
          </span>
        </div>

        {/* Action Buttons - Staff only */}
        {userType === 'staff' && (
          <div className='flex items-center gap-2.5'>
            {canEdit && (
              <Link href={sourceType === 'property'
                ? `/properties/${sourceId}/leases/${lease.id}/edit`
                : `/rooms/${sourceId}/leases/${lease.id}/edit`
              }>
                <Button
                  variant='secondary'
                  label='Edit'
                  icon={<Pencil size={16} />}
                />
              </Link>
            )}

            {canScheduleChange && (
              <ScheduleRentalChangeDialog
                leaseId={lease.id}
                trigger={
                  <Button
                    variant='secondary'
                    label='Schedule Rent Change'
                    icon={<TrendingUp size={16} />}
                  />
                }
                onSuccess={() => router.refresh()}
              />
            )}

            {canScheduleLeaseEnd && (
              <ScheduleLeaseEndDialog
                leaseId={lease.id}
                trigger={
                  <Button
                    variant='secondary'
                    label='Schedule Lease End'
                    icon={<CalendarX2 size={16} />}
                  />
                }
                onSuccess={() => router.refresh()}
              />
            )}

            {canTransfer && (
              <Link href={sourceType === 'property'
                ? `/properties/${sourceId}/leases/${lease.id}/transfer`
                : `/rooms/${sourceId}/leases/${lease.id}/transfer`
              }>
                <Button
                  variant='secondary'
                  label='Transfer'
                  icon={<ArrowRightLeft size={16} />}
                />
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='secondary'
                  icon={<MoreHorizontal size={16} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={handleCopyId}>
                  <Copy size={14} className='mr-2' />
                  Copy Lease ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {canEndLease && (
                  <InitiateLeaseEndingDrawer
                    leaseId={lease.id}
                    propertyName={lease.property.code}
                    unitName={lease.room?.title}
                    tenantName={lease.tenant.name}
                    trigger={
                      <DropdownMenuItem
                        className='text-red-600 focus:text-red-600'
                        onSelect={(e) => e.preventDefault()}
                      >
                        <XCircle size={14} className='mr-2' />
                        End Lease
                      </DropdownMenuItem>
                    }
                    onSuccess={() => router.refresh()}
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='flex flex-col lg:flex-row gap-5'>
        {/* Left Column - Main Info */}
        <div className='flex-1 flex flex-col gap-5'>
          {/* Transfer Banner - Show prominently if transferred */}
          {transferInfo && (
            <div
              className={cn(
                'p-4 rounded-[12px] border',
                transferInfo.variant === 'transferred-out'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              )}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div
                    className={cn(
                      'flex items-center justify-center rounded-full h-10 w-10',
                      transferInfo.variant === 'transferred-out'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    <ArrowRightLeft size={20} />
                  </div>
                  <div className='flex flex-col'>
                    <span
                      className={cn(
                        'texts-body-medium-medium',
                        transferInfo.variant === 'transferred-out'
                          ? 'text-amber-800'
                          : 'text-blue-800'
                      )}
                    >
                      {transferInfo.label}
                    </span>
                    <span
                      className={cn(
                        'texts-body-small',
                        transferInfo.variant === 'transferred-out'
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      )}
                    >
                      {transferInfo.location}
                    </span>
                  </div>
                </div>
                <Link href={transferInfo.link}>
                  <Button
                    variant='secondary'
                    label='View Lease'
                    icon={<ExternalLink size={14} />}
                    className='text-sm!'
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming Rent Change Banner */}
          {lease.upcoming_change && (
            <ScheduledRentChangeBanner
              leaseId={lease.id}
              scheduledChange={lease.upcoming_change}
              currentRent={lease.monthly_rent}
              onCancelSuccess={() => router.refresh()}
              showCancelButton={userType === 'staff'}
            />
          )}

          {/* Upcoming Lease End Banner */}
          {lease.upcoming_lease_end && (
            <ScheduledLeaseEndBanner
              leaseId={lease.id}
              scheduledEnd={lease.upcoming_lease_end}
              onCancelSuccess={() => router.refresh()}
              showCancelButton={userType === 'staff'}
              endLeaseAction={
                lease.upcoming_lease_end.is_lapsed && userType === 'staff' ? (
                  <InitiateLeaseEndingDrawer
                    leaseId={lease.id}
                    propertyName={lease.property.code}
                    unitName={lease.room?.title}
                    tenantName={lease.tenant.name}
                    onSuccess={() => router.refresh()}
                    trigger={
                      <button
                        type='button'
                        className='h-8 px-3 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700'
                      >
                        End Lease
                      </button>
                    }
                  />
                ) : undefined
              }
            />
          )}

          {/* Lease Summary Card */}
          <div className='card-styles'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-[#DEFFE2] text-(--success-dark)'>
                <FileText size={19} strokeWidth={1.5} />
              </div>
              <div className='flex flex-col'>
                <span className='texts-body-medium-medium'>Lease Summary</span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Key lease information
                </span>
              </div>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-5 pt-4'>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>Monthly Rent</span>
                <span className='texts-body-large-medium text-(--text-primary)'>
                  {formatCurrency(lease.monthly_rent)}
                </span>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>Payment Day</span>
                <span className='texts-body-large-medium text-(--text-primary)'>
                  Day {lease.payment_day}
                </span>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>Start Date</span>
                <span className='texts-body-large-medium text-(--text-primary)'>
                  {formatDate(lease.start_date)}
                </span>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>
                  {lease.end_date ? 'End Date' : 'Duration'}
                </span>
                <span className='texts-body-large-medium text-(--text-primary)'>
                  {lease.end_date ? formatDate(lease.end_date) : 'Ongoing'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Rental Payment Card */}
          {pending_rental && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-(--warning-light) text-(--warning-dark)'>
                  <Banknote size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Current Rental Payment</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Next due payment
                  </span>
                </div>
              </div>

              <div className='flex items-center justify-between pt-4'>
                <div className='flex flex-col gap-1'>
                  <Link
                    href={`/payments/${pending_rental.reference_id}`}
                    className='texts-body-medium-medium text-(--text-primary) hover:text-(--info-main) hover:underline'
                  >
                    {pending_rental.reference_id}
                  </Link>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Due: {pending_rental.due_date ? formatDate(pending_rental.due_date) : 'No due date'}
                  </span>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <span className='texts-body-large-medium text-(--text-primary)'>
                    {formatCurrency(pending_rental.total_amount)}
                  </span>
                  <div
                    data-status={pending_rental.status.toLowerCase()}
                    className={cn(
                      'status-styles',
                      'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                      'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800'
                    )}
                  >
                    {pending_rental.status}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Payments Card */}
          {recent_payments.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center justify-between pb-4 border-b border-(--border-light)'>
                <div className='flex items-center gap-2.5'>
                  <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-blue-100 text-blue-700'>
                    <History size={19} strokeWidth={1.5} />
                  </div>
                  <div className='flex flex-col'>
                    <span className='texts-body-medium-medium'>Payment History</span>
                    <span className='texts-caption-large text-(--text-secondary)'>
                      Recent payments
                    </span>
                  </div>
                </div>
                <Link href={`/payments?lease_id=${lease.reference_id}`}>
                  <Button variant='info' label='View All' className='text-sm!' />
                </Link>
              </div>

              <div className='flex flex-col divide-y divide-(--border-light) pt-2'>
                {recent_payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className='flex items-center justify-between py-3'>
                    <div className='flex flex-col gap-0.5'>
                      <Link
                        href={`/payments/${payment.reference_id}`}
                        className='texts-body-small-medium text-(--text-primary) hover:text-(--info-main) hover:underline'
                      >
                        {payment.reference_id}
                      </Link>
                      <span className='texts-caption-large text-(--text-secondary)'>
                        {payment.type.replace(/_/g, ' ')}
                        {payment.due_date && ` • ${formatDate(payment.due_date)}`}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='texts-body-small-medium text-(--text-primary)'>
                        {formatCurrency(payment.total_amount)}
                      </span>
                      <div
                        data-status={payment.status.toLowerCase()}
                        className={cn(
                          'status-styles text-xs!',
                          'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                          'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800',
                          'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                        )}
                      >
                        {payment.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Payments Card */}
          {recurring_payments.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-purple-100 text-purple-700'>
                  <Repeat size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Recurring Payments</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    {recurring_payments.length} recurring {recurring_payments.length === 1 ? 'payment' : 'payments'}
                  </span>
                </div>
              </div>

              <div className='flex flex-col divide-y divide-(--border-light) pt-2'>
                {recurring_payments.map((recurring) => (
                  <div key={recurring.id} className='flex items-center justify-between py-3'>
                    <div className='flex flex-col gap-0.5'>
                      <span className='texts-body-small-medium text-(--text-primary)'>
                        {recurring.title}
                      </span>
                      <span className='texts-caption-large text-(--text-secondary)'>
                        {recurring.schedule}
                      </span>
                    </div>
                    {recurring.latest_payment && (
                      <div className='flex flex-col items-end gap-0.5'>
                        <span className='texts-body-small text-(--text-secondary)'>
                          Latest: {formatCurrency(recurring.latest_payment.amount)}
                        </span>
                        <div
                          data-status={recurring.latest_payment.status.toLowerCase()}
                          className={cn(
                            'status-styles text-xs!',
                            'data-[status=pending]:bg-gray-100 data-[status=pending]:text-gray-800',
                            'data-[status=paid]:bg-green-100 data-[status=paid]:text-green-800'
                          )}
                        >
                          {recurring.latest_payment.status}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rent Change History Card */}
          {lease.scheduled_changes.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-emerald-100 text-emerald-700'>
                  <TrendingUp size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Rent Change History</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    All rent adjustments
                  </span>
                </div>
              </div>

              <div className='flex flex-col divide-y divide-(--border-light) pt-2'>
                {lease.scheduled_changes.map((change) => (
                  <div key={change.id} className='flex items-center justify-between py-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex flex-col gap-0.5'>
                        <div className='flex items-center gap-2'>
                          <span className='texts-body-small-medium text-(--text-primary)'>
                            {formatCurrency(change.old_rent)}
                          </span>
                          <ArrowRight size={14} className='text-(--text-secondary)' />
                          <span className='texts-body-small-medium text-(--text-primary)'>
                            {formatCurrency(change.new_rent)}
                          </span>
                        </div>
                        <span className='texts-caption-large text-(--text-secondary)'>
                          Effective: {formatDate(change.effective_from)}
                        </span>
                      </div>
                    </div>
                    <div
                      data-status={change.status.toLowerCase()}
                      className={cn(
                        'status-styles text-xs!',
                        'data-[status=scheduled]:bg-blue-100 data-[status=scheduled]:text-blue-800',
                        'data-[status=applied]:bg-green-100 data-[status=applied]:text-green-800',
                        'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                      )}
                    >
                      {change.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lease End Schedule History Card */}
          {lease.scheduled_lease_ends.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-amber-100 text-amber-700'>
                  <CalendarX2 size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Lease End Schedule History</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Planned checkout dates
                  </span>
                </div>
              </div>

              <div className='flex flex-col divide-y divide-(--border-light) pt-2'>
                {lease.scheduled_lease_ends.map((schedule) => (
                  <div key={schedule.id} className='flex items-center justify-between py-3'>
                    <div className='flex flex-col gap-0.5'>
                      <span className='texts-body-small-medium text-(--text-primary)'>
                        {formatDate(schedule.scheduled_date)}
                      </span>
                      <span className='texts-caption-large text-(--text-secondary)'>
                        Created: {formatDate(schedule.created_at)}
                      </span>
                    </div>
                    <div
                      data-status={schedule.status.toLowerCase()}
                      className={cn(
                        'status-styles text-xs!',
                        'data-[status=current]:bg-amber-100 data-[status=current]:text-amber-800',
                        'data-[status=lapsed]:bg-red-100 data-[status=lapsed]:text-red-800',
                        'data-[status=cancelled]:bg-neutral-200 data-[status=cancelled]:text-neutral-600'
                      )}
                    >
                      {schedule.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className='lg:w-80 flex flex-col gap-5'>
          {/* Tenant Card - Only show for staff */}
          {userType === 'staff' && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-teal-100 text-teal-600'>
                  <User size={19} strokeWidth={1.5} />
                </div>
                <span className='texts-body-medium-medium'>Tenant</span>
              </div>

              <div className='flex flex-col gap-3 pt-4'>
                <div className='flex items-center gap-3'>
                  <UserAvatar
                    name={lease.tenant.name}
                    imgSrc={lease.tenant.profile_thumb}
                    size={40}
                  />
                  <div className='flex flex-col'>
                    <Link
                      href={`/tenants/${lease.tenant.id}/overview`}
                      className='texts-body-medium-medium text-(--text-primary) hover:text-(--info-main) hover:underline'
                    >
                      {lease.tenant.name}
                    </Link>
                    <span className='texts-caption-large text-(--text-secondary)'>
                      {lease.tenant.type === 'Company' ? 'Company' : 'Individual'}
                    </span>
                  </div>
                </div>

                {(lease.tenant.phone || lease.tenant.email) && (
                  <div className='flex flex-col gap-2 pt-3 border-t border-(--border-light)'>
                    {lease.tenant.phone && (
                      <a
                        href={buildWhatsAppLink(lease.tenant.phone)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-2 texts-caption-large text-(--text-secondary) hover:text-(--text-primary)'
                      >
                        <Phone size={12} />
                        {lease.tenant.phone}
                      </a>
                    )}
                    {lease.tenant.email && (
                      <a
                        href={`mailto:${lease.tenant.email}`}
                        className='flex items-center gap-2 texts-caption-large text-(--text-secondary) hover:text-(--text-primary)'
                      >
                        <Mail size={12} />
                        {lease.tenant.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Property/Room Card */}
          <div className='card-styles'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-orange-100 text-orange-700'>
                {lease.room ? <DoorOpen size={19} strokeWidth={1.5} /> : <Building2 size={19} strokeWidth={1.5} />}
              </div>
              <div className='flex flex-col'>
                <span className='texts-body-medium-medium'>
                  {lease.room ? 'Room' : 'Property'}
                </span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Location details
                </span>
              </div>
            </div>

            <div className='flex flex-col gap-3 pt-4'>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>
                  {lease.room ? 'Room' : 'Property'}
                </span>
                {userType === 'staff' ? (
                  <Link
                    href={lease.room
                      ? `/rooms/${lease.room.id}/overview`
                      : `/properties/${lease.property.id}/overview`
                    }
                    className='texts-body-medium-medium text-(--text-primary) hover:text-(--info-main) hover:underline'
                  >
                    {lease.room
                      ? `${lease.property.code}(${lease.room.title})`
                      : lease.property.code
                    }
                  </Link>
                ) : (
                  <span className='texts-body-medium-medium text-(--text-primary)'>
                    {lease.room
                      ? `${lease.property.code}(${lease.room.title})`
                      : lease.property.code
                    }
                  </span>
                )}
              </div>

              {lease.property.address && (
                <div className='flex flex-col gap-1'>
                  <span className='texts-caption-large text-(--text-secondary)'>Address</span>
                  <span className='texts-body-small text-(--text-primary)'>
                    {lease.property.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Late Charges Card - Staff only */}
          {userType === 'staff' && lease.late_charges.length > 0 && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-red-100 text-red-700'>
                  <Timer size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Late Charges</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Penalty structure
                  </span>
                </div>
              </div>

              <div className='flex flex-col gap-2 pt-4'>
                {lease.late_charges.map((charge) => (
                  <div key={charge.id} className='flex items-center justify-between'>
                    <span className='texts-body-small text-(--text-secondary)'>
                      After {charge.days_after_due} day{charge.days_after_due > 1 ? 's' : ''}
                    </span>
                    <span className='texts-body-small-medium text-(--text-primary)'>
                      {formatCurrency(charge.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders Card - Staff only */}
          {userType === 'staff' && (lease.reminders.expiry.enabled || lease.reminders.rent.enabled || lease.reminders.overdue.enabled) && (
            <div className='card-styles'>
              <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
                <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-yellow-100 text-yellow-700'>
                  <Bell size={19} strokeWidth={1.5} />
                </div>
                <div className='flex flex-col'>
                  <span className='texts-body-medium-medium'>Reminders</span>
                  <span className='texts-caption-large text-(--text-secondary)'>
                    Active notifications
                  </span>
                </div>
              </div>

              <div className='flex flex-col gap-2 pt-4'>
                {lease.reminders.expiry.enabled && (
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 size={14} className='text-green-600' />
                    <span className='texts-body-small text-(--text-secondary)'>
                      Lease expiry: {lease.reminders.expiry.days_before} days before
                    </span>
                  </div>
                )}
                {lease.reminders.rent.enabled && (
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 size={14} className='text-green-600' />
                    <span className='texts-body-small text-(--text-secondary)'>
                      Rent due: {lease.reminders.rent.days_before} days before
                    </span>
                  </div>
                )}
                {lease.reminders.overdue.enabled && (
                  <div className='flex items-center gap-2'>
                    <CheckCircle2 size={14} className='text-green-600' />
                    <span className='texts-body-small text-(--text-secondary)'>
                      Overdue: {lease.reminders.overdue.days_after} days after
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Card */}
          <div className='card-styles'>
            <div className='flex items-center gap-2.5 pb-4 border-b border-(--border-light)'>
              <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-gray-100 text-gray-700'>
                <Clock size={19} strokeWidth={1.5} />
              </div>
              <div className='flex flex-col'>
                <span className='texts-body-medium-medium'>Details</span>
                <span className='texts-caption-large text-(--text-secondary)'>
                  Lease metadata
                </span>
              </div>
            </div>

            <div className='flex flex-col gap-3 pt-4'>
              <div className='flex flex-col gap-1'>
                <span className='texts-caption-large text-(--text-secondary)'>Created</span>
                <span className='texts-body-small text-(--text-primary)'>
                  <TimestampWithTooltip timestamp={lease.created_at} />
                </span>
              </div>

              {/* Created By - Staff only */}
              {userType === 'staff' && lease.created_by && (
                <div className='flex flex-col gap-1'>
                  <span className='texts-caption-large text-(--text-secondary)'>Created By</span>
                  <span className='texts-body-small text-(--text-primary)'>
                    {lease.created_by.name}
                  </span>
                </div>
              )}

              {lease.ended_at && (
                <div className='flex flex-col gap-1'>
                  <span className='texts-caption-large text-(--text-secondary)'>Ended</span>
                  <span className='texts-body-small text-(--text-primary)'>
                    <TimestampWithTooltip timestamp={lease.ended_at} />
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
