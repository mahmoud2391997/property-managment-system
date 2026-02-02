'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import Combobox from '@/components/costume-ui/combobox'
import DatePicker from '@/components/costume-ui/date-picker'
import MonthPicker from '@/components/costume-ui/month-picker'
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
  purchaseExpenseTypes,
  staffExpenseTypes
} from '@/utils/data'
import { formatPaymentTypeLabel } from '@/utils/functions'
import { formatCurrency } from '@/utils/formatCurrency'
import { House, FileText, User, Building2, ShoppingCart, Info, Plus, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
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
  2: staffExpenseTypes,
  3: companyExpenseTypes,
  4: purchaseExpenseTypes
}

type Deduction = { title: string; amount: string }
type Allowance = { title: string; amount: string }

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
      isDisabled: false
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

  // Staff-specific state
  const [staffItems, setStaffItems] = useState<ComboBoxitemsType[]>([])
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [staffMonth, setStaffMonth] = useState<Date | undefined>(undefined)
  const [grossSalary, setGrossSalary] = useState<string>('')
  const [epfEmployer, setEpfEmployer] = useState<string>('')
  const [socsoEmployer, setSocsoEmployer] = useState<string>('')
  const [epfEmployee, setEpfEmployee] = useState<string>('')
  const [socsoEmployee, setSocsoEmployee] = useState<string>('')
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [allowances, setAllowances] = useState<Allowance[]>([])

  // For contract related
  const selectable: boolean = expenseType === expenseTypes[0] && selectedIndex === 1

  // Derived: is this a staff salary type?
  const isStaffSalary = selectedIndex === 2 && expenseType.type === 'Salary'
  const isStaffAllowances = selectedIndex === 2 && expenseType.type === 'Allowances'
  // Miscellaneous_Others uses regular ChargesSection

  // Salary summary calculations
  const salarySummary = useMemo(() => {
    const gross = parseFloat(grossSalary) || 0
    const epfEr = parseFloat(epfEmployer) || 0
    const socsoEr = parseFloat(socsoEmployer) || 0
    const epfEe = parseFloat(epfEmployee) || 0
    const socsoEe = parseFloat(socsoEmployee) || 0
    const totalCustomDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

    const totalDeductions = epfEe + socsoEe + totalCustomDeductions
    const netSalary = gross - totalDeductions
    const costToCompany = gross + epfEr + socsoEr

    return { gross, epfEr, socsoEr, epfEe, socsoEe, totalCustomDeductions, totalDeductions, netSalary, costToCompany }
  }, [grossSalary, epfEmployer, socsoEmployer, epfEmployee, socsoEmployee, deductions])

  // Allowance summary
  const allowancesTotal = useMemo(() => {
    return allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  }, [allowances])

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
    if (selectedIndex === 0 && expenseType.type === 'Refund' && !selectedLeaseId) {
      showAlert('Please select a lease', 'warning')
      return
    }

    if (selectedIndex === 0 && expenseType.type !== 'Refund' && !selectedPropertyId) {
      showAlert('Please select a property', 'warning')
      return
    }

    if (selectedIndex === 1 && !selectedContractId) {
      showAlert('Please select a contract', 'warning')
      return
    }

    // Staff validation
    if (selectedIndex === 2) {
      if (!selectedStaffId) {
        showAlert('Please select a staff member', 'warning')
        return
      }

      if (!staffMonth) {
        showAlert('Please select a month', 'warning')
        return
      }

      if (isStaffSalary) {
        if (!grossSalary || parseFloat(grossSalary) <= 0) {
          showAlert('Please enter gross salary', 'warning')
          return
        }
        if (!epfEmployer) {
          showAlert('Please enter EPF (Employer)', 'warning')
          return
        }
        if (!socsoEmployer) {
          showAlert('Please enter SOCSO (Employer)', 'warning')
          return
        }
        if (!epfEmployee) {
          showAlert('Please enter EPF (Employee)', 'warning')
          return
        }
        if (!socsoEmployee) {
          showAlert('Please enter SOCSO (Employee)', 'warning')
          return
        }
        if (salarySummary.totalDeductions > salarySummary.gross) {
          showAlert('Total deductions cannot exceed gross salary', 'error')
          return
        }
      }

      if (isStaffAllowances && allowances.length === 0) {
        showAlert('Please add at least one allowance', 'warning')
        return
      }
    }

    // Non-staff: require charges
    if (selectedIndex !== 2 && charges.length === 0) {
      showAlert('Please add at least one charge', 'warning')
      return
    }

    // Staff Miscellaneous_Others: require charges
    if (selectedIndex === 2 && !isStaffSalary && !isStaffAllowances && charges.length === 0) {
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

      // Build charges for staff
      let finalCharges = charges
      if (isStaffSalary) {
        // Custom deductions become charges
        finalCharges = deductions
          .filter(d => d.title.trim() && parseFloat(d.amount) > 0)
          .map(d => ({
            type: d.title,
            amount: d.amount,
            isTaxableChecked: false
          }))
      } else if (isStaffAllowances) {
        finalCharges = allowances
          .filter(a => a.title.trim() && parseFloat(a.amount) > 0)
          .map(a => ({
            type: a.title,
            amount: a.amount,
            isTaxableChecked: false
          }))
      }

      const response = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          expense_type: expenseType.type,
          description: description.trim() || null,
          charges: finalCharges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          recurring_config: recurringConfig,
          timezone_offset: new Date().getTimezoneOffset(),
          // Category-specific fields
          ...(selectedIndex === 0 && expenseType.type !== 'Refund' && {
            property_id: selectedPropertyId,
          }),
          ...(selectedIndex === 0 && expenseType.type === 'Refund' && {
            lease_id: selectedLeaseId,
          }),
          ...(selectedIndex === 1 && {
            contract_id: selectedContractId
          }),
          ...(selectedIndex === 2 && {
            staff_id: selectedStaffId,
            staff_month: staffMonth ? formatDateForAPI(staffMonth) : null,
            ...(isStaffSalary && {
              gross_salary: grossSalary,
              epf_employer: epfEmployer,
              socso_employer: socsoEmployer,
              epf_employee: epfEmployee,
              socso_employee: socsoEmployee
            })
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
    // Reset staff state
    setSelectedStaffId(null)
    setStaffMonth(undefined)
    setGrossSalary('')
    setEpfEmployer('')
    setSocsoEmployer('')
    setEpfEmployee('')
    setSocsoEmployee('')
    setDeductions([])
    setAllowances([])
  }, [selectedIndex])

  // Reset staff salary/allowance state when expense type changes within Staff
  useEffect(() => {
    if (selectedIndex === 2) {
      setGrossSalary('')
      setEpfEmployer('')
      setSocsoEmployer('')
      setEpfEmployee('')
      setSocsoEmployee('')
      setDeductions([])
      setAllowances([])
    }
  }, [expenseType.type])

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
          label: c.reference_id,
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

  // Fetch staff when Staff Related is selected
  useEffect(() => {
    if (selectedIndex !== 2) return

    const fetchStaff = async () => {
      setLoadingStaff(true)
      try {
        const response = await fetch('/api/staff?select=id,first_name,last_name')
        if (!response.ok) throw new Error('Failed to fetch staff')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.staff.map((s: any) => ({
          id: s.id,
          label: `${s.first_name} ${s.last_name || ''}`.trim()
        }))
        setStaffItems(items)
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setLoadingStaff(false)
      }
    }

    fetchStaff()
  }, [selectedIndex])

  // Fetch all active leases when Property Related + Refund type is selected
  useEffect(() => {
    if (selectedIndex !== 0 || expenseType.type !== 'Refund') {
      setLeaseItems([])
      setSelectedLeaseId(null)
      return
    }

    const fetchLeases = async () => {
      setLoadingLeases(true)
      try {
        const response = await fetch('/api/leases?all=true')
        if (!response.ok) throw new Error('Failed to fetch leases')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.leases.map((l: any) => ({
          id: l.id,
          label: l.reference_id,
          subtitle: l.room
            ? `${l.property?.code || 'Unknown'} (${l.room.title})`
            : l.property?.code || 'No property'
        }))
        setLeaseItems(items)
      } catch (error) {
        console.error('Error fetching leases:', error)
      } finally {
        setLoadingLeases(false)
      }
    }

    fetchLeases()
  }, [selectedIndex, expenseType.type])

  // Clamp a value so it doesn't exceed gross salary
  const clampToGross = (newValue: string): string => {
    const gross = parseFloat(grossSalary) || 0
    if (gross <= 0) return newValue
    const val = parseFloat(newValue) || 0
    return val > gross ? gross.toFixed(2) : newValue
  }

  // Clamp employee deduction so total employee deductions don't exceed gross
  const clampEmployeeDeduction = (
    newValue: string,
    excludeField: 'epfEe' | 'socsoEe' | number
  ): string => {
    const gross = parseFloat(grossSalary) || 0
    if (gross <= 0) return newValue
    const val = parseFloat(newValue) || 0
    const epfEe = excludeField === 'epfEe' ? 0 : (parseFloat(epfEmployee) || 0)
    const socsoEe = excludeField === 'socsoEe' ? 0 : (parseFloat(socsoEmployee) || 0)
    const customTotal = deductions.reduce((sum, d, i) => {
      if (typeof excludeField === 'number' && excludeField === i) return sum
      return sum + (parseFloat(d.amount) || 0)
    }, 0)
    const remaining = gross - epfEe - socsoEe - customTotal
    return val > remaining ? (remaining > 0 ? remaining.toFixed(2) : '') : newValue
  }

  // Deduction helpers
  const addDeduction = () => setDeductions(prev => [...prev, { title: '', amount: '' }])
  const removeDeduction = (index: number) => setDeductions(prev => prev.filter((_, i) => i !== index))
  const updateDeduction = (index: number, field: keyof Deduction, value: string) => {
    setDeductions(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  // Allowance helpers
  const addAllowance = () => setAllowances(prev => [...prev, { title: '', amount: '' }])
  const removeAllowance = (index: number) => setAllowances(prev => prev.filter((_, i) => i !== index))
  const updateAllowance = (index: number, field: keyof Allowance, value: string) => {
    setAllowances(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

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
              disabled={option.isDisabled}
              onClick={() => selectByIndex(index)}
            />
          ))}
        </div>

        <div className='inputs-container'>
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

          {/* Property selector — Property Related, non-Refund types only */}
          {selectedIndex === 0 && expenseType.type !== 'Refund' && (
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

          {/* Lease selector — Property Related, Refund type only */}
          {selectedIndex === 0 && expenseType.type === 'Refund' && (
            <InputGroup label='Lease' isRequired>
              <Combobox
                items={leaseItems}
                variant='single'
                searchPlaceholder='Search leases'
                placeholder={loadingLeases ? 'Loading leases...' : 'Select an active lease'}
                isLoading={loadingLeases}
                loadingMessage='Fetching leases...'
                onValueChange={value => {
                  setSelectedLeaseId(value || null)
                }}
                required
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

          {/* Staff selector + month — Staff Related */}
          {selectedIndex === 2 && (
            <>
              <InputGroup label='Staff Member' isRequired>
                <Combobox
                  items={staffItems}
                  variant='single'
                  searchPlaceholder='Search staff'
                  placeholder={loadingStaff ? 'Loading staff...' : 'Select a staff member'}
                  isLoading={loadingStaff}
                  loadingMessage='Fetching staff...'
                  onValueChange={value => {
                    setSelectedStaffId(value || null)
                  }}
                  required
                />
              </InputGroup>
              <InputGroup label='Month' isRequired>
                <MonthPicker value={staffMonth} onValueChange={setStaffMonth} />
              </InputGroup>
            </>
          )}
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

        {/* Info note — Property Related only */}
        {selectedIndex === 0 && expenseType.type === 'Refund' && selectedLeaseId && (
          <div className='mt-3 p-3 rounded-md bg-blue-50 border border-blue-200'>
            <div className='flex items-center gap-2 text-sm text-blue-800'>
              <Info strokeWidth={1.5} size={20} />
              This expense will be linked to lease{' '}
              <span className='font-semibold'>
                {leaseItems.find(l => l.id === selectedLeaseId)?.label || 'lease'}
              </span>
              {leaseItems.find(l => l.id === selectedLeaseId)?.subtitle && (
                <> — <span className='font-semibold'>
                  {leaseItems.find(l => l.id === selectedLeaseId)?.subtitle}
                </span></>
              )}
            </div>
          </div>
        )}
        {selectedIndex === 0 && expenseType.type !== 'Refund' && selectedPropertyId && (
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

      {/* Staff Salary Section */}
      {isStaffSalary && (
        <InnerSection title='Salary Breakdown' subtitle='Enter salary components and deductions'>
          {/* Gross Salary */}
          <InputGroup label='Gross Salary' isRequired>
            <Input
              currency
              placeholder='0.00'
              value={grossSalary}
              onValueChange={(value) => setGrossSalary(value || '')}
              required
            />
          </InputGroup>

          {/* Employer Contributions */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <InputGroup label='EPF (Employer)' isRequired>
              <Input
                currency
                placeholder='0.00'
                value={epfEmployer}
                onValueChange={(value) => setEpfEmployer(clampToGross(value || ''))}
                required
              />
            </InputGroup>
            <InputGroup label='SOCSO (Employer)' isRequired>
              <Input
                currency
                placeholder='0.00'
                value={socsoEmployer}
                onValueChange={(value) => setSocsoEmployer(clampToGross(value || ''))}
                required
              />
            </InputGroup>
          </div>

          {/* Employee Deductions */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <InputGroup label='EPF (Employee)' isRequired>
              <Input
                currency
                placeholder='0.00'
                value={epfEmployee}
                onValueChange={(value) => setEpfEmployee(clampEmployeeDeduction(value || '', 'epfEe'))}
                required
              />
            </InputGroup>
            <InputGroup label='SOCSO (Employee)' isRequired>
              <Input
                currency
                placeholder='0.00'
                value={socsoEmployee}
                onValueChange={(value) => setSocsoEmployee(clampEmployeeDeduction(value || '', 'socsoEe'))}
                required
              />
            </InputGroup>
          </div>

          {/* Custom Deductions */}
          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <span className='texts-label-large'>Deductions</span>
              <button
                type='button'
                onClick={addDeduction}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'texts-caption-large font-medium',
                  'bg-(--secondary-color)/10 text-(--secondary-color)',
                  'hover:bg-(--secondary-color)/20 transition-colors cursor-pointer'
                )}
              >
                <Plus size={14} />
                Add Deduction
              </button>
            </div>

            {deductions.map((deduction, index) => (
              <div key={index} className='flex items-start gap-3'>
                <div className='flex-1'>
                  <Input
                    placeholder='Deduction title'
                    value={deduction.title}
                    onChange={e => updateDeduction(index, 'title', (e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className='w-48'>
                  <Input
                    currency
                    placeholder='0.00'
                    value={deduction.amount}
                    onValueChange={(value) => updateDeduction(index, 'amount', clampEmployeeDeduction(value || '', index))}
                  />
                </div>
                <button
                  type='button'
                  onClick={() => removeDeduction(index)}
                  className='mt-2.5 p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer'
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {deductions.length === 0 && (
              <p className='texts-caption-large text-(--text-tertiary)'>No additional deductions</p>
            )}
          </div>

          {/* Salary Summary */}
          {salarySummary.gross > 0 && (
            <div className='rounded-lg border border-(--border-default) overflow-hidden'>
              <div className='bg-neutral-50 px-4 py-3 border-b border-(--border-default)'>
                <span className='texts-body-medium-semibold text-(--text-primary)'>Summary</span>
              </div>
              <div className='px-4 py-3 flex flex-col gap-2.5'>
                {/* Gross */}
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Gross Salary</span>
                  <span className='texts-body-small-medium'>{formatCurrency(salarySummary.gross)}</span>
                </div>

                {/* Employee Deductions */}
                {(salarySummary.epfEe > 0 || salarySummary.socsoEe > 0 || salarySummary.totalCustomDeductions > 0) && (
                  <>
                    <div className='border-t border-dashed border-(--border-default) my-0.5' />
                    <span className='texts-caption-large text-(--text-tertiary) uppercase tracking-wide'>Employee Deductions</span>
                    {salarySummary.epfEe > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>EPF (Employee)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(salarySummary.epfEe)}</span>
                      </div>
                    )}
                    {salarySummary.socsoEe > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>SOCSO (Employee)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(salarySummary.socsoEe)}</span>
                      </div>
                    )}
                    {deductions.filter(d => parseFloat(d.amount) > 0).map((d, i) => (
                      <div key={i} className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>{d.title || 'Untitled'}</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(parseFloat(d.amount) || 0)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Net Salary */}
                <div className='border-t border-(--border-default) pt-2.5'>
                  <div className='flex items-center justify-between'>
                    <span className='texts-body-medium-semibold text-(--text-primary)'>Salary Received</span>
                    <span className={cn(
                      'texts-body-medium-semibold',
                      salarySummary.netSalary < 0 ? 'text-red-600' : 'text-(--success-dark)'
                    )}>
                      {formatCurrency(salarySummary.netSalary)}
                    </span>
                  </div>
                </div>

                {/* Employer Contributions */}
                {(salarySummary.epfEr > 0 || salarySummary.socsoEr > 0) && (
                  <>
                    <div className='border-t border-dashed border-(--border-default) my-0.5' />
                    <span className='texts-caption-large text-(--text-tertiary) uppercase tracking-wide'>Employer Contributions</span>
                    {salarySummary.epfEr > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>EPF (Employer)</span>
                        <span className='texts-body-small'>{formatCurrency(salarySummary.epfEr)}</span>
                      </div>
                    )}
                    {salarySummary.socsoEr > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>SOCSO (Employer)</span>
                        <span className='texts-body-small'>{formatCurrency(salarySummary.socsoEr)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Cost to Company */}
                <div className='border-t border-(--border-default) pt-2.5'>
                  <div className='flex items-center justify-between'>
                    <span className='texts-body-medium-semibold text-(--text-primary)'>Cost to Company</span>
                    <span className='texts-body-medium-semibold text-(--text-primary)'>
                      {formatCurrency(salarySummary.costToCompany)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deduction exceeds gross warning */}
          {salarySummary.gross > 0 && salarySummary.totalDeductions > salarySummary.gross && (
            <div className='p-3 rounded-md bg-red-50 border border-red-200'>
              <div className='flex items-center gap-2 text-sm text-red-800'>
                <Info strokeWidth={1.5} size={20} />
                Total deductions ({formatCurrency(salarySummary.totalDeductions)}) exceed gross salary ({formatCurrency(salarySummary.gross)})
              </div>
            </div>
          )}
        </InnerSection>
      )}

      {/* Staff Allowances Section */}
      {isStaffAllowances && (
        <InnerSection title='Allowances' subtitle='Add allowance items for this staff member'>
          <div className='flex flex-col gap-3'>
            {allowances.map((allowance, index) => (
              <div key={index} className='flex items-start gap-3'>
                <div className='flex-1'>
                  <Input
                    placeholder='Allowance title'
                    value={allowance.title}
                    onChange={e => updateAllowance(index, 'title', (e.target as HTMLInputElement).value)}
                    required
                  />
                </div>
                <div className='w-48'>
                  <Input
                    currency
                    placeholder='0.00'
                    value={allowance.amount}
                    onValueChange={(value) => updateAllowance(index, 'amount', value || '')}
                    required
                  />
                </div>
                <button
                  type='button'
                  onClick={() => removeAllowance(index)}
                  className='mt-2.5 p-1 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer'
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <button
              type='button'
              onClick={addAllowance}
              className={cn(
                'flex items-center justify-center gap-1.5 py-3 rounded-md border border-dashed',
                'texts-body-small-medium',
                'border-(--border-strong) text-(--text-secondary)',
                'hover:border-(--secondary-color) hover:text-(--secondary-color) hover:bg-(--secondary-color)/5',
                'transition-colors cursor-pointer'
              )}
            >
              <Plus size={16} />
              Add Allowance
            </button>

            {/* Allowance Total */}
            {allowancesTotal > 0 && (
              <div className='rounded-lg border border-(--border-default) px-4 py-3'>
                <div className='flex items-center justify-between'>
                  <span className='texts-body-medium-semibold text-(--text-primary)'>Total Allowances</span>
                  <span className='texts-body-medium-semibold text-(--text-primary)'>
                    {formatCurrency(allowancesTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </InnerSection>
      )}

      {/* Charges Section — non-staff, or staff Miscellaneous_Others */}
      {(selectedIndex !== 2 || (!isStaffSalary && !isStaffAllowances)) && (
        <ChargesSection
          flowType='outcome'
          selectable={selectable}
          onChargesChange={setCharges}
        />
      )}

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
