'use client'
import { useState, useEffect, use } from 'react'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import AddPageHead from '@/components/costume-ui/add-page-head'
import { useRouter } from 'next/navigation'
import type { ChargeData } from '@/components/costume-ui/charges-section'
import PaymentSection from '@/components/costume-ui/payment-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import FeaturesSection, { RoomFeatures } from '@/components/costume-ui/features-section'
import type { LateCharge } from '@/components/costume-ui/payment-section'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import ActionPageSkeleton from '@/components/loading-ui/action-page-skeleton'

type PageProps = {
  params: Promise<{ id: string }>
}

type RoomData = {
  id: string
  title: string
  status: string
  wifi: boolean
  cleaning_service: boolean
  toilet: boolean
  balcony: boolean
  ac: boolean
  female: boolean
  property: {
    id: string
    code: string
    project: {
      id: string
      title: string
    } | null
  }
}

type LeaseConfig = {
  default_monthly_rent: number | null
  default_payment_day: number | null
  is_expiry_reminder: boolean
  expiry_days_before_reminder: number | null
  is_rent_reminder: boolean
  rent_reminder_days_before: number | null
  is_overdue_rent_reminder: boolean
  overdue_days_after_reminder: number | null
}

type InitialCharge = {
  id: string
  type: string
  amount: number
  is_taxed: boolean
  is_refundable: boolean
}

type LatePaymentCharge = {
  id: string
  days_after_due: number
  amount: number
}

const EditRoom = ({ params }: PageProps) => {
  const router = useRouter()
  const { id: roomId } = use(params)

  const [loading, setLoading] = useState(true)

  // Room data from API
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [leaseConfig, setLeaseConfig] = useState<LeaseConfig | null>(null)
  const [existingInitialCharges, setExistingInitialCharges] = useState<InitialCharge[]>([])
  const [existingLateCharges, setExistingLateCharges] = useState<LatePaymentCharge[]>([])

  // Room Details State (editable)
  const [title, setTitle] = useState('')
  const [features, setFeatures] = useState<RoomFeatures>({
    wifi: false,
    cleaning_service: false,
    toilet: false,
    balcony: false,
    ac: false,
    female: false
  })

  // Payment Details State (Optional) - managed by PaymentSection component
  const [initialCharges, setInitialCharges] = useState<ChargeData[]>([])
  const [lateCharges, setLateCharges] = useState<LateCharge[]>([])
  const [monthlyRent, setMonthlyRent] = useState('')
  const [paymentDay, setPaymentDay] = useState<number>(1)

  // Reminder Details State (Optional) - managed by ReminderSection component
  const [leaseExpiryEnabled, setLeaseExpiryEnabled] = useState(false)
  const [leaseExpiryDays, setLeaseExpiryDays] = useState('')
  const [rentReminderEnabled, setRentReminderEnabled] = useState(false)
  const [rentReminderDays, setRentReminderDays] = useState('')
  const [overdueReminderEnabled, setOverdueReminderEnabled] = useState(false)
  const [overdueReminderDays, setOverdueReminderDays] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch room data for editing
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/edit`)
        if (!response.ok) {
          throw new Error('Failed to fetch room')
        }
        const data = await response.json()

        setRoomData(data.room)
        setLeaseConfig(data.leaseConfig)
        setExistingInitialCharges(data.initialCharges)
        setExistingLateCharges(data.latePaymentCharges)

        // Set form values from fetched data
        setTitle(data.room.title)
        setFeatures({
          wifi: data.room.wifi || false,
          cleaning_service: data.room.cleaning_service || false,
          toilet: data.room.toilet || false,
          balcony: data.room.balcony || false,
          ac: data.room.ac || false,
          female: data.room.female || false
        })

        // Set lease config values
        if (data.leaseConfig) {
          setMonthlyRent(data.leaseConfig.default_monthly_rent?.toString() || '')
          setPaymentDay(data.leaseConfig.default_payment_day || 1)
          setLeaseExpiryEnabled(data.leaseConfig.is_expiry_reminder || false)
          setLeaseExpiryDays(data.leaseConfig.expiry_days_before_reminder?.toString() || '')
          setRentReminderEnabled(data.leaseConfig.is_rent_reminder || false)
          setRentReminderDays(data.leaseConfig.rent_reminder_days_before?.toString() || '')
          setOverdueReminderEnabled(data.leaseConfig.is_overdue_rent_reminder || false)
          setOverdueReminderDays(data.leaseConfig.overdue_days_after_reminder?.toString() || '')
        }
      } catch (error) {
        console.error('Error fetching room:', error)
        FeedbackToasts.error('Failed to load room details')
      } finally {
        setLoading(false)
      }
    }

    fetchRoomData()
  }, [roomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare the payload
      const payload: any = {
        // Room details (editable)
        title,
        // Features
        features: {
          wifi: features.wifi,
          cleaning_service: features.cleaning_service,
          toilet: features.toilet,
          balcony: features.balcony,
          ac: features.ac,
          female: features.female
        }
      }

      // Add optional initial charges if any have amounts
      const validInitialCharges = initialCharges.filter(
        charge => charge.amount && parseFloat(charge.amount) > 0
      )
      if (validInitialCharges.length > 0) {
        payload.initial_charges = validInitialCharges.map(charge => ({
          charge_type: charge.type.replace(/ /g, '_'),
          amount: parseFloat(charge.amount),
          is_taxed: charge.isTaxableChecked || false,
          is_refundable: charge.refundable || false
        }))
      }

      // Add optional late payment charges if any have amounts
      const validLateCharges = lateCharges.filter(
        charge => charge.amount && parseFloat(charge.amount) > 0
      )
      if (validLateCharges.length > 0) {
        payload.late_payment_charges = validLateCharges.map(charge => ({
          days_after_due: charge.days_after_due,
          amount: parseFloat(charge.amount)
        }))
      }

      // Add optional payment details if monthly rent is provided
      if (monthlyRent) {
        payload.monthly_rent = parseFloat(monthlyRent)
        payload.payment_day = paymentDay
      }

      // Add optional reminders if any are enabled
      if (leaseExpiryEnabled || rentReminderEnabled || overdueReminderEnabled) {
        payload.reminders = {
          is_expiry_reminder: leaseExpiryEnabled,
          expiry_days_before_reminder:
            leaseExpiryEnabled && leaseExpiryDays
              ? parseInt(leaseExpiryDays)
              : null,
          is_rent_reminder: rentReminderEnabled,
          rent_reminder_days_before:
            rentReminderEnabled && rentReminderDays
              ? parseInt(rentReminderDays)
              : null,
          is_overdue_rent_reminder: overdueReminderEnabled,
          overdue_days_after_reminder:
            overdueReminderEnabled && overdueReminderDays
              ? parseInt(overdueReminderDays)
              : null
        }
      }

      const response = await fetch(`/api/rooms/${roomId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }

      FeedbackToasts.updated(
        'Room',
        `${title} has been successfully updated.`
      )

      // Navigate back to room page
      router.push(`/rooms/${roomId}/overview`)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating room:', error)
      const errorMessage = error.message || 'Failed to update room'
      FeedbackToasts.updateFailed('room', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ActionPageSkeleton />
    )
  }

  if (!roomData) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <p className='text-(--text-secondary)'>Room not found</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Rooms', href: '/rooms' },
          { label: roomData.property.code + '(' + roomData.title + ')', href: `/rooms/${roomId}/overview` },
          { label: 'Edit Room' }
        ]}
        title={`Edit ${roomData.title}`}
        subtitle='Update room details and default configurations'
        isSubmitting={isSubmitting}
      />

      {/* Room Details Section */}
      <CollapsibleSection number={1} title='Room Details'>
        {/* Basic Details */}
        <InnerSection
          title='Basic Details'
          subtitle='Update the room details'
        >
          <div className='inputs-container'>
            <InputGroup label='Title' isRequired>
              <Input
                placeholder='E.g. Master'
                minLength={1}
                maxLength={100}
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </InputGroup>
            <InputGroup label='Property'>
              <Input
                value={roomData.property.code}
                disabled
                note='Property cannot be changed'
              />
            </InputGroup>
          </div>
        </InnerSection>

        {/* Status - Read Only */}
        <InnerSection
          title='Status'
          subtitle='Room status is managed separately'
        >
          <InputGroup label='Current Status'>
            <Input
              value={roomData.status.replace(/_/g, ' ')}
              disabled
              note='Use the room overview page to change status'
            />
          </InputGroup>
        </InnerSection>

        {/* Features */}
        <FeaturesSection
          type='room'
          features={features}
          onFeaturesChange={(f) => setFeatures(f as RoomFeatures)}
        />
      </CollapsibleSection>

      {/* Default Payment Details - Using PaymentSection Component */}
      <CollapsibleSection
        number={2}
        title={'Default Payment Details (Optional)'}
        defaultCollapse={existingInitialCharges.length === 0 && existingLateCharges.length === 0 && !leaseConfig?.default_monthly_rent}
      >
        <PaymentSection
          onInitialChargesChange={setInitialCharges}
          onMonthlyRentChange={setMonthlyRent}
          onPaymentDayChange={setPaymentDay}
          onLateChargesChange={setLateCharges}
          defaultPayment
          defaultConfig={{
            monthlyRent: leaseConfig?.default_monthly_rent?.toString() || '',
            paymentDay: leaseConfig?.default_payment_day || 1,
            initialCharges: existingInitialCharges.map(c => ({
              type: c.type,
              amount: c.amount,
              is_taxed: c.is_taxed,
              is_refundable: c.is_refundable
            })),
            lateCharges: existingLateCharges.map(c => ({
              days_after_due: c.days_after_due,
              amount: c.amount
            }))
          }}
        />
      </CollapsibleSection>

      {/* Default Reminders - Using ReminderSection Component */}
      <ReminderSection
        sectionNumber={3}
        title='Default Reminders (Optional)'
        onLeaseExpiryChange={(enabled, days) => {
          setLeaseExpiryEnabled(enabled)
          setLeaseExpiryDays(days)
        }}
        onRentReminderChange={(enabled, days) => {
          setRentReminderEnabled(enabled)
          setRentReminderDays(days)
        }}
        onOverdueReminderChange={(enabled, days) => {
          setOverdueReminderEnabled(enabled)
          setOverdueReminderDays(days)
        }}
        defaultCollapse={!leaseConfig?.is_expiry_reminder && !leaseConfig?.is_rent_reminder && !leaseConfig?.is_overdue_rent_reminder}
        defaultReminders={{
          is_expiry_reminder: leaseConfig?.is_expiry_reminder || false,
          expiry_days_before_reminder: leaseConfig?.expiry_days_before_reminder,
          is_rent_reminder: leaseConfig?.is_rent_reminder || false,
          rent_reminder_days_before: leaseConfig?.rent_reminder_days_before,
          is_overdue_rent_reminder: leaseConfig?.is_overdue_rent_reminder || false,
          overdue_days_after_reminder: leaseConfig?.overdue_days_after_reminder
        }}
      />
    </form>
  )
}

export default EditRoom
