'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Phone,
  Mail,
  Calendar,
  Banknote,
  ExternalLink,
  User,
  FileText
} from 'lucide-react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatTime'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { buildWhatsAppLink, buildEmailLink } from '@/utils/functions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

type PropertyData = {
  id: string
  code: string
  street_address: string
  city: string
  type: string
  status: string
}

type ContractData = {
  id: string
  reference_id: string
  status: string
  start_date: string
  monthly_rent: number
  number_of_months: number | null
  ended_at: string | null
  rental_period: string
  frequency: number
  property: {
    id: string
    code: string
    street_address: string
    city: string
  }
}

type OwnerData = {
  id: string
  first_name: string
  last_name: string | null
  phone_number: string
  email: string | null
  profile_pic: string | null
  profile_thumb: string | null
  createdAt: string
}

type OverviewData = {
  owner: OwnerData
  properties: PropertyData[]
  contracts: ContractData[]
  propertyCount: number
  currentContractCount: number
  totalContractCount: number
}

// Property Card Component
const PropertyCard = ({ property }: { property: PropertyData }) => {
  const statusKey = property.status.toLowerCase().replace(/\s+/g, '_')

  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'border border-(--border-light)'
      )}
    >
      <div className='flex justify-between items-start'>
        <div className='flex gap-3'>
          <div
            className={cn(
              'flex items-center justify-center rounded-[10px]',
              'h-10 w-10',
              'bg-blue-100 text-blue-600'
            )}
          >
            <House size={20} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <span className='texts-body-large-medium'>{property.code}</span>
            <span className='texts-caption-large text-(--text-secondary)'>
              {property.street_address}, {property.city}
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
              <Link href={`/properties/${property.id}/overview`} className='flex items-center gap-2'>
                <ExternalLink size={14} />
                View Property
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
        <div className='flex items-center gap-2'>
          <span className='texts-caption-large text-(--text-secondary) capitalize'>
            {property.type.toLowerCase()}
          </span>
        </div>
        <span
          data-status={statusKey}
          className={cn(
            'status-styles',
            statusKey === 'ready' && 'bg-green-100 text-green-800',
            statusKey === 'occupied' && 'bg-blue-100 text-blue-800',
            statusKey === 'under_maintenance' && 'bg-yellow-100 text-yellow-800'
          )}
        >
          {property.status}
        </span>
      </div>
    </div>
  )
}

// Contract Card Component
const ContractCard = ({ contract }: { contract: ContractData }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)',
        'border border-(--border-light)'
      )}
    >
      <div className='flex justify-between items-start'>
        <div className='flex gap-3'>
          <div
            className={cn(
              'flex items-center justify-center rounded-[10px]',
              'h-10 w-10',
              'bg-emerald-100 text-emerald-600'
            )}
          >
            <FileText size={20} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <span className='texts-body-large-medium'>
              {contract.property.code}
            </span>
            <span className='texts-caption-large text-(--text-secondary)'>
              {contract.property.street_address}, {contract.property.city}
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
              <Link href={`/properties/${contract.property.id}/overview`} className='flex items-center gap-2'>
                <ExternalLink size={14} />
                View Property
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(contract.reference_id)}
            >
              Copy Contract ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Monthly Rent
          </span>
          <span className='texts-body-medium-semibold'>
            {formatCurrency(contract.monthly_rent)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Period
          </span>
          <span className='texts-body-medium-semibold'>
            {contract.rental_period}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            Start Date
          </span>
          <span className='texts-body-medium-semibold'>
            {formatDate(contract.start_date)}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='texts-caption-large text-(--text-secondary)'>
            {contract.ended_at ? 'Ended' : 'Duration'}
          </span>
          <span className='texts-body-medium-semibold'>
            {contract.ended_at
              ? formatDate(contract.ended_at)
              : contract.number_of_months
              ? `${contract.number_of_months} months`
              : 'Ongoing'}
          </span>
        </div>
      </div>

      <div className='flex items-center justify-between pt-3 border-t border-(--border-light)'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              contract.status === 'Current'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            )}
          >
            {contract.status === 'Current' ? 'Active' : contract.status}
          </span>
          <span className='texts-caption-large text-(--text-secondary)'>
            {contract.reference_id}
          </span>
        </div>
        <Link
          href={`/properties/${contract.property.id}/overview`}
          className='flex items-center gap-1 texts-body-small-medium text-(--text-link) hover:underline'
        >
          View Property
          <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  )
}

// Owner Info Card Component
const OwnerInfoCard = ({ owner }: { owner: OwnerData }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 w-full',
        'p-5 rounded-[12px]',
        'bg-(--background-primary)'
      )}
    >
      <div className='flex items-center gap-3'>
        <div
          className={cn(
            'flex items-center justify-center rounded-[10px]',
            'h-10 w-10',
            'bg-neutral-100 text-neutral-600'
          )}
        >
          <User size={20} strokeWidth={1.5} />
        </div>
        <div className='flex flex-col'>
          <span className='texts-body-large-medium'>Owner Information</span>
          <span className='texts-caption-large text-(--text-secondary)'>
            Personal Details
          </span>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Phone */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
          <Phone size={18} className='text-(--text-secondary) shrink-0' />
          <div className='flex flex-col min-w-0'>
            <span className='texts-caption-small text-(--text-secondary)'>
              Phone Number
            </span>
            <span className='texts-body-small-medium truncate'>
              {owner.phone_number || '-'}
            </span>
          </div>
          {owner.phone_number && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto shrink-0'
              onClick={() => {
                const whatsappUrl = buildWhatsAppLink(owner.phone_number)
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
              {owner.email || '-'}
            </span>
          </div>
          {owner.email && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto shrink-0'
              onClick={() => {
                const emailUrl = buildEmailLink(owner.email!)
                window.location.href = emailUrl
              }}
            >
              Email
            </Button>
          )}
        </div>

        {/* Member Since */}
        <div className='flex items-center gap-3 p-3 rounded-lg bg-(--background-secondary)'>
          <Calendar size={18} className='text-(--text-secondary) shrink-0' />
          <div className='flex flex-col min-w-0'>
            <span className='texts-caption-small text-(--text-secondary)'>
              Member Since
            </span>
            <span className='texts-body-small-medium truncate'>
              {formatDate(owner.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Empty states
const EmptyPropertiesCard = () => (
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
        No Assigned Properties
      </h4>
      <p className='texts-body-small text-(--text-secondary) mt-1'>
        This owner doesn&apos;t have any properties assigned.
      </p>
    </div>
  </div>
)

const EmptyContractsCard = () => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-3',
      'p-8 rounded-[12px]',
      'bg-(--background-primary)',
      'border-2 border-dashed border-neutral-200'
    )}
  >
    <div className='flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100'>
      <FileText className='w-6 h-6 text-neutral-400' />
    </div>
    <div className='text-center'>
      <h4 className='texts-body-medium-semibold text-(--text-primary)'>
        No Active Contracts
      </h4>
      <p className='texts-body-small text-(--text-secondary) mt-1'>
        This owner doesn&apos;t have any active contracts.
      </p>
    </div>
  </div>
)

// Loading skeleton
const LoadingSkeleton = () => (
  <div className='flex flex-col gap-5'>
    <div className='p-5 rounded-[12px] bg-(--background-primary)'>
      <div className='flex items-center gap-3 mb-5'>
        <Skeleton className='h-10 w-10 rounded-[10px] bg-neutral-200' />
        <div className='flex flex-col gap-1'>
          <Skeleton className='h-5 w-40 bg-neutral-200' />
          <Skeleton className='h-3 w-24 bg-neutral-200' />
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className='h-16 rounded-lg bg-neutral-200' />
        ))}
      </div>
    </div>

    <Skeleton className='h-6 w-48 bg-neutral-200' />

    {[...Array(2)].map((_, i) => (
      <div key={i} className='p-5 rounded-[12px] bg-(--background-primary)'>
        <div className='flex items-start gap-3 mb-4'>
          <Skeleton className='h-10 w-10 rounded-[10px] bg-neutral-200' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-5 w-32 bg-neutral-200' />
            <Skeleton className='h-3 w-48 bg-neutral-200' />
          </div>
        </div>
      </div>
    ))}
  </div>
)

type Props = {
  ownerId: string
}

export default function OverviewContent({ ownerId }: Props) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/owners/${ownerId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching owner data:', error)
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!data) {
    return (
      <div className='flex items-center justify-center p-12'>
        <p className='text-(--text-secondary)'>Failed to load owner data.</p>
      </div>
    )
  }

  const currentContracts = data.contracts.filter((c: any) => c.status === 'Current')

  return (
    <div className='flex flex-col gap-5'>
      {/* Owner Information */}
      <OwnerInfoCard owner={data.owner} />

      {/* Assigned Properties Section */}
      <PermissionGate
        permission="properties.access"
        fallback={<NoAccessCard label="Assigned Properties" />}
      >
        <div className='flex items-center justify-between'>
          <h2 className='texts-body-large-medium'>
            Assigned Properties ({data.properties.length})
          </h2>
        </div>

        {data.properties.length > 0 ? (
          <div className='flex flex-col gap-4'>
            {data.properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <EmptyPropertiesCard />
        )}
      </PermissionGate>

      {/* Current Contracts Section */}
      <PermissionGate
        permission="contracts.access"
        fallback={<NoAccessCard label="Current Contracts" />}
      >
        <div className='flex items-center justify-between'>
          <h2 className='texts-body-large-medium'>
            Current Contracts ({currentContracts.length})
          </h2>
        </div>

        {currentContracts.length > 0 ? (
          <div className='flex flex-col gap-4'>
            {currentContracts.map(contract => (
              <ContractCard key={contract.id} contract={contract} />
            ))}
          </div>
        ) : (
          <EmptyContractsCard />
        )}
      </PermissionGate>
    </div>
  )
}
