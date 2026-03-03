'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  House,
  DoorOpen,
  Phone,
  Mail,
  IdCard,
  Calendar,
  Banknote,
  ExternalLink,
  User,
  Building,
  Upload,
  Loader2
} from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'
import FileAttachment from '@/components/costume-ui/file-attachment'
import { compressImage } from '@/lib/image-compression'
import { showFeedbackToast } from '@/components/costume-ui/feedback-toast'

// Types for tenant data
type LeaseData = {
  id: string
  reference_id: string
  status: 'Current' | 'Ended'
  monthly_rent: number
  payment_day: number
  start_date: string
  number_of_months: number | null
  ended_at: string | null
  property: {
    id: string
    code: string
    address: string
    city: string
    type: string
  }
  room: {
    id: string
    title: string
  } | null
  isRoomLease: boolean
}

type TenantData = {
  id: string
  type: 'Individual' | 'Company'
  profile_pic: string | null
  profile_thumb: string | null
  first_name?: string
  last_name?: string | null
  company_name?: string
  registration_no?: string
  contact_person_first_name?: string
  contact_person_last_name?: string | null
  phone_number: string
  email: string
  identity_type?: 'mykad' | 'passport'
  identity_number?: string
  identityDocumentUrl?: string | null
  accountStatus: 'Activated' | 'Pending'
  inviteSent: boolean
  createdAt: string
}

type OverviewData = {
  tenant: TenantData
  leases: LeaseData[]
  activeLeaseCount: number
  totalLeaseCount: number
}

// Current Rental Card Component
type RentalCardProps = {
  lease: LeaseData
}

const RentalCard = ({ lease }: RentalCardProps) => {
  const isRoomLease = lease.isRoomLease
  const displayTitle = isRoomLease
    ? `${lease.property.code} - ${lease.room?.title}`
    : lease.property.code
  const href = isRoomLease
    ? `/rooms/${lease.room?.id}/overview`
    : `/properties/${lease.property.id}/overview`

  // Calculate due date (next payment day)
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  let dueDate = new Date(currentYear, currentMonth, lease.payment_day)
  if (dueDate < today) {
    dueDate = new Date(currentYear, currentMonth + 1, lease.payment_day)
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'border border-(--border-light)'
      )}
    >
      {/* Header */}
      <div className='flex justify-between items-start'>
        <div className='flex gap-3'>
          <div
            className={cn(
              'flex items-center justify-center rounded-[10px]',
              'h-10 w-10',
              isRoomLease
                ? 'bg-purple-100 text-purple-600'
                : 'bg-blue-100 text-blue-600'
            )}
          >
            {isRoomLease ? (
              <DoorOpen size={20} strokeWidth={1.5} />
            ) : (
              <House size={20} strokeWidth={1.5} />
            )}
          </div>
          <div className='flex flex-col'>
            <span className='texts-body-large-medium'>{displayTitle}</span>
            <span className='texts-caption-large text-(--text-secondary)'>
              {lease.property.address}, {lease.property.city}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreVertical className='h-5! w-5! text-neutral-600' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={href} className='flex items-center gap-2'>
                <ExternalLink size={14} />
                View {isRoomLease ? 'Room' : 'Property'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(lease.reference_id)}
            >
              Copy Lease ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Details Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Monthly Rent
          </span>
          <span className='texts-body-medium-semibold'>
            {formatCurrency(lease.monthly_rent)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Payment Day
          </span>
          <span className='texts-body-medium-semibold'>
            {lease.payment_day}
            {lease.payment_day === 1
              ? 'st'
              : lease.payment_day === 2
              ? 'nd'
              : lease.payment_day === 3
              ? 'rd'
              : 'th'}{' '}
            of month
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Start Date
          </span>
          <span className='texts-body-medium-semibold'>
            {formatDate(lease.start_date)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Next Due
          </span>
          <span className='texts-body-medium-semibold'>
            {formatDate(dueDate.toISOString())}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              'bg-green-100 text-green-800'
            )}
          >
            Active
          </span>
          <span className='texts-caption-large text-(--text-secondary)'>
            {lease.reference_id}
          </span>
        </div>
        <Link
          href={href}
          className='flex items-center gap-1 texts-body-small-medium text-(--text-link) hover:underline'
        >
          View Details
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}

// Identity Document Section (inside TenantInfoCard)
const IdentityDocumentSection = ({
  tenant,
  onDocumentUploaded
}: {
  tenant: TenantData
  onDocumentUploaded?: (url: string) => void
}) => {
  const label = tenant.identity_type === 'mykad' ? 'MyKad' : 'Passport'
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showFeedbackToast({ title: 'File too large', description: 'Maximum file size is 2MB', type: 'error' })
      return
    }
    setSelectedFile(file)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      let uploadFile: File | Blob = selectedFile

      // Compress images to 40% quality
      if (selectedFile.type.startsWith('image/')) {
        const { mainBlob } = await compressImage(selectedFile, { mainQuality: 0.4 })
        uploadFile = mainBlob
      }

      const formData = new FormData()
      formData.append('file', uploadFile, selectedFile.name)

      const response = await fetch(`/api/tenants/${tenant.id}/upload-identity-doc`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onDocumentUploaded?.(data.url)
      setSelectedFile(null)
    } catch (error: any) {
      console.error('Upload error:', error)
      showFeedbackToast({ title: 'Upload failed', description: error.message || 'Please try again.', type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <span className='texts-caption-small text-(--text-secondary)'>
        {label} Document
      </span>
      {tenant.identityDocumentUrl ? (
        <FileAttachment
          url={tenant.identityDocumentUrl}
          fileName={`${label}_Document`}
        />
      ) : selectedFile ? (
        <div className='flex items-center justify-between gap-2 p-3 rounded-lg border border-(--border-default) bg-(--background-secondary)'>
          <div className='flex items-center gap-2 min-w-0'>
            <IdCard size={16} className='text-(--text-secondary) shrink-0' />
            <span className='texts-body-small-medium truncate'>{selectedFile.name}</span>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              onClick={handleConfirmUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className='animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant='outline'
          className='w-full border-dashed'
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} />
          Upload {label} Document
        </Button>
      )}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/png,image/webp,application/pdf'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />
      {!tenant.identityDocumentUrl && !selectedFile && (
        <span className='texts-caption-large text-(--text-secondary)'>
          Accepted: JPG, PNG, WebP, PDF (max 2MB)
        </span>
      )}
    </div>
  )
}

// Tenant Info Card Component
type TenantInfoCardProps = {
  tenant: TenantData
  onDocumentUploaded?: (url: string) => void
}

const TenantInfoCard = ({ tenant, onDocumentUploaded }: TenantInfoCardProps) => {
  const isIndividual = tenant.type === 'Individual'
  const displayName = isIndividual
    ? `${tenant.first_name}${tenant.last_name ? ` ${tenant.last_name}` : ''}`
    : tenant.company_name || ''

  return (
    <div
      className={cn(
        'flex flex-col gap-5 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      {/* Header */}
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex items-center justify-center rounded-[10px]',
            'h-10 w-10',
            'bg-neutral-100 text-neutral-600'
          )}
        >
          {isIndividual ? (
            <User size={20} strokeWidth={1.5} />
          ) : (
            <Building size={20} strokeWidth={1.5} />
          )}
        </div>
        <div className='flex flex-col'>
          <span className='texts-body-large-medium'>Tenant Information</span>
          <span className='texts-caption-large text-(--text-secondary)'>
            {isIndividual ? 'Individual' : 'Company'} Account
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Phone */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
          <Phone size={18} className='text-(--text-secondary) shrink-0' />
          <div className='flex flex-col min-w-0'>
            <span className='texts-caption-small text-(--text-secondary)'>
              Phone Number
            </span>
            <span className='texts-body-small-medium truncate'>
              {tenant.phone_number || '-'}
            </span>
          </div>
          {tenant.phone_number && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto shrink-0'
              onClick={() => {
                const whatsappUrl = buildWhatsAppLink(tenant.phone_number)
                window.open(whatsappUrl, '_blank')
              }}
            >
              WhatsApp
            </Button>
          )}
        </div>

        {/* Email */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
          <Mail size={18} className='text-(--text-secondary) shrink-0' />
          <div className='flex flex-col min-w-0 flex-1'>
            <span className='texts-caption-small text-(--text-secondary)'>
              Email Address
            </span>
            <span className='texts-body-small-medium truncate'>
              {tenant.email || '-'}
            </span>
          </div>
          {tenant.email && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto shrink-0'
              onClick={() => {
                const emailUrl = buildEmailLink(tenant.email)
                window.location.href = emailUrl
              }}
            >
              Email
            </Button>
          )}
        </div>

        {/* Identity (for Individual) */}
        {isIndividual && (
          <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
            <IdCard size={18} className='text-(--text-secondary) shrink-0' />
            <div className='flex flex-col min-w-0'>
              <span className='texts-caption-small text-(--text-secondary)'>
                {tenant.identity_type === 'mykad' ? 'MyKad' : 'Passport'} Number
              </span>
              <span className='texts-body-small-medium truncate'>
                {tenant.identity_number || '-'}
              </span>
            </div>
          </div>
        )}

        {/* Registration No (for Company) */}
        {!isIndividual && (
          <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
            <IdCard size={18} className='text-(--text-secondary) shrink-0' />
            <div className='flex flex-col min-w-0'>
              <span className='texts-caption-small text-(--text-secondary)'>
                Registration Number
              </span>
              <span className='texts-body-small-medium truncate'>
                {tenant.registration_no || '-'}
              </span>
            </div>
          </div>
        )}

        {/* Contact Person (for Company) */}
        {!isIndividual && (
          <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
            <User size={18} className='text-(--text-secondary) shrink-0' />
            <div className='flex flex-col min-w-0'>
              <span className='texts-caption-small text-(--text-secondary)'>
                Contact Person
              </span>
              <span className='texts-body-small-medium truncate'>
                {tenant.contact_person_first_name}
                {tenant.contact_person_last_name
                  ? ` ${tenant.contact_person_last_name}`
                  : ''}
              </span>
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
          <Calendar size={18} className='text-(--text-secondary) shrink-0' />
          <div className='flex flex-col min-w-0'>
            <span className='texts-caption-small text-(--text-secondary)'>
              Member Since
            </span>
            <span className='texts-body-small-medium truncate'>
              {formatDate(tenant.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Identity Document */}
      {isIndividual && (
        <IdentityDocumentSection
          tenant={tenant}
          onDocumentUploaded={onDocumentUploaded}
        />
      )}
    </div>
  )
}

// Empty state for no rentals
const EmptyRentalsCard = () => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'p-8 rounded-[12px]',
        'bg-(--background-primary)',
        'border-2 border-dashed border-neutral-200'
      )}
    >
      <div className='flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100'>
        <House className='w-6 h-6 text-neutral-400' />
      </div>
      <div className='text-center'>
        <h4 className='texts-body-medium-semibold text-(--text-primary)'>
          No Active Rentals
        </h4>
        <p className='texts-body-small text-(--text-secondary) mt-1'>
          This tenant doesn&apos;t have any active lease agreements.
        </p>
      </div>
    </div>
  )
}

// Loading skeleton
const LoadingSkeleton = () => {
  return (
    <div className='flex flex-col gap-5'>
      {/* Tenant Info Skeleton */}
      <div className='p-5 rounded-[12px] bg-(--background-primary)'>
        <div className='flex items-center gap-3 mb-5'>
          <Skeleton className='h-10 w-10 rounded-[10px] bg-neutral-200' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-5 w-40 bg-neutral-200' />
            <Skeleton className='h-3 w-24 bg-neutral-200' />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-16 rounded-lg bg-neutral-200' />
          ))}
        </div>
      </div>

      {/* Section Header Skeleton */}
      <Skeleton className='h-6 w-40 bg-neutral-200' />

      {/* Rental Cards Skeleton */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className='p-5 rounded-[12px] bg-(--background-primary)'>
          <div className='flex items-start gap-3 mb-4'>
            <Skeleton className='h-10 w-10 rounded-[10px] bg-neutral-200' />
            <div className='flex flex-col gap-1'>
              <Skeleton className='h-5 w-32 bg-neutral-200' />
              <Skeleton className='h-3 w-48 bg-neutral-200' />
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className='h-12 bg-neutral-200' />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

type Props = {
  tenantId: string
}

export default function OverviewContent({ tenantId }: Props) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!data) {
    return (
      <div className='flex items-center justify-center p-12'>
        <p className='text-(--text-secondary)'>Failed to load tenant data.</p>
      </div>
    )
  }

  const activeLeases = data.leases.filter(l => l.status === 'Current')

  return (
    <div className='flex flex-col gap-5'>
      {/* Tenant Information */}
      <TenantInfoCard
        tenant={data.tenant}
        onDocumentUploaded={(url) => {
          setData(prev => prev ? {
            ...prev,
            tenant: { ...prev.tenant, identityDocumentUrl: url }
          } : prev)
        }}
      />

      {/* Current Rentals Section */}
      <div className='flex items-center justify-between'>
        <h2 className='texts-body-large-medium'>
          Current Rentals ({activeLeases.length})
        </h2>
      </div>

      {activeLeases.length > 0 ? (
        <div className='flex flex-col gap-4'>
          {activeLeases.map(lease => (
            <RentalCard key={lease.id} lease={lease} />
          ))}
        </div>
      ) : (
        <EmptyRentalsCard />
      )}
    </div>
  )
}
