'use client'

import { UserAvatar } from '@/components/costume-ui/name-avatar'
import HoverTooltip from '@/components/costume-ui/tooltip'
import FileAttachment from '@/components/costume-ui/file-attachment'
import {
  Clock,
  Info,
  GitPullRequestArrow,
  CheckCircle2,
  XCircle,
  Zap,
  UserMinus,
  Ban,
  Tag
} from 'lucide-react'

// Types
export type TicketAttachment = {
  name: string
  url: string
}

export type OpenedEventData = {
  creatorName: string
  creatorAvatar?: string
  date: string
  description: string
  attachment?: TicketAttachment
}

export type AssignmentSentEventData = {
  assignerName: string
  visibleAssignerAvatar?: string
  assignedName: string
  date: string
}

export type AssignmentRejectedEventData = {
  performerName: string
  performerAvatar?: string
  fromName: string
  date: string
}

export type AssignmentAcceptedEventData = {
  performerName: string
  performerAvatar?: string
  date: string
}

export type AssignmentUnassignedEventData = {
  performerName: string
  performerAvatar?: string
  unassignedByName?: string
  date: string
}

export type AssignmentCancelledEventData = {
  assignerName: string
  assignedName: string
  cancelledByName?: string
  date: string
}

export type AssignmentSelfAssignedEventData = {
  performerName: string
  performerAvatar?: string
  date: string
}

export type StatusChangedSystemEventData = {
  newStatus: string
  date: string
}

export type StatusChangedByUserEventData = {
  performerName: string
  performerAvatar?: string
  newStatus: string
  note?: string
  date: string
}

export type CommentEventData = {
  performerName: string
  performerAvatar?: string
  date: string
  message: string
  attachment?: TicketAttachment
}

export type TypeSetEventData = {
  performerName: string
  performerAvatar?: string
  typeName: string
  date: string
}

export type TypeChangedEventData = {
  performerName: string
  performerAvatar?: string
  typeName: string
  date: string
}

// Timeline Event Components
export function OpenedEvent ({
  creatorName,
  creatorAvatar,
  date,
  description,
  attachment
}: OpenedEventData) {
  return (
    <div className='flex gap-2 sm:gap-4'>
      {/* Desktop: user avatar */}
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar name={creatorName} imgSrc={creatorAvatar} size={40} />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-amber-50/80 border-b border-amber-200/60 px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {creatorName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            opened on {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) mb-3 sm:mb-4 leading-relaxed'>
            {description}
          </p>
          {attachment && (
            <FileAttachment url={attachment.url} fileName={attachment.name} />
          )}
        </div>
      </div>
    </div>
  )
}

export function AssignmentSentEvent ({
  assignerName,
  assignedName,
  date
}: AssignmentSentEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <GitPullRequestArrow size={12} className='text-neutral-500 sm:hidden' />
          <GitPullRequestArrow size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={assignerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {assignerName}
        </span>{' '}
        sent assignment request to{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {assignedName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentRejectedEvent ({
  performerName,
  fromName,
  date
}: AssignmentRejectedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <XCircle size={12} className='text-red-500 sm:hidden' />
          <XCircle size={13} className='text-red-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        rejected assignment request from{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {fromName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentAcceptedEvent ({
  performerName,
  date
}: AssignmentAcceptedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CheckCircle2 size={12} className='text-green-500 sm:hidden' />
          <CheckCircle2 size={13} className='text-green-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        accepted assignment request on {date}
      </p>
    </div>
  )
}

export function AssignmentUnassignedEvent ({
  performerName,
  unassignedByName,
  date
}: AssignmentUnassignedEventData) {
  // Determine if self-unassigned or unassigned by someone else
  const isSelfUnassign = !unassignedByName || unassignedByName === performerName

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <UserMinus size={12} className='text-orange-500 sm:hidden' />
          <UserMinus size={13} className='text-orange-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar
        name={unassignedByName || performerName}
        size={22}
        className='text-xs shrink-0 hidden sm:flex'
      />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        {isSelfUnassign ? (
          <>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {performerName}
            </span>{' '}
            unassigned themselves from this ticket on {date}
          </>
        ) : (
          <>
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
              {unassignedByName}
            </span>{' '}
            unassigned{' '}
            <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
              {performerName}
            </span>{' '}
            from this ticket on {date}
          </>
        )}
      </p>
    </div>
  )
}

export function AssignmentCancelledEvent ({
  assignerName,
  assignedName,
  cancelledByName,
  date
}: AssignmentCancelledEventData) {
  // Determine who cancelled - the assigner or someone else
  const canceller = cancelledByName || assignerName
  const isCancelledByAssigner =
    !cancelledByName || cancelledByName === assignerName

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 border-2 border-white shadow-sm flex items-center justify-center'>
          <Ban size={12} className='text-neutral-500 sm:hidden' />
          <Ban size={13} className='text-neutral-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={canceller} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {canceller}
        </span>{' '}
        cancelled{' '}
        {!isCancelledByAssigner && (
          <>
            <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
              {assignerName}
            </span>
            's{' '}
          </>
        )}
        assignment request to{' '}
        <span className='text-blue-600 hover:text-blue-700 underline decoration-blue-300 cursor-pointer transition-colors'>
          {assignedName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function AssignmentSelfAssignedEvent ({
  performerName,
  date
}: AssignmentSelfAssignedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <CheckCircle2 size={12} className='text-green-500 sm:hidden' />
          <CheckCircle2 size={13} className='text-green-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        assigned themselves to this ticket on {date}
      </p>
    </div>
  )
}

export function StatusChangedSystemEvent ({
  newStatus,
  date
}: StatusChangedSystemEventData) {
  const isClosed = newStatus === 'Closed'

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        {isClosed ? (
          <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-200 border-2 border-white shadow-sm flex items-center justify-center'>
            <XCircle size={12} className='text-neutral-600 sm:hidden' />
            <XCircle size={13} className='text-neutral-600 hidden sm:block' />
          </div>
        ) : (
          <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center'>
            <Zap size={12} className='text-blue-500 sm:hidden' />
            <Zap size={13} className='text-blue-500 hidden sm:block' />
          </div>
        )}
      </div>
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        {isClosed ? (
          <>
            Ticket was closed on {date}
            <HoverTooltip
              content='This ticket was automatically closed because the lease ended'
              variant='description'
              clickOnly
            >
              <Info
                size={14}
                className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors ml-0.5'
              />
            </HoverTooltip>
          </>
        ) : (
          <>
            Status updated to{' '}
            <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary) bg-neutral-100 px-1.5 sm:px-2 py-0.5 rounded'>
              {newStatus}
            </span>{' '}
            on {date}
            <HoverTooltip
              content='Status was automatically updated by the system'
              variant='description'
              clickOnly
            >
              <Info
                size={14}
                className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors ml-0.5'
              />
            </HoverTooltip>
          </>
        )}
      </div>
    </div>
  )
}

export function StatusChangedByUserEvent ({
  performerName,
  newStatus,
  note,
  date
}: StatusChangedByUserEventData) {
  // Determine icon and tooltip based on status
  const isClosed = newStatus.toLowerCase() === 'closed'
  const isPendingConfirmation =
    newStatus.toLowerCase() === 'pending tenant confirmation'

  const getStatusStyle = () => {
    if (isClosed) {
      return {
        bgColor: 'bg-neutral-200',
        iconColor: 'text-neutral-600',
        Icon: XCircle,
        tooltip: 'This ticket was closed by staff'
      }
    }
    if (isPendingConfirmation) {
      return {
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
        Icon: Clock,
        tooltip: 'Awaiting tenant confirmation to close the ticket'
      }
    }
    return {
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      Icon: Info,
      tooltip: 'Status was updated by user'
    }
  }

  const { bgColor, iconColor, Icon, tooltip } = getStatusStyle()

  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${bgColor} border-2 border-white shadow-sm flex items-center justify-center`}
        >
          <Icon size={12} className={`${iconColor} sm:hidden`} />
          <Icon size={13} className={`${iconColor} hidden sm:block`} />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <div className='texts-label-small sm:texts-body-small text-(--text-secondary) flex items-center gap-1 sm:gap-1.5 flex-wrap flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        {isClosed ? 'closed this ticket' : 'updated status to'}{' '}
        {!isClosed && (
          <span className='texts-label-small sm:texts-body-small-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            {newStatus}
          </span>
        )}{' '}
        on {date}
        {note && (
          <span className='text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
            ({note})
          </span>
        )}
        <HoverTooltip content={tooltip} variant='description' clickOnly>
          <Info
            size={13}
            className='text-neutral-400 hover:text-neutral-600 cursor-pointer transition-colors'
          />
        </HoverTooltip>
      </div>
    </div>
  )
}

export function CommentEvent ({
  performerName,
  performerAvatar,
  date,
  message,
  attachment
}: CommentEventData) {
  return (
    <div className='flex gap-2 sm:gap-4'>
      {/* Desktop: user avatar */}
      <div className='relative z-10 shrink-0 hidden sm:block'>
        <UserAvatar
          name={performerName}
          imgSrc={performerAvatar}
          size={40}
          className='text-xs'
        />
      </div>
      <div className='flex-1 min-w-0 border border-(--border-default) rounded-lg overflow-hidden bg-white'>
        <div className='bg-neutral-50 border-b border-(--border-default) px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-1 sm:gap-2'>
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-(--text-primary)'>
            {performerName}
          </span>
          <span className='texts-label-small sm:texts-body-small text-(--text-secondary)'>
            {date}
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4'>
          <p className='texts-body-small sm:texts-body-medium text-(--text-primary) whitespace-pre-line leading-relaxed'>
            {message}
          </p>
          {attachment && (
            <FileAttachment
              url={attachment.url}
              fileName={attachment.name}
              className='mt-3 sm:mt-4'
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function TypeSetEvent ({
  performerName,
  typeName,
  date
}: TypeSetEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <Tag size={12} className='text-purple-500 sm:hidden' />
          <Tag size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        set type to{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
          {typeName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

export function TypeChangedEvent ({
  performerName,
  typeName,
  date
}: TypeChangedEventData) {
  return (
    <div className='flex items-start sm:items-center gap-2 sm:gap-4 py-2 sm:py-3'>
      <div className='relative z-10 w-8 sm:w-10 flex justify-center shrink-0'>
        <div className='w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-50 border-2 border-white shadow-sm flex items-center justify-center'>
          <Tag size={12} className='text-purple-500 sm:hidden' />
          <Tag size={13} className='text-purple-500 hidden sm:block' />
        </div>
      </div>
      <UserAvatar name={performerName} size={22} className='text-xs shrink-0 hidden sm:flex' />
      <p className='texts-label-small sm:texts-body-small text-(--text-secondary) flex-1 min-w-0'>
        <span className='texts-label-small sm:texts-body-small-medium text-(--text-primary)'>
          {performerName}
        </span>{' '}
        changed type to{' '}
        <span className='texts-label-small sm:texts-body-small-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] sm:text-[12px]'>
          {typeName}
        </span>{' '}
        on {date}
      </p>
    </div>
  )
}

// Service Notice for tenants
export function ServiceNotice ({ ticketType }: { ticketType?: string }) {
  const isAirconTopUp = ticketType === 'Aircon Top-Up'

  return (
    <div className='flex gap-2 sm:gap-4'>
      {/* Desktop: info icon placeholder for alignment */}
      <div className='relative z-10 w-10 shrink-0 hidden sm:flex justify-center'>
        <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
          <Info size={20} className='text-blue-600' />
        </div>
      </div>
      <div className='flex-1 min-w-0 border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50'>
        <div className='bg-blue-100/60 border-b border-blue-200 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2'>
          <Info size={16} className='text-blue-600 sm:hidden' />
          <span className='texts-body-small-medium sm:texts-body-medium-medium text-blue-800'>
            Important Notice
          </span>
        </div>
        <div className='px-3 sm:px-4 py-3 sm:py-4 space-y-4'>
          {isAirconTopUp ? (
            <>
              {/* English - Air con top up */}
              <div>
                <p className='texts-body-small sm:texts-body-medium text-blue-900 leading-relaxed'>
                  Thank you for your request.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Please choose your preferred top-up package and reply in this chat:
                </p>
                <ul className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2 list-disc list-inside pl-1'>
                  <li>RM20</li>
                  <li>RM50</li>
                  <li>RM100</li>
                </ul>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  The payment link will appear on your payment page within 12 hours. Kindly complete the payment accordingly. Once payment is received, the top-up will be processed within 1 working day.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  For record purposes, please ensure all communications are made through this platform only.
                </p>
              </div>

              {/* Divider */}
              <div className='border-t border-blue-200' />

              {/* Bahasa Melayu - Air con top up */}
              <div>
                <p className='texts-body-small sm:texts-body-medium text-blue-900 leading-relaxed'>
                  Terima kasih atas permintaan anda.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Sila pilih pakej tambah nilai dan balas di ruangan ini:
                </p>
                <ul className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2 list-disc list-inside pl-1'>
                  <li>RM20</li>
                  <li>RM50</li>
                  <li>RM100</li>
                </ul>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Pautan pembayaran akan dipaparkan di halaman bayaran anda dalam tempoh 12 jam. Sila buat bayaran. Setelah bayaran diterima, proses tambah nilai akan diselesaikan dalam 1 hari bekerja.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Untuk tujuan rekod, mohon semua komunikasi dibuat melalui platform ini sahaja.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* English - Default */}
              <div>
                <p className='texts-body-small sm:texts-body-medium text-blue-900 leading-relaxed'>
                  Thank you for reaching out to us.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Please note that our services are not available 24 hours. All maintenance, complaints, and billing or payment matters will be handled within 2–5 working days, and updates will be provided through this platform.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Kindly submit all requests via this system only. Thank you for your understanding.
                </p>
              </div>

              {/* Divider */}
              <div className='border-t border-blue-200' />

              {/* Bahasa Melayu - Default */}
              <div>
                <p className='texts-body-small sm:texts-body-medium text-blue-900 leading-relaxed'>
                  Terima kasih kerana menghubungi kami.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Untuk makluman, perkhidmatan kami tidak beroperasi 24 jam. Semua aduan, penyelenggaraan, serta isu bil atau bayaran akan diproses dalam tempoh 2–5 hari bekerja, dan makluman akan diberikan melalui sistem ini.
                </p>
                <p className='texts-body-small sm:texts-body-medium text-blue-800 leading-relaxed mt-2'>
                  Mohon semua urusan dibuat melalui sistem ini sahaja. Terima kasih atas kerjasama anda.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Timeline wrapper that adds the connecting line
export function TimelineEventWrapper ({
  children,
  isLast,
  hasLeftElement = true
}: {
  children: React.ReactNode
  isLast: boolean
  hasLeftElement?: boolean
}) {
  return (
    <div className='relative'>
      {/* Vertical line connecting to next event - hidden on mobile for card events without left element */}
      {!isLast && (
        <div className={`absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-0.5 bg-neutral-200 ${hasLeftElement ? '' : 'hidden sm:block'}`} />
      )}
      {children}
    </div>
  )
}
