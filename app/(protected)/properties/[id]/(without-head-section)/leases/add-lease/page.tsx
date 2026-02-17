'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import InputGroup from '@/components/costume-ui/input-group'
import DatePicker from '@/components/costume-ui/date-picker'
import Input from '@/components/costume-ui/input'
import Combobox from '@/components/costume-ui/combobox'
import PaymentSection, { DefaultPaymentConfig, LateCharge, PaymentStatusData } from '@/components/costume-ui/payment-section'
import ReminderSection, { DefaultReminderConfig } from '@/components/costume-ui/reminder-section'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import { ComboBoxitemsType } from '@/types'
import { ChargeData } from '@/components/costume-ui/charges-section'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { Info, Loader2, CheckCircle2, AlertCircle, CalendarCheck2, CalendarX2 } from 'lucide-react'
import { formatDate, formatDateForAPI } from '@/utils/formatTime'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import ViewConversionModal, { ViewDecision } from '@/components/view-conversion-modal'

// Helper to calculate end date (end date is start_date + number_of_months, same day of month)
const calculateEndDate = (startDate: Date, numberOfMonths: number): Date => {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  return endDate
}

const AddLease = () => {
  const { id: propertyId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')

  const [propertyCode, setPropertyCode] = useState<string | null>(null)
  const [isPropertyCodeLoading, setIsPropertyCodeLoading] = useState<boolean>(true)

  // Booking conversion state
  const [bookingId, setBookingId] = useState<string | null>(bookingIdParam)
  const [bookingTenant, setBookingTenant] = useState<{
    id: string
    name: string
    profile_thumb: string | null
  } | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<{
    id: string
    tenant: { id: string; name: string; profile_thumb: string | null }
  } | null>(null)
  const [bookingCheckDone, setBookingCheckDone] = useState(false)

  // View conversion state
  const [viewDecision, setViewDecision] = useState<ViewDecision | null>(null)
  const [viewReopenKey, setViewReopenKey] = useState(0)
  const [bookingCancelled, setBookingCancelled] = useState(false)

  // Default config state
  const [defaultConfigStatus, setDefaultConfigStatus] = useState<'loading' | 'loaded' | 'empty' | 'error'>('loading')
  const [defaultPaymentConfig, setDefaultPaymentConfig] = useState<DefaultPaymentConfig | undefined>(undefined)
  const [defaultReminderConfig, setDefaultReminderConfig] = useState<DefaultReminderConfig | undefined>(undefined)

  // Tenant state
  const [tenantItems, setTenantItems] = useState<ComboBoxitemsType[]>([])
  const [loadingTenants, setLoadingTenants] = useState<boolean>(true)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  // Lease details state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [leaseDuration, setLeaseDuration] = useState<number | null>(null)
  const leaseHasDuration = leaseDuration !== null && leaseDuration > 0

  // Payment details state
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [paymentDay, setPaymentDay] = useState<number>(1)
  const [initialCharges, setInitialCharges] = useState<ChargeData[]>([])
  const [lateCharges, setLateCharges] = useState<LateCharge[]>([])

  // Payment status state (managed by PaymentSection)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    isPaid: false,
    paymentMethod: 'Cash',
    paymentDate: undefined,
    paymentTime: '10:30:00',
    receiptFile: null
  })

  // Reminders state
  const [leaseExpiryReminder, setLeaseExpiryReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })
  const [rentReminder, setRentReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })
  const [overdueReminder, setOverdueReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<
    'info' | 'error' | 'success' | 'warning'
  >('info')

  const showAlert = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Fetch property code
  useEffect(() => {
    const fetchPropertyCode = async () => {
      setIsPropertyCodeLoading(true)
      const response = await fetch(`/api/leases/${propertyId}/property-code`)
      if (response.ok) {
        setIsPropertyCodeLoading(false)
        const data = await response.json()
        setPropertyCode(data.property)
      }
    }

    fetchPropertyCode()
  }, [propertyId])

  // Fetch default configurations for this property
  useEffect(() => {
    const fetchDefaultConfig = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}/default-config`)
        if (response.ok) {
          const data = await response.json()
          if (data.hasDefaults) {
            // Set payment config
            setDefaultPaymentConfig({
              monthlyRent: data.leaseConfig?.default_monthly_rent?.toString() || undefined,
              paymentDay: data.leaseConfig?.default_payment_day || undefined,
              initialCharges: data.initialCharges,
              lateCharges: data.latePaymentCharges
            })
            // Set reminder config
            setDefaultReminderConfig(data.leaseConfig || undefined)
            setDefaultConfigStatus('loaded')
          } else {
            setDefaultConfigStatus('empty')
          }
        } else {
          setDefaultConfigStatus('error')
        }
      } catch (error) {
        console.error('Error fetching default config:', error)
        setDefaultConfigStatus('error')
      }
    }

    fetchDefaultConfig()
  }, [propertyId])

  // Fetch tenants for organization
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/leases/tenants')
        if (response.ok) {
          const data = await response.json()
          setTenantItems(data.tenants)
        }
      } catch (error) {
        console.error('Error fetching tenants:', error)
      } finally {
        setLoadingTenants(false)
      }
    }

    fetchTenants()
  }, [])

  // Check for existing booking on this property
  useEffect(() => {
    const checkBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/check?propertyId=${propertyId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.booking) {
            if (bookingIdParam) {
              // Coming from "Convert to Lease" action — skip modal, preselect tenant
              setBookingTenant(data.booking.tenant)
              setSelectedTenantId(data.booking.tenant.id)
              setBookingId(data.booking.id)
            } else {
              // Navigated to add-lease normally — save pending booking (modal shown after view check)
              setPendingBooking(data.booking)
            }
          }
        }
      } catch (error) {
        console.error('Error checking booking:', error)
      } finally {
        setBookingCheckDone(true)
      }
    }

    checkBooking()
  }, [propertyId, bookingIdParam])

  // Show booking modal after view check completes (if there's a pending booking)
  const showBookingModalIfNeeded = () => {
    if (pendingBooking && !bookingIdParam && !bookingTenant && !bookingCancelled) {
      setShowBookingModal(true)
    }
  }

  const handleBookingConversionYes = () => {
    if (!pendingBooking) return
    setBookingTenant(pendingBooking.tenant)
    setSelectedTenantId(pendingBooking.tenant.id)
    setBookingId(pendingBooking.id)
    setShowBookingModal(false)
  }

  const handleBookingConversionNo = () => {
    if (!pendingBooking) return
    setBookingCancelled(true)
    setShowBookingModal(false)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isPaid, paymentMethod, paymentDate, paymentTime, receiptFile } = paymentStatus

    // Validation
    if (!startDate) {
      showAlert('Please select a start date', 'warning')
      return
    }

    if (!selectedTenantId) {
      showAlert('Please select a tenant', 'warning')
      return
    }


    if (initialCharges.length === 0) {
      showAlert('Please add at least one initial charge', 'warning')
      return
    }

    if (!paymentDate) {
      showAlert('Please select a payment date', 'warning')
      return
    }

    // Validate payment date is not in the future (only for paid payments)
    if (isPaid) {
      const paymentDateTime = new Date(
        `${formatDateForAPI(paymentDate)}T${paymentTime}`
      )
      const now = new Date()
      if (paymentDateTime > now) {
        showAlert('Payment date and time cannot be in the future', 'error')
        return
      }
    }

    if (isPaid && !paymentMethod) {
      showAlert('Please select a payment method', 'warning')
      return
    }

    if (isPaid && paymentMethod === 'Bank Transfer' && !receiptFile) {
      showAlert('Please upload a receipt for bank transfer', 'warning')
      return
    }

    // Validate reminders
    if (leaseExpiryReminder.enabled && !leaseExpiryReminder.days) {
      showAlert('Please specify days for lease expiry reminder', 'warning')
      return
    }

    if (rentReminder.enabled && !rentReminder.days) {
      showAlert('Please specify days for rent reminder', 'warning')
      return
    }

    if (overdueReminder.enabled && !overdueReminder.days) {
      showAlert('Please specify days for overdue reminder', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload receipt if needed
      let receiptUrl = null
      if (receiptFile && isPaid && paymentMethod === 'Bank Transfer') {
        const formData = new FormData()
        formData.append('file', receiptFile)
        formData.append('bucket', 'receipts')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          receiptUrl = url
        }
      }

      // Format dates for API
      const formattedStartDate = formatDateForAPI(startDate)
      const formattedPaymentDate = formatDateForAPI(paymentDate)

      // Create lease
      const response = await fetch('/api/leases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: propertyId,
          tenant_id: selectedTenantId,
          booking_id: bookingId || undefined,
          cancel_booking_id: bookingCancelled && pendingBooking ? pendingBooking.id : undefined,
          converted_view_id: viewDecision?.selectedViewId || undefined,
          resolve_views: viewDecision !== null,
          start_date: formattedStartDate,
          number_of_months: leaseDuration,
          payment_day: paymentDay,
          monthly_rent: parseFloat(monthlyRent) || 0,
          // Reminders
          is_expiry_reminder: leaseExpiryReminder.enabled,
          expiry_days_before_reminder: leaseExpiryReminder.enabled
            ? parseInt(leaseExpiryReminder.days)
            : null,
          is_rent_reminder: rentReminder.enabled,
          rent_reminder_days_before: rentReminder.enabled
            ? parseInt(rentReminder.days)
            : null,
          is_overdue_rent_reminder: overdueReminder.enabled,
          overdue_days_after_reminder: overdueReminder.enabled
            ? parseInt(overdueReminder.days)
            : null,
          // Initial charges payment
          initial_charges: initialCharges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedPaymentDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          // Late payment charges
          late_charges: lateCharges
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lease')
      }

      await response.json()
      FeedbackToasts.created('Lease')
      setTimeout(() => {
        window.location.href = `/properties/${propertyId}/leases`
      }, 1500)
    } catch (error: any) {
      console.error('Error creating lease:', error)
      FeedbackToasts.createFailed('lease', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Properties', href: '/properties' },
          { label: propertyCode, href: `/properties/${propertyId}/leases` },
          { label: 'Add Lease' }
        ]}
        isCrumbLoading={isPropertyCodeLoading}
        title='Add a lease'
        subtitle='Provide lease details and terms'
        className='mb-7.5'
        isSubmitting={isSubmitting}
      />
      {/* Default config loading feedback - non-blocking */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300
        ${defaultConfigStatus === 'loading' ? 'bg-blue-50 text-blue-700' : ''}
        ${defaultConfigStatus === 'loaded' ? 'bg-green-50 text-green-700' : ''}
        ${defaultConfigStatus === 'empty' ? 'bg-neutral-100 text-neutral-600' : ''}
        ${defaultConfigStatus === 'error' ? 'bg-red-50 text-red-700' : ''}
      `}>
        {defaultConfigStatus === 'loading' && (
          <>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span>Loading default configurations...</span>
          </>
        )}
        {defaultConfigStatus === 'loaded' && (
          <>
            <CheckCircle2 className='w-4 h-4' />
            <span>Default configurations applied</span>
          </>
        )}
        {defaultConfigStatus === 'empty' && (
          <>
            <Info className='w-4 h-4' />
            <span>No default configurations set for this property</span>
          </>
        )}
        {defaultConfigStatus === 'error' && (
          <>
            <AlertCircle className='w-4 h-4' />
            <span>Could not load default configurations</span>
          </>
        )}
      </div>

      {/* Decision feedback banners */}
      {(bookingTenant || bookingCancelled || viewDecision) && (
        <div className='flex flex-col gap-2'>
          {/* View conversion feedback */}
          {viewDecision && viewDecision.selectedViewId && (
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700'>
              <CheckCircle2 className='w-4 h-4 shrink-0' />
              <span className='flex-1'>Viewer <span className='font-medium'>{viewDecision.selectedViewName}</span> will be marked as converted</span>
              <button type='button' onClick={() => setViewReopenKey(k => k + 1)} className='text-xs font-medium underline underline-offset-2 shrink-0'>Change</button>
            </div>
          )}
          {viewDecision && !viewDecision.selectedViewId && (
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-neutral-100 text-neutral-600'>
              <Info className='w-4 h-4 shrink-0' />
              <span className='flex-1'>No viewer selected — all {viewDecision.totalViews} viewer{viewDecision.totalViews === 1 ? '' : 's'} will be marked as not converted</span>
              <button type='button' onClick={() => setViewReopenKey(k => k + 1)} className='text-xs font-medium underline underline-offset-2 shrink-0'>Change</button>
            </div>
          )}
          {/* Booking decision feedback */}
          {bookingTenant && (
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-50 text-green-700'>
              <CalendarCheck2 className='w-4 h-4 shrink-0' />
              <span className='flex-1'>Converting booking for <span className='font-medium'>{bookingTenant.name}</span> — tenant has been automatically selected</span>
              <button type='button' onClick={() => { setBookingTenant(null); setBookingId(null); setSelectedTenantId(null); setShowBookingModal(true) }} className='text-xs font-medium underline underline-offset-2 shrink-0'>Change</button>
            </div>
          )}
          {bookingCancelled && !bookingTenant && pendingBooking && (
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-neutral-100 text-neutral-600'>
              <CalendarX2 className='w-4 h-4 shrink-0' />
              <span className='flex-1'>Booking for <span className='font-medium'>{pendingBooking.tenant.name}</span> will be cancelled</span>
              <button type='button' onClick={() => { setBookingCancelled(false); setShowBookingModal(true) }} className='text-xs font-medium underline underline-offset-2 shrink-0'>Change</button>
            </div>
          )}
        </div>
      )}

      <CollapsibleSection number={1} title={'Lease & Payment Details'}>
        {/* Basic Details */}
        <InnerSection title='Lease Details' subtitle='Enter the lease details'>
          <div>
            <div className='inputs-container'>
              <InputGroup label='Start Date' isRequired>
                <DatePicker
                  value={startDate}
                  onValueChange={setStartDate}
                />
              </InputGroup>
              <InputGroup label='Lease Duration (Months)'>
                <Input
                  type='number'
                  min={1}
                  placeholder='Enter lease duration in months'
                  value={leaseDuration ?? ''}
                  onChange={e => {
                    const value = e.target.value
                    setLeaseDuration(value === '' ? null : Number(value))
                  }}
                />
              </InputGroup>
            </div>
            {/* Lease Duration Info Note */}
            {startDate && (
              <div className='mt-4 p-3 rounded-md bg-blue-50 border border-blue-200'>
                <div className='flex items-start gap-2 text-sm text-blue-800'>
                  <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    {leaseHasDuration ? (
                      <>
                        <p>
                          <span className='font-medium'>Lease period:</span>{' '}
                          {formatDate(startDate)} to{' '}
                          {formatDate(calculateEndDate(startDate, leaseDuration!))}
                        </p>
                        <p>
                          <span className='font-medium'>Rental invoices:</span>{' '}
                          First month rental is generated immediately. Next month's invoice is generated once the current rental is paid, due on the payment day set below.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className='font-medium'>Lease period:</span>{' '}
                          Starts {formatDate(startDate)} with no expiry date (ongoing lease).
                        </p>
                        <p>
                          <span className='font-medium'>Rental invoices:</span>{' '}
                          First month rental is generated immediately. Next month's invoice is generated once the current rental is paid, due on the payment day set below.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='inputs-container'>
            <InputGroup label='Tenant' isRequired>
              {bookingTenant ? (
                <Combobox
                  items={[{
                    id: bookingTenant.id,
                    label: bookingTenant.name,
                    avatar: bookingTenant.profile_thumb || undefined
                  }]}
                  searchPlaceholder='Search tenants'
                  variant='single'
                  placeholder={bookingTenant.name}
                  showAvatar
                  value={bookingTenant.id}
                  onValueChange={() => {}}
                  disabled
                  disabledReason='Tenant is from the booking being converted'
                />
              ) : (
                <Combobox
                  items={tenantItems}
                  searchPlaceholder='Search tenants'
                  variant='single'
                  placeholder={
                    loadingTenants ? 'Loading tenants...' : 'Select tenant'
                  }
                  showAvatar
                  isLoading={loadingTenants}
                  loadingMessage='Fetching tenants...'
                  onValueChange={value => setSelectedTenantId(value || null)}
                  required
                />
              )}
            </InputGroup>
          </div>
          {bookingTenant && (
            <div className='p-3 rounded-md bg-blue-50 border border-blue-200'>
              <div className='flex items-start gap-2 text-sm text-blue-800'>
                <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                <p>This lease is being converted from a booking. The tenant <span className='font-medium'>{bookingTenant.name}</span> has been automatically selected.</p>
              </div>
            </div>
          )}
        </InnerSection>
        {/* Payment details */}
        <PaymentSection
          onInitialChargesChange={setInitialCharges}
          onMonthlyRentChange={setMonthlyRent}
          onPaymentDayChange={setPaymentDay}
          onLateChargesChange={setLateCharges}
          onPaymentStatusChange={setPaymentStatus}
          defaultConfig={defaultPaymentConfig}
          requiredFields={true}
        />
      </CollapsibleSection>

      {/* Reminders details */}
      <ReminderSection
        sectionNumber={2}
        title='Lease Reminders (Optional)'
        defaultCollapse
        onLeaseExpiryChange={(enabled, days) =>
          setLeaseExpiryReminder({ enabled, days })
        }
        onRentReminderChange={(enabled, days) =>
          setRentReminder({ enabled, days })
        }
        onOverdueReminderChange={(enabled, days) =>
          setOverdueReminder({ enabled, days })
        }
        defaultReminders={defaultReminderConfig}
      />

      {/* Alert Dialog */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />

      {/* View Conversion Modal */}
      <ViewConversionModal
        propertyId={propertyId}
        canShow={bookingCheckDone}
        reopenKey={viewReopenKey}
        onDecisionMade={(decision) => { setViewDecision(decision); showBookingModalIfNeeded() }}
        onNoViews={showBookingModalIfNeeded}
      />

      {/* Booking Conversion Modal */}
      <AlertDialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 mb-2'>
              <CalendarCheck2 className='h-6 w-6 text-blue-600' />
            </div>
            <AlertDialogTitle className='text-center'>Existing Booking Found</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='text-center text-(--text-secondary)'>
                <p className='mb-4'>This property has an active booking. Is the person adding this lease the same tenant who made the booking?</p>
                {pendingBooking && (
                  <div className='flex items-center justify-center gap-3 p-3 rounded-lg bg-(--bg-secondary) border border-(--border-main)'>
                    <UserAvatar
                      name={pendingBooking.tenant.name}
                      imgSrc={pendingBooking.tenant.profile_thumb}
                      size={40}
                    />
                    <div className='text-left'>
                      <p className='font-medium text-(--text-primary)'>{pendingBooking.tenant.name}</p>
                      <p className='text-xs text-(--text-secondary)'>Booked Tenant</p>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='sm:justify-center gap-3'>
            <AlertDialogCancel
              onClick={(e) => {
                e.preventDefault()
                handleBookingConversionNo()
              }}
            >
              No, cancel booking
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleBookingConversionYes()
              }}
            >
              Yes, same person
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

export default AddLease
