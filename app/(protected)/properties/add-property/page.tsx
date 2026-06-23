'use client'
import { useState, useRef, useEffect } from 'react'
import Button from '@/components/costume-ui/button'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import Select from '@/components/costume-ui/select'
import { House, Building, Store, Check } from 'lucide-react'
import Option from '@/components/costume-ui/option'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import AddPageHead from '@/components/costume-ui/add-page-head'
import { useRouter } from 'next/navigation'
import type { ChargeData } from '@/components/costume-ui/charges-section'
import RoomCard, { RoomData } from '@/components/costume-ui/room-card'
import FeaturesSection, { PropertyFeatures } from '@/components/costume-ui/features-section'
import PropertyImagesUpload, { ImageData } from '@/components/costume-ui/property-images-upload'
import PaymentSection from '@/components/costume-ui/payment-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import type { LateCharge } from '@/components/costume-ui/payment-section'
import type { projects } from '@prisma/client'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { PermissionGuard } from '@/components/permission-guard'

// Main compoennt
const AddProperty = () => {
  const router = useRouter()

  const [projects, setProjects] = useState<projects[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const { options, selectByIndex, selectedIndex } = useSingleSelectOption([
    {
      Icon: House,
      label: 'House',
      isSelected: true
    },
    {
      Icon: Building,
      label: 'Apartment',
      isSelected: false
    },
    {
      Icon: House,
      label: 'Studio',
      isSelected: false
    },
    {
      Icon: Store,
      label: 'Commercial Unit',
      isSelected: false
    }
  ])

  // Property Details State
  const [code, setCode] = useState('')
  const [selectedProject, setSelectedProject] = useState<projects>()
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [isPropertyReady, setIsPropertyReady] = useState<boolean>(false)
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [features, setFeatures] = useState<PropertyFeatures>({
    wifi: false,
    cleaning_service: false,
    water_heater: false,
    dryer: false,
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

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get selected property type
      const selectedType = options.find(opt => opt.isSelected)?.label || 'House'

      // Prepare the payload
      const payload: any = {
        // Required property details
        code,
        street_address: streetAddress,
        postal_code: postalCode,
        city: city,
        type: selectedType.replace(' ', '_'),
        project_id: selectedProject?.id || null,
        is_ready: isPropertyReady,

        // Features
        features: {
          wifi: features.wifi,
          cleaning_service: features.cleaning_service,
          water_heater: features.water_heater,
          dryer: features.dryer,
          female: features.female
        },

        // Optional rooms (only for House and Apartment types)
        rooms:
          rooms.length > 0 && (selectedIndex === 0 || selectedIndex === 1)
            ? rooms.map(room => ({ ...room, is_ready: true }))
            : undefined
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

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create property')
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
          formData.append('property_id', data.property.id)

          await fetch('/api/property-images', {
            method: 'POST',
            body: formData
          })
        }
      }

      // Show success toast with detailed information
      const roomInfo =
        data.roomsCount > 0
          ? ` with ${data.roomsCount} room${data.roomsCount > 1 ? 's' : ''}`
          : ''
      FeedbackToasts.created(
        'Property',
        `${code} has been successfully added to your properties${roomInfo}.`
      )

      // Reset all form fields
      setCode('')
      setSelectedProject(undefined)
      setStreetAddress('')
      setCity('')
      setPostalCode('')
      setIsPropertyReady(false)
      setRooms([])
      setFeatures({ wifi: false, cleaning_service: false, water_heater: false, dryer: false, female: false })
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

      // Reset property type to first option (House)
      selectByIndex(0)

      // Force remount of child components to reset their internal state
      setFormKey(prev => prev + 1)

      // Refresh the page to update any cached data
      router.refresh()
    } catch (error: any) {
      console.error('Error creating property:', error)
      const errorMessage = error.message || 'Failed to create property'
      FeedbackToasts.createFailed('property', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PermissionGuard permission="properties.create">
      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Properties', href: '/properties' },
          { label: 'Add Property' }
        ]}
        title='Add a property'
        subtitle='Add a new property to your management dashboard'
        isSubmitting={isSubmitting}
      />

      {/* Property Details Section */}
      <CollapsibleSection number={1} title='Property Details'>
        {/* Basic Details */}
        <InnerSection
          title='Basic Details'
          subtitle='Enter the property details'
        >
          <div className='inputs-container'>
            <InputGroup label='Code' isRequired>
              <Input
                placeholder='E.g. B-2-1'
                minLength={1}
                maxLength={50}
                required
                value={code}
                onChange={e => setCode(e.target.value)}
              />
            </InputGroup>
            <InputGroup label='Project' isRequired>
              <Select
                items={projects.map((p: any) => ({ value: p.id, label: p.title }))}
                label='Projects'
                placeholder={
                  loadingProjects ? 'Loading projects...' : 'Select a project'
                }
                required
                value={selectedProject?.id}
                onValueChange={(id: string) => {
                  const project = projects.find(p => p.id === id)
                  setSelectedProject(project)
                }}
                disabled={loadingProjects}
              />
            </InputGroup>
          </div>
        </InnerSection>

        {/* Address */}
        <InnerSection title='Address' subtitle='Property location details'>
          <InputGroup label='Street Address' isRequired>
            <Input
              placeholder='E.g. 1234 West Pinecrest Avenue'
              minLength={5}
              maxLength={300}
              required
              value={streetAddress}
              onChange={e => setStreetAddress(e.target.value)}
            />
          </InputGroup>
          <div className='inputs-container'>
            <InputGroup label='City' isRequired>
              <Input
                placeholder='E.g. Ayer Keroh'
                minLength={1}
                maxLength={100}
                required
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </InputGroup>
            <InputGroup label='Postal Code' isRequired>
              <Input
                placeholder='E.g. 50450'
                minLength={4}
                maxLength={10}
                required
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
              />
            </InputGroup>
            <InputGroup label='State' isRequired>
              <Input
                value={selectedProject?.state || ''}
                note='Automatically set based on project'
                disabled
                required
              />
            </InputGroup>
            <InputGroup label='Country'>
              <Input defaultValue='Malaysia' disabled />
            </InputGroup>
          </div>
        </InnerSection>

        {/* Property Type */}
        <InnerSection
          title='Property Type'
          subtitle='Select the type of property'
        >
          <div className='inputs-container'>
            {options.map((option, index) => (
              <Option
                key={index}
                Icon={option.Icon}
                label={option.label}
                isSelected={option.isSelected}
                onClick={() => selectByIndex(index)}
              />
            ))}
          </div>
        </InnerSection>

        {/* Rooms */}
        {(selectedIndex === 0 || selectedIndex === 1) && (
          <RoomCard key={formKey} onRoomsChange={setRooms} />
        )}

        {/* Status */}
        <InnerSection
          title='Status'
          subtitle='Set availability of the property'
        >
          <div className='relative border border-(--border-strong) rounded-md overflow-hidden'>
            <Checkbox
              checked={isPropertyReady}
              className={cn(
                'absolute top-1/2 left-3 -translate-y-1/2',
                'h-6 w-6 border-(--border-strong)'
              )}
            />
            <button
              type='button'
              onClick={() => setIsPropertyReady(prev => !prev)}
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
                    isPropertyReady
                      ? 'text-(--success-main)'
                      : 'text-neutral-400'
                  )}
                />
                <span className='texts-body-medium'>
                  Property is ready for occupancy
                </span>
              </div>
              <span className='texts-caption-large text-left text-(--text-secondary)'>
                Check this if the property is move-in ready
              </span>
            </button>
          </div>
        </InnerSection>

        {/* Features */}
        <FeaturesSection
          type='property'
          features={features}
          onFeaturesChange={(f) => setFeatures(f as PropertyFeatures)}
        />

        {/* Images */}
        <PropertyImagesUpload
          key={`images-${formKey}`}
          type='property'
          images={images}
          onImagesChange={setImages}
        />
      </CollapsibleSection>

      {/* Default Payment Details - Using PaymentSection Component */}
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

      {/* Default Reminders - Using ReminderSection Component */}
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
    </PermissionGuard>
  )
}

export default AddProperty
