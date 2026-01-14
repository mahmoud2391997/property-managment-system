'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PaymentFormCore from '@/components/payment-form-core'
import ActionPageSkeleton from '@/components/loading-ui/action-page-skeleton'

type ActiveLeaseData = {
  hasActiveLease: boolean
  leaseReferenceId: string
  tenantId: string
  tenantName: string
  propertyCode: string
}

const PropertyAddPayment = () => {
  const { id: propertyId } = useParams<{ id: string }>()
  const router = useRouter()

  const [leaseData, setLeaseData] = useState<ActiveLeaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch active lease for this property
  useEffect(() => {
    const fetchActiveLease = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/active-lease`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch lease')
        }
        const data = await response.json()

        if (!data.hasActiveLease) {
          setError('No active lease found for this property. Please create a lease first.')
        } else {
          setLeaseData(data)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveLease()
  }, [propertyId])

  if (loading) {
    return <ActionPageSkeleton />
  }

  if (error || !leaseData) {
    return (
      <div className='flex flex-col gap-5'>
        <div className='p-6 rounded-lg bg-red-50 border border-red-200'>
          <p className='text-red-800'>{error || 'Unable to load lease information'}</p>
          <button
            onClick={() => router.push(`/properties/${propertyId}/overview`)}
            className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
          >
            Back to Property
          </button>
        </div>
      </div>
    )
  }

  return (
    <PaymentFormCore
      leaseReferenceId={leaseData.leaseReferenceId}
      tenantId={leaseData.tenantId}
      tenantName={leaseData.tenantName}
      locationLabel={leaseData.propertyCode}
      isRoomRented={false}
      successRedirectUrl={`/properties/${propertyId}/overview`}
      breadcrumbItems={[
        { label: 'Properties', href: '/properties' },
        { label: leaseData.propertyCode, href: `/properties/${propertyId}/overview` },
        { label: 'Add Payment' }
      ]}
      pageTitle='Add Payment'
      pageSubtitle={`Create a new payment for ${leaseData.propertyCode}`}
    />
  )
}

export default PropertyAddPayment
