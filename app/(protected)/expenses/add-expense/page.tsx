'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import Combobox from '@/components/costume-ui/combobox'
import DatePicker from '@/components/costume-ui/date-picker'
import Input from '@/components/costume-ui/input'
import InputGroup from '@/components/costume-ui/input-group'
import Option from '@/components/costume-ui/option'
import RadioGroup from '@/components/costume-ui/radio-group'
import RecurringConfig from '@/components/costume-ui/recurring-config'
import Select from '@/components/costume-ui/select'
import TimePicker from '@/components/costume-ui/time-picker'
import UploadFile from '@/components/costume-ui/upload-file'
import Alert from '@/components/costume-ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import { ComboBoxitemsType, PaymentType } from '@/types'
import {
  propertyExpenseTypes,
  contractExpenseTypes,
  companyExpenseTypes,
  purchaseExpenseTypes
} from '@/utils/data'
import { formatPaymentTypeLabel } from '@/utils/functions'
import { House, FileText, User, Building2, ShoppingCart, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDateForAPI } from '@/utils/formatTime'

const CATEGORY_MAP = [
  'Property_Related',
  'Contract_Related',
  'Staff_Related',
  'Company_Related',
  'Purchase_Related'
] as const

const EXPENSE_TYPES_MAP: Record<number, PaymentType[]> = {
  0: propertyExpenseTypes,
  1: contractExpenseTypes,
  3: companyExpenseTypes,
  4: purchaseExpenseTypes
}

const AddExpense = () => {
  const { options, selectByIndex, selectedIndex } = useSingleSelectOption([
    {
      Icon: House,
      label: 'Property Related',
      isSelected: true,
      isDisabled: false
    },
    {
      Icon: FileText,
      label: 'Contract Related',
      isSelected: false,
      isDisabled: false
    },
    {
      Icon: User,
      label: 'Staff Related',
      isSelected: false,
      isDisabled: true
    },
    {
      Icon: Building2,
      label: 'Company Related',
      isSelected: false,
      isDisabled: false
    },
    {
      Icon: ShoppingCart,
      label: 'Purchase Related',
      isSelected: false,
      isDisabled: false
    }
  ])

  // Expense types based on selected category
  const expenseTypes = EXPENSE_TYPES_MAP[selectedIndex ?? 0] ?? propertyExpenseTypes
  const typesOfExpense: { label: string; value: string }[] = expenseTypes.map(et => ({
    label: formatPaymentTypeLabel(et.type),
    value: et.type
  }))

  // Form state
  const [expenseType, setExpenseType] = useState<PaymentType>(expenseTypes[0])
  const [description, setDescription] = useState<string>('')
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [loadingProperties, setLoadingProperties] = useState<boolean>(true)
  const [loadingContracts, setLoadingContracts] = useState<boolean>(false)
  const [loadingLeases, setLoadingLeases] = useState<boolean>(false)
  const [propertyItems, setPropertyItems] = useState<ComboBoxitemsType[]>([])
  const [contractItems, setContractItems] = useState<ComboBoxitemsType[]>([])
  const [leaseItems, setLeaseItems] = useState<ComboBoxitemsType[]>([])
  const [isPaid, setIsPaid] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<string | 'Cash' | 'Bank Transfer'>('Cash')
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined)
  const [paymentTime, setPaymentTime] = useState<string>('10:30:00')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [charges, setCharges] = useState<any[]>([])
  const [recurringConfig, setRecurringConfig] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Purchase-specific state
  const [isAsset, setIsAsset] = useState<boolean>(false)
  const [depreciationPercentage, setDepreciationPercentage] = useState<string>('')

  // For contract related
  const selectable: boolean = expenseType === expenseTypes[0] && selectedIndex === 1

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('info')

  const showAlert = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Helper to translate week day codes to full names
  const weekDayFullNames: Record<string, string> = {
    'Su': 'Sunday',
    'Mo': 'Monday',
    'Tu': 'Tuesday',
    'We': 'Wednesday',
    'Th': 'Thursday',
    'Fr': 'Friday',
    'Sa': 'Saturday'
  }
  const translateWeekDays = (codes: string) => {
    return codes.split(',').map(code => weekDayFullNames[code] || code).join(', ')
  }

  // Helper to calculate next expense date based on recurring config
  const calculateNextExpenseDate = (startDate: Date, config: any): Date => {
    const next = new Date(startDate)
    const { every, time_unit, event_on } = config

    switch (time_unit) {
      case 'Day':
        next.setDate(next.getDate() + every)
        break
      case 'Week':
        if (event_on) {
          const weekDayMap: Record<string, number> = { 'Su': 0, 'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6 }
          const selectedDays = event_on.split(',').map((d: string) => weekDayMap[d]).sort((a: number, b: number) => a - b)
          next.setDate(next.getDate() + (every * 7))
          const daysUntilNext = selectedDays.find((d: number) => d >= next.getDay()) ?? selectedDays[0]
          const diff = daysUntilNext - next.getDay()
          next.setDate(next.getDate() + (diff >= 0 ? diff : 7 + diff))
        } else {
          next.setDate(next.getDate() + (every * 7))
        }
        break
      case 'Month':
        next.setMonth(next.getMonth() + every)
        if (event_on) {
          const selectedDays = event_on.split(',').map(Number).sort((a: number, b: number) => a - b)
          next.setDate(selectedDays[0])
        }
        break
      case 'Year':
        next.setFullYear(next.getFullYear() + every)
        break
    }
    return next
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Category-specific validation
    if (selectedIndex === 0 && !selectedPropertyId) {
      showAlert('Please select a property', 'warning')
      return
    }

    if (selectedIndex === 1 && !selectedContractId) {
      showAlert('Please select a contract', 'warning')
      return
    }

    if (charges.length === 0) {
      showAlert('Please add at least one charge', 'warning')
      return
    }

    if (!paymentDate) {
      showAlert('Please select payment date', 'warning')
      return
    }

    // Validate payment date is not in the future (only for paid expenses)
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
      showAlert('Please select payment method', 'warning')
      return
    }

    if (isPaid && paymentMethod === 'Bank Transfer' && !receiptFile) {
      showAlert('Please upload receipt for bank transfer', 'warning')
      return
    }

    // Validate depreciation percentage for purchase assets with Miscellaneous_Others type
    if (selectedIndex === 4 && isAsset && expenseType.type === 'Miscellaneous_Others') {
      const depValue = parseFloat(depreciationPercentage)
      if (!depreciationPercentage || isNaN(depValue) || depValue <= 0 || depValue > 100) {
        showAlert('Please enter a valid depreciation percentage (0-100)', 'warning')
        return
      }
    }

    // Validate recurring config if enabled
    if (recurringConfig && recurringConfig.enabled) {
      const { title, time_unit, event_on } = recurringConfig
      if (!title || title.trim() === '') {
        showAlert('Please enter a title for the recurring expense', 'warning')
        return
      }
      if (
        (time_unit === 'Week' || time_unit === 'Month') &&
        (!event_on || event_on.trim() === '')
      ) {
        showAlert(
          `Please select at least one day for ${time_unit.toLowerCase()}ly recurring expenses`,
          'warning'
        )
        return
      }
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

      // Format date for API
      const formattedDate = formatDateForAPI(paymentDate)

      // Build category-specific payload
      const category = CATEGORY_MAP[selectedIndex ?? 0]

      const response = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          expense_type: expenseType.type,
          description: description.trim() || null,
          charges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          recurring_config: recurringConfig,
          // Category-specific fields
          ...(selectedIndex === 0 && {
            property_id: selectedPropertyId,
            lease_id: selectedLeaseId
          }),
          ...(selectedIndex === 1 && {
            contract_id: selectedContractId
          }),
          ...(selectedIndex === 4 && {
            is_asset: isAsset,
            depreciation_percentage: isAsset && expenseType.type === 'Miscellaneous_Others'
              ? depreciationPercentage
              : null
          })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create expense')
      }

      await response.json()
      FeedbackToasts.created('Expense created successfully!')
      setTimeout(() => {
        window.location.href = '/expenses'
      }, 1500)
    } catch (error: any) {
      console.error('Error creating expense:', error)
      FeedbackToasts.createFailed('expense', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form state when category changes
  useEffect(() => {
    const types = EXPENSE_TYPES_MAP[selectedIndex ?? 0] ?? propertyExpenseTypes
    setExpenseType(types[0])
    setSelectedPropertyId(null)
    setSelectedLeaseId(null)
    setSelectedContractId(null)
    setIsAsset(false)
    setDepreciationPercentage('')
  }, [selectedIndex])

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties?fields=id,code&includeProject=true')
        if (!response.ok) throw new Error('Failed to fetch properties')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.properties.map((p: any) => ({
          id: p.id,
          label: p.code,
          subtitle: p.projects?.title || 'No project'
        }))
        setPropertyItems(items)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchProperties()
  }, [])

  // Fetch contracts when Contract Related is selected
  useEffect(() => {
    if (selectedIndex !== 1) return

    const fetchContracts = async () => {
      setLoadingContracts(true)
      try {
        const response = await fetch('/api/contracts')
        if (!response.ok) throw new Error('Failed to fetch contracts')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.contracts.map((c: any) => ({
          id: c.id,
          label: c.contract_id,
          subtitle: `${c.owners ? `${c.owners.first_name} ${c.owners.last_name || ''}`.trim() : 'No owner'} - ${c.properties?.code || 'No property'}`
        }))
        setContractItems(items)
      } catch (error) {
        console.error('Error fetching contracts:', error)
      } finally {
        setLoadingContracts(false)
      }
    }

    fetchContracts()
  }, [selectedIndex])

  // Fetch leases when a property is selected (for Property Related)
  useEffect(() => {
    if (selectedIndex !== 0 || !selectedPropertyId) {
      setLeaseItems([])
      setSelectedLeaseId(null)
      return
    }

    const fetchLeases = async () => {
      setLoadingLeases(true)
      try {
        const response = await fetch(`/api/leases?propertyId=${selectedPropertyId}`)
        if (!response.ok) throw new Error('Failed to fetch leases')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.leases.map((l: any) => ({
          id: l.id,
          label: l.reference_id,
          subtitle: l.tenant
            ? `${l.tenant.first_name} ${l.tenant.last_name || ''}`.trim()
            : 'No tenant'
        }))
        setLeaseItems(items)
      } catch (error) {
        console.error('Error fetching leases:', error)
      } finally {
        setLoadingLeases(false)
      }
    }

    fetchLeases()
  }, [selectedIndex, selectedPropertyId])

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      <AddPageHead
        crumb_items={[
          { label: 'Expenses', href: '/expenses' },
          { label: 'Add Expense' }
        ]}
        title='Add an expense'
        subtitle='Add a new expense you have covered'
        className='mb-7.5'
        isSubmitting={isSubmitting}
      />

      <InnerSection title='Basic Details' subtitle='Expense Basic Details'>
        <div className='inputs-container'>
          {options.map((option, index) => (
            <Option
              key={index}
              Icon={option.Icon}
              label={option.label}
              isSelected={option.isSelected}
              disabled={option.isDisabled || index === 2}
              onClick={() => {
                if (index !== 2) selectByIndex(index)
              }}
            />
          ))}
        </div>

        <div className='inputs-container'>
          {/* Property selector — Property Related only */}
          {selectedIndex === 0 && (
            <InputGroup label='Property' isRequired>
              <Combobox
                items={propertyItems}
                variant='single'
                searchPlaceholder='Search properties'
                placeholder={loadingProperties ? 'Loading properties...' : 'Select a property'}
                isLoading={loadingProperties}
                loadingMessage='Fetching properties...'
                onValueChange={value => {
                  setSelectedPropertyId(value || null)
                }}
                required
              />
            </InputGroup>
          )}

          {/* Lease selector — Property Related only, optional, after property is selected */}
          {selectedIndex === 0 && selectedPropertyId && (
            <InputGroup label='Lease'>
              <Combobox
                items={leaseItems}
                variant='single'
                searchPlaceholder='Search leases'
                placeholder={loadingLeases ? 'Loading leases...' : 'Select a lease (optional)'}
                isLoading={loadingLeases}
                loadingMessage='Fetching leases...'
                onValueChange={value => {
                  setSelectedLeaseId(value || null)
                }}
              />
            </InputGroup>
          )}

          {/* Contract selector — Contract Related only */}
          {selectedIndex === 1 && (
            <InputGroup label='Contract' isRequired>
              <Combobox
                items={contractItems}
                variant='single'
                searchPlaceholder='Search contracts'
                placeholder={loadingContracts ? 'Loading contracts...' : 'Select a contract'}
                isLoading={loadingContracts}
                loadingMessage='Fetching contracts...'
                onValueChange={value => {
                  setSelectedContractId(value || null)
                }}
                required
              />
            </InputGroup>
          )}

          <InputGroup label='Expense Type'>
            <Select
              items={typesOfExpense}
              label='Types'
              placeholder='Select a type'
              value={expenseType.type}
              onValueChange={value => {
                const type = expenseTypes.find(et => et.type === value)
                if (type) setExpenseType(type)
              }}
            />
          </InputGroup>
        </div>

        {/* Description — all categories */}
        <InputGroup label='Description'>
          <Textarea
            placeholder='Enter a description (optional)'
            value={description}
            onChange={e => setDescription(e.target.value)}
            className='texts-body-small bg-(--background-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50 focus:border-neutral-400 border border-(--border-strong) transition-colors duration-200 rounded-[5] shadows-xs'
          />
        </InputGroup>

        {/* Purchase-specific fields */}
        {selectedIndex === 4 && (
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              <Checkbox
                checked={isAsset}
                onCheckedChange={(checked) => {
                  setIsAsset(checked === true)
                  if (!checked) setDepreciationPercentage('')
                }}
              />
              <label className='texts-label-large cursor-pointer' onClick={() => {
                setIsAsset(!isAsset)
                if (isAsset) setDepreciationPercentage('')
              }}>
                This is an asset
              </label>
            </div>

            {/* Depreciation percentage — only when is_asset AND Miscellaneous_Others type */}
            {isAsset && expenseType.type === 'Miscellaneous_Others' && (
              <InputGroup label='Depreciation Percentage' isRequired>
                <Input
                  type='number'
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder='e.g. 10.00'
                  value={depreciationPercentage}
                  onChange={e => setDepreciationPercentage((e.target as HTMLInputElement).value)}
                  note='Annual depreciation rate for this asset (%)'
                  required
                />
              </InputGroup>
            )}
          </div>
        )}

        {/* Info note — shown when property is selected (Property Related only) */}
        {selectedIndex === 0 && selectedPropertyId && (
          <div className='mt-3 p-3 rounded-md bg-blue-50 border border-blue-200'>
            <div className='flex items-center gap-2 text-sm text-blue-800'>
              <Info strokeWidth={1.5} size={20} />
              This expense will be recorded for property{' '}
              <span className='font-semibold'>
                {propertyItems.find(p => p.id === selectedPropertyId)?.label || 'property'}
              </span>
              {propertyItems.find(p => p.id === selectedPropertyId)?.subtitle && (
                <> in <span className='font-semibold'>
                  {propertyItems.find(p => p.id === selectedPropertyId)?.subtitle}
                </span></>
              )}
            </div>
          </div>
        )}
      </InnerSection>

      {/* Charges Section */}
      <ChargesSection
        flowType='outcome'
        selectable={selectable}
        onChargesChange={setCharges}
      />

      {/* Payment Details */}
      <div className='flex flex-col gap-5'>
        <InputGroup label='Payment Status'>
          <RadioGroup
            defaultOption={1}
            options={['Paid', 'Not Paid']}
            onChange={(value: number) => {
              if (value === 0) {
                setIsPaid(true)
              } else {
                setIsPaid(false)
              }
            }}
          />
        </InputGroup>

        <div className={cn('flex')}>
          <InputGroup
            label='Payment Method'
            className={cn(isPaid ? 'max-w-full mr-3' : 'max-w-0! opacity-0')}
            isRequired
          >
            <Select
              items={['Cash', 'Bank Transfer']}
              value={paymentMethod}
              onChange={setPaymentMethod}
              label='Methods'
              placeholder='Select method'
              required
            />
          </InputGroup>
          <InputGroup
            label={`${isPaid ? '' : 'Due'} Payment Date`}
            className='mr-3'
            isRequired
          >
            <DatePicker value={paymentDate} onValueChange={setPaymentDate} />
          </InputGroup>
          <InputGroup label={`${isPaid ? '' : 'Due'} Payment Time`} isRequired>
            <TimePicker
              value={paymentTime}
              onValueChange={setPaymentTime}
              required
            />
          </InputGroup>
        </div>

        <div
          className={cn(
            'trnasition-all duration-200 ease-out overflow-hidden',
            isPaid && paymentMethod === 'Bank Transfer'
              ? receiptFile
                ? 'h-19'
                : 'h-49'
              : 'h-0 opacity-0'
          )}
        >
          <UploadFile onFileChange={setReceiptFile} />
        </div>
      </div>

      {/* Alert Dialog */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </form>
  )
}

export default AddExpense
