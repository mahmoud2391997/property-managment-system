'use client'
import React, { useState, useEffect } from 'react'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import Combobox from '@/components/costume-ui/combobox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import PaymentSection from '@/components/costume-ui/payment-section'
import FeaturesSection, { RoomFeatures } from '@/components/costume-ui/features-section'
import PropertyImagesUpload, { ImageData } from '@/components/costume-ui/property-images-upload'
import AddPageHead from '@/components/costume-ui/add-page-head'
import type { ChargeData } from '@/components/costume-ui/charges-section'
import type { LateCharge } from '@/components/costume-ui/payment-section'
import type { properties, projects } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { ComboBoxitemsType } from '@/types'

type PropertyWithProject = properties & { projects?: projects | null }

// Main compoennt
const AddRoom = () => {
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyWithProject[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyWithProject>()
  const [title, setTitle] = useState('')
  const [isRoomReady, setIsRoomReady] = useState<boolean>(false)
  const [features, setFeatures] = useState<RoomFeatures>({
    wifi: false,
    cleaning_service: false,
    toilet: false,
    balcony: false,
    ac: false,
    queen_bed: false,
    female: false
  })
  const [images, setImages] = useState<ImageData[]>([])

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
  const [formKey, setFormKey] = useState(0) // Key to force reset child components

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Only fetch the fields we need for the combobox
        const response = await fetch(
          '/api/properties?fields=id,code&includeProject=true'
        )
        if (response.ok) {
          const data = await response.json()
          setProperties(data.properties || [])
        }
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!title || !selectedProperty?.id) {
        FeedbackToasts.createFailed(
          'room',
          'Please fill in all required fields'
        )
        setIsSubmitting(false)
        return
      }

      // Prepare the payload
      const payload: any = {
        // Required room details
        title,
        property_id: selectedProperty.id,
        is_ready: isRoomReady,
        // Features
        features: {
          wifi: features.wifi,
          cleaning_service: features.cleaning_service,
          toilet: features.toilet,
          balcony: features.balcony,
          ac: features.ac,
          queen_bed: features.queen_bed,
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

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      // Upload images if any
      const newImages = images.filter(img => img.isNew && img.file)
      if (newImages.length > 0) {
        for (const image of newImages) {
          if (!image.file) continue

          const formData = new FormData()
          formData.append('main_image', image.file)

          // Create thumb blob from thumb_url
          const thumbResponse = await fetch(image.thumb_url)
          const thumbBlob = await thumbResponse.blob()
          formData.append('thumb_image', new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' }))
          formData.append('room_id', data.room.id)

          await fetch('/api/property-images', {
            method: 'POST',
            body: formData
          })
        }
      }

      // Show success toast
      FeedbackToasts.created(
        'Room',
        `${title} has been successfully added under ${selectedProperty?.code}.`
      )

      // Reset all form fields
      setTitle('')
      setIsRoomReady(false)
      setFeatures({ wifi: false, cleaning_service: false, toilet: false, balcony: false, ac: false, queen_bed: false, female: false })
      setImages([])
      setInitialCharges([])
      setLateCharges([])
      setMonthlyRent('')
      setPaymentDay(1)
      setLeaseExpiryEnabled(false)
      setLeaseExpiryDays('')
      setRentReminderEnabled(false)
      setRentReminderDays('')
      setOverdueReminderEnabled(false)
      setOverdueReminderDays('')

      // Force remount of child components to reset their internal state
      setFormKey(prev => prev + 1)

      // Reset property selection after remount
      setTimeout(() => {
        setSelectedProperty(undefined)
      }, 0)

      // Refresh the page to update any cached data
      router.refresh()
    } catch (error: any) {
      console.error('Error creating room:', error)
      const errorMessage = error.message || 'Failed to create room'
      FeedbackToasts.createFailed('room', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format properties for combobox
  const propertyItems: ComboBoxitemsType[] = properties.map(property => ({
    id: property.id,
    label: property.code,
    subtitle: property.projects?.title || undefined
  }))

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Rooms', href: '/rooms' },
          { label: 'Add Room' }
        ]}
        title='Add a room'
        subtitle='Add a new room under an existing property'
        isSubmitting={isSubmitting}
      />

      {/* Rooms Details Section */}
      <CollapsibleSection number={1} title='Room Details'>
        {/* Basic Details */}
        <InnerSection title='Basic Details' subtitle='Enter the room details'>
          <div className='inputs-container'>
            <InputGroup label='Title' isRequired>
              <Input
                placeholder='E.g. Master'
                maxLength={100}
                minLength={1}
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </InputGroup>
            <InputGroup label='Property' isRequired>
              <Combobox
                items={propertyItems}
                placeholder={
                  loadingProperties
                    ? 'Loading properties...'
                    : 'Select a property'
                }
                searchPlaceholder='Search properties...'
                variant='single'
                NotFoundMessage='No properties found.'
                showAvatar={false}
                value={selectedProperty?.id}
                onValueChange={id => {
                  const property = properties.find(p => p.id === id)
                  setSelectedProperty(property)
                }}
                disabled={loadingProperties}
                isLoading={loadingProperties}
                loadingMessage='Fetching properties...'
                required
              />
            </InputGroup>
          </div>
        </InnerSection>

        {/* Status */}
        <InnerSection title='Status' subtitle='Set availability of the room'>
          <div className='relative border border-(--border-strong) rounded-md overflow-hidden'>
            <Checkbox
              checked={isRoomReady}
              className={cn(
                'absolute top-1/2 left-3 -translate-y-1/2',
                'h-6 w-6 border-(--border-strong)'
              )}
            />
            <button
              type='button'
              onClick={() => setIsRoomReady(prev => !prev)}
              className={cn(
                'flex flex-col justify-center gap-[3]',
                'hover:bg-neutral-50',
                'h-20 w-full px-5 pl-11',
                'cursor-pointer'
              )}
            >
              <div className='flex items-center gap-[5]'>
                <Check
                  size={17}
                  className={cn(
                    isRoomReady ? 'text-(--success-main)' : 'text-neutral-400'
                  )}
                />
                <span className='texts-body-medium'>
                  Room is ready for occupancy
                </span>
              </div>
              <span className='texts-caption-large text-left text-(--text-secondary)'>
                Check this if the room is move-in ready
              </span>
            </button>
          </div>
        </InnerSection>

        {/* Features */}
        <FeaturesSection
          type='room'
          features={features}
          onFeaturesChange={(f) => setFeatures(f as RoomFeatures)}
        />

        {/* Images */}
        <PropertyImagesUpload
          key={`images-${formKey}`}
          type='room'
          images={images}
          onImagesChange={setImages}
        />
      </CollapsibleSection>

      {/* Default Payment Details */}
      <CollapsibleSection
        number={2}
        title={'Default Payment Details (Optional)'}
        defaultCollapse
      >
        <PaymentSection
          key={`payment-${formKey}`}
          onInitialChargesChange={setInitialCharges}
          onMonthlyRentChange={setMonthlyRent}
          onPaymentDayChange={setPaymentDay}
          onLateChargesChange={setLateCharges}
          defaultPayment
        />
      </CollapsibleSection>

      {/* Default Reminder */}
      <ReminderSection
        key={`reminder-${formKey}`}
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
        defaultCollapse
      />
    </form>
  )
}

export default AddRoom
