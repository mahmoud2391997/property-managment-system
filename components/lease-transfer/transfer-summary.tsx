'use client'

import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { ArrowRight, Building2, DoorOpen } from 'lucide-react'

type TransferInfo = {
  tenant: {
    id: string
    name: string
    profile_thumb: string | null
  }
  source: {
    propertyCode: string
    roomTitle?: string | null
    monthlyRent: number
  }
  destination?: {
    label: string
    subtitle?: string
    monthlyRent?: number
  } | null
}

type Props = {
  transferInfo: TransferInfo
  currentStep: number
}

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export default function TransferSummary({ transferInfo, currentStep }: Props) {
  const { tenant, source, destination } = transferInfo
  const isPropertyLease = !source.roomTitle
  const sourceLocation = source.roomTitle
    ? `${source.propertyCode} - ${source.roomTitle}`
    : source.propertyCode

  return (
    <div className='bg-neutral-50 border border-neutral-200 rounded-lg p-4'>
      <div className='flex flex-wrap items-center gap-4 md:gap-6'>
        {/* Tenant */}
        <div className='flex items-center gap-3'>
          <UserAvatar
            name={tenant.name}
            imgSrc={tenant.profile_thumb}
            size={32}
          />
          <div>
            <p className='texts-label-small text-(--text-secondary)'>Tenant</p>
            <p className='texts-body-small-medium text-(--text-primary)'>
              {tenant.name}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className='hidden md:block h-10 w-px bg-neutral-200' />

        {/* Source */}
        <div className='flex items-center gap-2'>
          {isPropertyLease ? (
            <Building2 className='w-4 h-4 text-neutral-400' />
          ) : (
            <DoorOpen className='w-4 h-4 text-neutral-400' />
          )}
          <div>
            <p className='texts-label-small text-(--text-secondary)'>From</p>
            <p className='texts-body-small-medium text-(--text-primary)'>
              {sourceLocation}
            </p>
            <p className='texts-label-small text-(--text-secondary)'>
              {formatCurrency(source.monthlyRent)}/month
            </p>
          </div>
        </div>

        {/* Arrow and Destination - only show in step 2 */}
        {currentStep === 2 && (
          <>
            <ArrowRight className='w-5 h-5 text-neutral-400' />

            {/* Destination */}
            {destination ? (
              <div className='flex items-center gap-2'>
                {isPropertyLease ? (
                  <Building2 className='w-4 h-4 text-blue-500' />
                ) : (
                  <DoorOpen className='w-4 h-4 text-blue-500' />
                )}
                <div>
                  <p className='texts-label-small text-blue-600'>To</p>
                  <p className='texts-body-small-medium text-blue-800'>
                    {destination.subtitle
                      ? `${destination.subtitle} - ${destination.label}`
                      : destination.label}
                  </p>
                  {destination.monthlyRent !== undefined && (
                    <p className='texts-label-small text-blue-600'>
                      {formatCurrency(destination.monthlyRent)}/month
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                {isPropertyLease ? (
                  <Building2 className='w-4 h-4 text-neutral-300' />
                ) : (
                  <DoorOpen className='w-4 h-4 text-neutral-300' />
                )}
                <div>
                  <p className='texts-label-small text-neutral-400'>To</p>
                  <p className='texts-body-small text-neutral-400'>
                    Select destination
                  </p>
                </div>
              </div>
            )}

            {/* Rent Change Indicator - only show if destination is selected and rent differs */}
            {destination?.monthlyRent !== undefined &&
              destination.monthlyRent !== source.monthlyRent && (
                <>
                  <div className='hidden md:block h-10 w-px bg-neutral-200' />
                  <div
                    className={`px-3 py-1.5 rounded-md ${
                      destination.monthlyRent > source.monthlyRent
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <p
                      className={`texts-body-small-medium ${
                        destination.monthlyRent > source.monthlyRent
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {destination.monthlyRent > source.monthlyRent ? '+' : ''}
                      {formatCurrency(
                        destination.monthlyRent - source.monthlyRent
                      )}
                    </p>
                    <p
                      className={`texts-label-small ${
                        destination.monthlyRent > source.monthlyRent
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {destination.monthlyRent > source.monthlyRent ? '+' : ''}
                      {(
                        ((destination.monthlyRent - source.monthlyRent) /
                          source.monthlyRent) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </>
              )}
          </>
        )}
      </div>
    </div>
  )
}
