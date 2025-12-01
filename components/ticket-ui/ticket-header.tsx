'use client'

import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

type Props = {
  title: string
  referenceId: string
  status: string
  creatorName: string
  createdAt: string
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; className: string; label: string }
> = {
  Open: {
    icon: <AlertCircle size={14} />,
    className: 'bg-blue-100 text-blue-700',
    label: 'Open'
  },
  'In Progress': {
    icon: <Clock size={14} />,
    className: 'bg-amber-100 text-amber-700',
    label: 'In Progress'
  },
  'Pending Tenant': {
    icon: <Clock size={14} />,
    className: 'bg-amber-100 text-amber-700',
    label: 'Pending Tenant Confirmation'
  },
  Resolved: {
    icon: <CheckCircle2 size={14} />,
    className: 'bg-green-100 text-green-700',
    label: 'Resolved'
  },
  Closed: {
    icon: <XCircle size={14} />,
    className: 'bg-neutral-100 text-neutral-700',
    label: 'Closed'
  }
}

export default function TicketHeader({
  title,
  referenceId,
  status,
  creatorName,
  createdAt
}: Props) {
  const statusInfo = statusConfig[status] || statusConfig['Open']

  return (
    <>
      {/* Title */}
      <div className='mt-4 mb-2'>
        <h1 className='texts-heading-h2 text-(--text-primary)'>
          {title}{' '}
          <span className='text-(--text-secondary) font-normal'>
            #{referenceId}
          </span>
        </h1>
      </div>

      {/* Status Badge & Opener Info */}
      <div className='flex items-center gap-3 mb-8'>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full texts-body-small-medium ${statusInfo.className}`}
        >
          {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </div>
        <span className='texts-body-medium text-(--text-secondary)'>
          <span className='texts-body-medium-medium text-(--text-primary)'>
            {creatorName}
          </span>{' '}
          opened this ticket on {createdAt}
        </span>
      </div>
    </>
  )
}
