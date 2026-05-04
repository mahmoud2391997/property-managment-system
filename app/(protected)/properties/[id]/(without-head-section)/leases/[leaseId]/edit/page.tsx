'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import InputGroup from '@/components/costume-ui/input-group'
import DatePicker from '@/components/costume-ui/date-picker'
import Input from '@/components/costume-ui/input'
import ReminderSection from '@/components/costume-ui/reminder-section'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { Info, Loader2 } from 'lucide-react'
import { formatDate, formatDateForAPI } from '@/utils/formatTime'
import { PermissionGuard } from '@/components/permission-guard'

const calculateEndDate = (startDate: Date, numberOfMonths: number): Date => {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  return endDate
}

type LeaseData = {
  lease: {
    id: string
    reference_id: string
    start_date: string
    number_of_months: number | null
    monthly_rent: number
    payment_day: number
    db_status: string
    property: {
      code: string
    }
    reminders: {
      expiry: { enabled: boolean; days_before?: number | null }
      rent: { enabled: boolean; days_before?: number | null }
      overdue: { enabled: boolean; days_after?: number | null }
    }
  }
}

const EditLease = () => {
  const { id: propertyId, leaseId } = useParams<{ id: string; leaseId: string }>()

  const [propertyCode, setPropertyCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null)

  // Lease data
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [leaseDuration, setLeaseDuration] = useState<number | null>(null)
  const leaseHasDuration = leaseDuration !== null && leaseDuration > 0
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [paymentDay, setPaymentDay] = useState<number>(1)

  // Reminders
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

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('info')

  const showAlert = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Fetch lease data
  useEffect(() => {
    if (!leaseId) return
    const fetchLease = async () => {
      try {
        const response = await fetch(`/api/leases/details?leaseId=${leaseId}`)
        if (response.ok) {
          const data = await response.json()
          setLeaseData(data)
          const lease = data.lease

          setPropertyCode(lease.property.code)

          if (lease.start_date) {
            setStartDate(new Date(lease.start_date + 'T00:00:00'))
          }

          setLeaseDuration(lease.number_of_months)
          setMonthlyRent(lease.monthly_rent.toString())
          setPaymentDay(lease.payment_day)

          setLeaseExpiryReminder({
            enabled: lease.reminders.expiry.enabled,
            days: lease.reminders.expiry.days_before?.toString() || ''
          })
          setRentReminder({
            enabled: lease.reminders.rent.enabled,
            days: lease.reminders.rent.days_before?.toString() || ''
          })
          setOverdueReminder({
            enabled: lease.reminders.overdue.enabled,
            days: lease.reminders.overdue.days_after?.toString() || ''
          })
        } else {
          showAlert('Failed to load lease data', 'error')
        }
      } catch (error) {
        console.error('Error fetching lease:', error)
        showAlert('Failed to load lease data', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLease()
  }, [leaseId])

  const canEdit = leaseData ? ['Current', 'Scheduled'].includes(leaseData.lease.db_status) : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canEdit) {
      showAlert('This lease cannot be edited', 'error')
      return
    }

    if (!startDate) {
      showAlert('Please select a start date', 'warning')
      return
    }

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
      const formattedStartDate = formatDateForAPI(startDate)

      const response = await fetch(`/api/leases/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leaseId,
          start_date: formattedStartDate,
          number_of_months: leaseDuration,
          payment_day: paymentDay,
          monthly_rent: parseFloat(monthlyRent) || 0,
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
            : null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update lease')
      }

      FeedbackToasts.updated('Lease')
      setTimeout(() => {
        window.location.href = `/properties/${propertyId}/leases/${leaseId}/details`
      }, 1500)
    } catch (error: any) {
      console.error('Error updating lease:', error)
      FeedbackToasts.updateFailed('lease', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-6 h-6 animate-spin text-(--text-secondary)' />
      </div>
    )
  }

  return (
    <PermissionGuard permission='leases.update'>
      {!canEdit && (
        <div className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-amber-50 text-amber-700'>
          <Info className='w-4 h-4' />
          <span>Only Current or Scheduled leases can be edited</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        <AddPageHead
          crumb_items={[
            { label: 'Properties', href: '/properties' },
            { label: propertyCode, href: `/properties/${propertyId}/leases` },
            { label: 'Edit Lease' }
          ]}
          isCrumbLoading={false}
          title='Edit Lease'
          subtitle='Update lease details and terms'
          className='mb-7.5'
          isSubmitting={isSubmitting}
        />

        <CollapsibleSection number={1} title={'Lease & Payment Details'}>
          <InnerSection title='Lease Details' subtitle='Update the lease details'>
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
                        </>
                      ) : (
                        <>
                          <p>
                            <span className='font-medium'>Lease period:</span>{' '}
                            Starts {formatDate(startDate)} with no expiry date (ongoing lease).
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className='inputs-container'>
              <InputGroup label='Monthly Rent'>
                <Input
                  type='number'
                  min={0}
                  placeholder='Enter monthly rent'
                  value={monthlyRent}
                  onChange={e => setMonthlyRent(e.target.value)}
                />
              </InputGroup>
              <InputGroup label='Payment Day'>
                <Input
                  type='number'
                  min={1}
                  max={28}
                  placeholder='Day of month (1-28)'
                  value={paymentDay}
                  onChange={e => setPaymentDay(parseInt(e.target.value) || 1)}
                />
              </InputGroup>
            </div>
          </InnerSection>
        </CollapsibleSection>

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
        />

        <Alert
          open={alertOpen}
          onClose={() => setAlertOpen(false)}
          message={alertMessage}
          type={alertType}
        />
      </form>
    </PermissionGuard>
  )
}

export default EditLease
