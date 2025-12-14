'use client'
import { useState, useEffect, use } from 'react'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import Select from '@/components/costume-ui/select'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import AddPageHead from '@/components/costume-ui/add-page-head'
import { useRouter } from 'next/navigation'
import type { ChargeData } from '@/components/costume-ui/charges-section'
import PaymentSection from '@/components/costume-ui/payment-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import type { LateCharge } from '@/components/costume-ui/payment-section'
import type { projects } from '@prisma/client'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import ActionPageSkeleton from '@/components/loading-ui/action-page-skeleton'

type PageProps = {
  params: Promise<{ id: string }>
}

type PropertyData = {
  id: string
  code: string
  street_address: string
  city: string
  postal_code: string
  type: string
  status: string
  project: {
    id: string
    title: string
    state: string
  } | null
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

const EditProperty = ({ params }: PageProps) => {
  const router = useRouter()
  const { id: propertyId } = use(params)

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<projects[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // Property data from API
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null)
  const [leaseConfig, setLeaseConfig] = useState<LeaseConfig | null>(null)
  const [existingInitialCharges, setExistingInitialCharges] = useState<InitialCharge[]>([])
  const [existingLateCharges, setExistingLateCharges] = useState<LatePaymentCharge[]>([])

  // Property Details State (editable)
  const [code, setCode] = useState('')
  const [selectedProject, setSelectedProject] = useState<projects>()
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

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

  // Fetch property data for editing
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/edit`)
        if (!response.ok) {
          throw new Error('Failed to fetch property')
        }
        const data = await response.json()

        setPropertyData(data.property)
        setLeaseConfig(data.leaseConfig)
        setExistingInitialCharges(data.initialCharges)
        setExistingLateCharges(data.latePaymentCharges)

        // Set form values from fetched data
        setCode(data.property.code)
        setStreetAddress(data.property.street_address)
        setCity(data.property.city)
        setPostalCode(data.property.postal_code)

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
        console.error('Error fetching property:', error)
        FeedbackToasts.error('Failed to load property details')
      } finally {
        setLoading(false)
      }
    }

    fetchPropertyData()
  }, [propertyId])

  // Set selected project when both projects and propertyData are loaded
  useEffect(() => {
    if (!loadingProjects && propertyData?.project && projects.length > 0) {
      const project = projects.find(p => p.id === propertyData.project?.id)
      if (project) {
        setSelectedProject(project)
      }
    }
  }, [loadingProjects, propertyData, projects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare the payload
      const payload: any = {
        // Property details (editable)
        code,
        street_address: streetAddress,
        postal_code: postalCode,
        city: city,
        project_id: selectedProject?.id || null
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

      const response = await fetch(`/api/properties/${propertyId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update property')
      }

      FeedbackToasts.updated(
        'Property',
        `${code} has been successfully updated.`
      )

      // Navigate back to property page
      router.push(`/properties/${propertyId}/overview`)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating property:', error)
      const errorMessage = error.message || 'Failed to update property'
      FeedbackToasts.updateFailed('property', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ActionPageSkeleton />
    )
  }

  if (!propertyData) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <p className='text-(--text-secondary)'>Property not found</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Properties', href: '/properties' },
          { label: propertyData.code, href: `/properties/${propertyId}/overview` },
          { label: 'Edit Property' }
        ]}
        title={`Edit ${propertyData.code}`}
        subtitle='Update property details and default configurations'
        isSubmitting={isSubmitting}
      />

      {/* Property Details Section */}
      <CollapsibleSection number={1} title='Property Details'>
        {/* Basic Details */}
        <InnerSection
          title='Basic Details'
          subtitle='Update the property details'
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
                items={projects.map(p => ({ value: p.id, label: p.title }))}
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

        {/* Property Type - Read Only */}
        <InnerSection
          title='Property Type'
          subtitle='Property type cannot be changed after creation'
        >
          <InputGroup label='Type'>
            <Input
              value={propertyData.type.replace(/_/g, ' ')}
              disabled
              note='Property type cannot be modified'
            />
          </InputGroup>
        </InnerSection>

        {/* Status - Read Only */}
        <InnerSection
          title='Status'
          subtitle='Property status is managed separately'
        >
          <InputGroup label='Current Status'>
            <Input
              value={propertyData.status.replace(/_/g, ' ')}
              disabled
              note='Use the property overview page to change status'
            />
          </InputGroup>
        </InnerSection>
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

export default EditProperty
