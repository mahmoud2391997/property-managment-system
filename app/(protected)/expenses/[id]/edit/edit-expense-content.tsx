'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import type { DefaultCharge } from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import Combobox from '@/components/costume-ui/combobox'
import MonthPicker from '@/components/costume-ui/month-picker'
import Input from '@/components/costume-ui/input'
import InputGroup from '@/components/costume-ui/input-group'
import Option from '@/components/costume-ui/option'
import Select from '@/components/costume-ui/select'
import Alert from '@/components/costume-ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
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
import { useRouter } from 'next/navigation'
import type { EditExpenseData } from './page'

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

type Props = {
  expense: EditExpenseData
}

export default function EditExpenseContent({ expense }: Props) {
  const router = useRouter()

  // Determine category index
  const categoryIndex = CATEGORY_MAP.indexOf(expense.category as typeof CATEGORY_MAP[number])

  // Get the current expense type from the category-specific data
  const getCurrentType = (): string => {
    if (expense.property_expense) return expense.property_expense.type
    if (expense.contract_expense) return expense.contract_expense.type
    if (expense.company_expense) return expense.company_expense.type
    if (expense.purchase_expense) return expense.purchase_expense.type
    if (expense.staff_expense) return expense.staff_expense.type
    return ''
  }

  const currentType = getCurrentType()

  // Build type options based on constraints
  const getTypeOptions = (): { label: string; value: string }[] => {
    const allTypes = EXPENSE_TYPES_MAP[categoryIndex] ?? []

    if (expense.category === 'Staff_Related') {
      // Staff: type locked
      return [{ label: formatPaymentTypeLabel(currentType), value: currentType }]
    }

    if (expense.category === 'Property_Related') {
      if (currentType === 'Refund') {
        // Refund locked
        return [{ label: formatPaymentTypeLabel('Refund'), value: 'Refund' }]
      }
      // Non-refund: show all except Refund
      return allTypes
        .filter(t => t.type !== 'Refund')
        .map(t => ({ label: formatPaymentTypeLabel(t.type), value: t.type }))
    }

    return allTypes.map(t => ({ label: formatPaymentTypeLabel(t.type), value: t.type }))
  }

  const typeOptions = getTypeOptions()
  const isTypeLocked = expense.category === 'Staff_Related' || (expense.category === 'Property_Related' && currentType === 'Refund')

  // Form state
  const allExpenseTypes = EXPENSE_TYPES_MAP[categoryIndex] ?? []
  const [expenseType, setExpenseType] = useState<string>(currentType)
  const [description, setDescription] = useState<string>(expense.description || '')

  // Property related
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(expense.property_expense?.property_id || null)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(expense.property_expense?.lease_id || null)
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false)
  const [loadingLeases, setLoadingLeases] = useState<boolean>(false)
  const [propertyItems, setPropertyItems] = useState<ComboBoxitemsType[]>([])
  const [leaseItems, setLeaseItems] = useState<ComboBoxitemsType[]>([])

  // Contract related (locked)
  const selectedContractId = expense.contract_expense?.contract_id || null

  // Staff related
  const [staffItems, setStaffItems] = useState<ComboBoxitemsType[]>([])
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false)
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(expense.staff_expense?.staff_id || null)
  const [staffMonth, setStaffMonth] = useState<Date | undefined>(
    expense.staff_expense ? new Date(expense.staff_expense.month) : undefined
  )
  const [grossSalary, setGrossSalary] = useState<string>(expense.staff_expense?.gross_salary?.toString() || '')
  const [epfEmployer, setEpfEmployer] = useState<string>(expense.staff_expense?.epf_employer?.toString() || '')
  const [socsoEmployer, setSocsoEmployer] = useState<string>(expense.staff_expense?.socso_employer?.toString() || '')
  const [epfEmployee, setEpfEmployee] = useState<string>(expense.staff_expense?.epf_employee?.toString() || '')
  const [socsoEmployee, setSocsoEmployee] = useState<string>(expense.staff_expense?.socso_employee?.toString() || '')
  const [tax, setTax] = useState<string>(expense.staff_expense?.tax?.toString() || '')
  const [deductions, setDeductions] = useState<Deduction[]>(
    expense.deduction_charges.map(d => ({ title: d.title, amount: d.amount.toString() }))
  )
  const [allowances, setAllowances] = useState<Allowance[]>(
    // For staff expenses (Salary or Allowances type), charges are the allowances
    expense.category === 'Staff_Related' && (currentType === 'Allowances' || currentType === 'Salary')
      ? expense.charges.map(c => ({ title: c.title, amount: c.amount.toString() }))
      : []
  )

  // Purchase related
  const [isAsset, setIsAsset] = useState<boolean>(expense.purchase_expense?.is_asset || false)
  const [depreciationPercentage, setDepreciationPercentage] = useState<string>(
    expense.purchase_expense?.depreciation_percentage?.toString() || ''
  )
  const [purchasePropertyId, setPurchasePropertyId] = useState<string | null>(
    expense.purchase_expense?.property_id || null
  )
  const [purchasePropertyItems, setPurchasePropertyItems] = useState<ComboBoxitemsType[]>([])
  const [loadingPurchaseProperties, setLoadingPurchaseProperties] = useState<boolean>(false)

  // Charges for non-staff categories (or staff non-salary/non-allowances)
  const [charges, setCharges] = useState<any[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derived flags
  const isStaffSalary = expense.category === 'Staff_Related' && currentType === 'Salary'
  const isStaffAllowances = expense.category === 'Staff_Related' && currentType === 'Allowances'
  const isRefund = expense.category === 'Property_Related' && currentType === 'Refund'

  // Salary summary
  const salarySummary = useMemo(() => {
    const gross = parseFloat(grossSalary) || 0
    const epfEr = parseFloat(epfEmployer) || 0
    const socsoEr = parseFloat(socsoEmployer) || 0
    const epfEe = parseFloat(epfEmployee) || 0
    const socsoEe = parseFloat(socsoEmployee) || 0
    const taxAmount = parseFloat(tax) || 0
    const totalCustomDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

    const totalDeductions = epfEe + socsoEe + taxAmount + totalCustomDeductions
    const netSalary = gross - totalDeductions
    const costToCompany = gross + epfEr + socsoEr

    return { gross, epfEr, socsoEr, epfEe, socsoEe, taxAmount, totalCustomDeductions, totalDeductions, netSalary, costToCompany }
  }, [grossSalary, epfEmployer, socsoEmployer, epfEmployee, socsoEmployee, tax, deductions])

  // Allowance total
  const allowancesTotal = useMemo(() => {
    return allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  }, [allowances])

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('info')

  const showAlert = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Clamp helpers
  const clampToGross = (newValue: string): string => {
    const gross = parseFloat(grossSalary) || 0
    if (gross <= 0) return newValue
    const val = parseFloat(newValue) || 0
    return val > gross ? gross.toFixed(2) : newValue
  }

  const clampEmployeeDeduction = (
    newValue: string,
    excludeField: 'epfEe' | 'socsoEe' | 'tax' | number
  ): string => {
    const gross = parseFloat(grossSalary) || 0
    if (gross <= 0) return newValue
    const val = parseFloat(newValue) || 0
    const epfEe = excludeField === 'epfEe' ? 0 : (parseFloat(epfEmployee) || 0)
    const socsoEe = excludeField === 'socsoEe' ? 0 : (parseFloat(socsoEmployee) || 0)
    const taxAmount = excludeField === 'tax' ? 0 : (parseFloat(tax) || 0)
    const customTotal = deductions.reduce((sum, d, i) => {
      if (typeof excludeField === 'number' && excludeField === i) return sum
      return sum + (parseFloat(d.amount) || 0)
    }, 0)
    const remaining = gross - epfEe - socsoEe - taxAmount - customTotal
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

  // Default charges for ChargesSection
  const defaultCharges: DefaultCharge[] | undefined = (
    !isStaffSalary && !isStaffAllowances && expense.charges.length > 0
  ) ? expense.charges.map(c => ({
    type: c.title,
    amount: c.amount,
    is_taxed: c.is_taxed,
    is_refundable: c.is_refunded
  })) : undefined

  // Fetch properties
  useEffect(() => {
    if (expense.category !== 'Property_Related' || isRefund) return

    const fetchProperties = async () => {
      setLoadingProperties(true)
      try {
        const response = await fetch('/api/properties')
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

  // Fetch leases for refund
  useEffect(() => {
    if (expense.category !== 'Property_Related' || !isRefund) return

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
  }, [])

  // Fetch properties for purchases
  useEffect(() => {
    if (expense.category !== 'Purchase_Related') return

    const fetchProperties = async () => {
      setLoadingPurchaseProperties(true)
      try {
        const response = await fetch('/api/properties')
        if (!response.ok) throw new Error('Failed to fetch properties')
        const data = await response.json()
        const items: ComboBoxitemsType[] = data.properties.map((p: any) => ({
          id: p.id,
          label: p.code,
          subtitle: p.projects?.title || 'No project'
        }))
        setPurchasePropertyItems(items)
      } catch (error) {
        console.error('Error fetching properties:', error)
      } finally {
        setLoadingPurchaseProperties(false)
      }
    }

    fetchProperties()
  }, [])

  // Fetch staff
  useEffect(() => {
    if (expense.category !== 'Staff_Related') return

    const fetchStaff = async () => {
      setLoadingStaff(true)
      try {
        const response = await fetch('/api/staff')
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
  }, [])

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (expense.category === 'Property_Related' && isRefund && !selectedLeaseId) {
      showAlert('Please select a lease', 'warning')
      return
    }
    if (expense.category === 'Property_Related' && !isRefund && !selectedPropertyId) {
      showAlert('Please select a property', 'warning')
      return
    }
    if (expense.category === 'Staff_Related' && !selectedStaffId) {
      showAlert('Please select a staff member', 'warning')
      return
    }
    if (expense.category === 'Staff_Related' && !staffMonth) {
      showAlert('Please select a month', 'warning')
      return
    }
    if (isStaffSalary && (!grossSalary || parseFloat(grossSalary) <= 0)) {
      showAlert('Gross salary is required', 'warning')
      return
    }
    if (isStaffAllowances && allowances.length === 0) {
      showAlert('At least one allowance is required', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      // Build charges payload
      // Allowances → charges table, Deductions → deduction_charges table
      let chargesPayload: any[] = []
      if (isStaffSalary || isStaffAllowances) {
        chargesPayload = allowances
          .filter(a => a.title && (parseFloat(a.amount) || 0) > 0)
          .map(a => ({
            type: a.title,
            amount: a.amount,
            isTaxableChecked: false,
            isRefundableChecked: false
          }))
      } else {
        chargesPayload = charges
      }

      const payload: any = {
        expense_type: expenseType,
        description,
        charges: chargesPayload,
        // Category-specific
        ...(expense.category === 'Property_Related' && !isRefund && {
          property_id: selectedPropertyId
        }),
        ...(expense.category === 'Property_Related' && isRefund && {
          lease_id: selectedLeaseId
        }),
        ...(expense.category === 'Staff_Related' && {
          staff_id: selectedStaffId,
          staff_month: staffMonth?.toISOString(),
          ...(isStaffSalary && {
            gross_salary: grossSalary,
            epf_employer: epfEmployer,
            socso_employer: socsoEmployer,
            epf_employee: epfEmployee,
            socso_employee: socsoEmployee,
            tax: (parseFloat(grossSalary) || 0) >= 3000 ? tax : '0',
            deduction_charges: deductions
          })
        }),
        ...(expense.category === 'Purchase_Related' && {
          is_asset: isAsset,
          depreciation_percentage: isAsset && expenseType === 'Miscellaneous_Others'
            ? depreciationPercentage
            : null,
          property_id: purchasePropertyId
        })
      }

      const response = await fetch(`/api/expenses/${expense.reference_id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update expense')
      }

      FeedbackToasts.updated('Expense')
      router.push(`/expenses/${expense.reference_id}`)
    } catch (error: any) {
      console.error('Error updating expense:', error)
      showAlert(error.message || 'Failed to update expense', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Category options (all disabled, current one highlighted)
  const categoryOptions = [
    { Icon: House, label: 'Property Related' },
    { Icon: FileText, label: 'Contract Related' },
    { Icon: User, label: 'Staff Related' },
    { Icon: Building2, label: 'Company Related' },
    { Icon: ShoppingCart, label: 'Purchase Related' }
  ]

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      <AddPageHead
        crumb_items={[
          { label: 'Expenses', href: '/expenses' },
          { label: expense.reference_id, href: `/expenses/${expense.reference_id}` },
          { label: 'Edit' }
        ]}
        title='Edit expense'
        subtitle={`Editing ${expense.reference_id}`}
        className='mb-7.5'
        isSubmitting={isSubmitting}
      />

      <InnerSection title='Basic Details' subtitle='Expense Basic Details'>
        {/* Category selector — all disabled */}
        <div className='inputs-container'>
          {categoryOptions.map((option, index) => (
            <Option
              key={index}
              Icon={option.Icon}
              label={option.label}
              isSelected={index === categoryIndex}
              disabled={true}
              onClick={() => {}}
            />
          ))}
        </div>

        <div className='inputs-container'>
          {/* Type selector */}
          <InputGroup label='Expense Type'>
            <Select
              items={typeOptions}
              label='Types'
              placeholder='Select a type'
              value={expenseType}
              onValueChange={value => setExpenseType(value)}
              disabled={isTypeLocked}
            />
          </InputGroup>

          {/* Property selector — Property Related, non-Refund types only */}
          {expense.category === 'Property_Related' && !isRefund && (
            <InputGroup label='Property' isRequired>
              <Combobox
                items={propertyItems}
                variant='single'
                searchPlaceholder='Search properties'
                placeholder={loadingProperties ? 'Loading properties...' : 'Select a property'}
                isLoading={loadingProperties}
                loadingMessage='Fetching properties...'
                value={selectedPropertyId || undefined}
                onValueChange={value => setSelectedPropertyId(value || null)}
                required
              />
            </InputGroup>
          )}

          {/* Lease selector — Property Related, Refund type only */}
          {expense.category === 'Property_Related' && isRefund && (
            <InputGroup label='Lease' isRequired>
              <Combobox
                items={leaseItems}
                variant='single'
                searchPlaceholder='Search leases'
                placeholder={loadingLeases ? 'Loading leases...' : 'Select an active lease'}
                isLoading={loadingLeases}
                loadingMessage='Fetching leases...'
                value={selectedLeaseId || undefined}
                onValueChange={value => setSelectedLeaseId(value || null)}
                required
              />
            </InputGroup>
          )}

          {/* Contract selector — Contract Related (DISABLED) */}
          {expense.category === 'Contract_Related' && expense.contract_expense && (
            <InputGroup label='Contract' isRequired>
              <Combobox
                items={[{
                  id: expense.contract_expense.contract_id,
                  label: expense.contract_expense.contract_reference_id,
                  subtitle: expense.contract_expense.contract_owner_name
                }]}
                variant='single'
                searchPlaceholder='Search contracts'
                placeholder='Contract'
                value={expense.contract_expense.contract_id}
                disabled
                disabledReason='Contract cannot be changed after creation'
                required
              />
            </InputGroup>
          )}

          {/* Staff selector + month — Staff Related */}
          {expense.category === 'Staff_Related' && (
            <>
              <InputGroup label='Staff Member' isRequired>
                <Combobox
                  items={staffItems}
                  variant='single'
                  searchPlaceholder='Search staff'
                  placeholder={loadingStaff ? 'Loading staff...' : 'Select a staff member'}
                  isLoading={loadingStaff}
                  loadingMessage='Fetching staff...'
                  value={selectedStaffId || undefined}
                  onValueChange={value => setSelectedStaffId(value || null)}
                  required
                />
              </InputGroup>
              <InputGroup label='Month' isRequired>
                <MonthPicker value={staffMonth} onValueChange={setStaffMonth} />
              </InputGroup>
            </>
          )}
        </div>

        {/* Description */}
        <InputGroup label='Description'>
          <Textarea
            placeholder='Enter a description (optional)'
            value={description}
            onChange={e => setDescription(e.target.value)}
            className='texts-body-small bg-(--background-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50 focus:border-neutral-400 border border-(--border-strong) transition-colors duration-200 rounded-[5] shadows-xs'
          />
        </InputGroup>

        {/* Purchase-specific: optional property link */}
        {expense.category === 'Purchase_Related' && (
          <InputGroup label='Property (Optional)'>
            <Combobox
              items={purchasePropertyItems}
              variant='single'
              searchPlaceholder='Search properties'
              placeholder={loadingPurchaseProperties ? 'Loading properties...' : 'Link to a property (optional)'}
              isLoading={loadingPurchaseProperties}
              loadingMessage='Fetching properties...'
              value={purchasePropertyId || undefined}
              onValueChange={value => setPurchasePropertyId(value || null)}
            />
          </InputGroup>
        )}

        {/* Purchase-specific fields */}
        {expense.category === 'Purchase_Related' && (
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

            {isAsset && expenseType === 'Miscellaneous_Others' && (
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
      </InnerSection>

      {/* Staff Salary Section */}
      {isStaffSalary && (
        <InnerSection title='Salary Breakdown' subtitle='Enter salary components and deductions'>
          <InputGroup label='Gross Salary' isRequired>
            <Input
              currency
              placeholder='0.00'
              value={grossSalary}
              onValueChange={(value) => setGrossSalary(value || '')}
              required
            />
          </InputGroup>

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

          {(parseFloat(grossSalary) || 0) >= 3000 && (
            <InputGroup label='Tax (PCB)' isRequired>
              <Input
                currency
                placeholder='0.00'
                value={tax}
                onValueChange={(value) => setTax(clampEmployeeDeduction(value || '', 'tax'))}
                required
              />
            </InputGroup>
          )}

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
                <div className='flex items-center justify-between'>
                  <span className='texts-body-small text-(--text-secondary)'>Gross Salary</span>
                  <span className='texts-body-small-medium'>{formatCurrency(salarySummary.gross)}</span>
                </div>

                {(salarySummary.epfEe > 0 || salarySummary.socsoEe > 0 || salarySummary.taxAmount > 0 || salarySummary.totalCustomDeductions > 0) && (
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
                    {salarySummary.taxAmount > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='texts-body-small text-(--text-secondary)'>Tax (PCB)</span>
                        <span className='texts-body-small text-red-600'>- {formatCurrency(salarySummary.taxAmount)}</span>
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

      {/* Staff Allowances Section — shown for both Salary and Allowances type */}
      {(isStaffSalary || isStaffAllowances) && (
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

      {/* Charges Section — non-staff, or staff non-salary/non-allowances */}
      {!isStaffSalary && !isStaffAllowances && (
        <ChargesSection
          flowType='outcome'
          selectable={false}
          onChargesChange={setCharges}
          defaultCharges={defaultCharges}
          allowAllRemovable
        />
      )}

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
