import React, { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import InputCard from './input-card'
import InputGroup from './input-group'
import Input from './input'
import Select from './select'
import { chargeTypes } from '@/utils/data'
import { CheckAddon } from './payment-section'
import Button from './button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Charge = {
  type: string
  amount: string
  taxable: boolean
  refundable: boolean
  isRemovable: boolean
  isTaxableChecked?: boolean
}

export type ChargeData = {
  type: string
  amount: string
  taxable: boolean
  refundable: boolean
  isTaxableChecked?: boolean
}

type Props = {
  title?: string
  subtitle?: string
  flowType: 'income' | 'outcome'
  selectable?: boolean
  onChargesChange?: (charges: ChargeData[]) => void
  defaultPayment?: boolean
}
const ChargesSection = ({
  title = 'Charges',
  subtitle = 'Set up charges for this payment',
  flowType,
  selectable = false,
  onChargesChange,
  defaultPayment = false
}: Props) => {
  const [charges, setCharges] = useState<Charge[]>(() => {
    if (defaultPayment === true) {
      return []
    }
    return [
      {
        type: chargeTypes[0].type,
        amount: '',
        refundable: chargeTypes[0].refundable,
        taxable: chargeTypes[0].taxable,
        isRemovable: false,
        isTaxableChecked: false
      }
    ]
  })

  // Notify parent when charges change
  useEffect(() => {
    if (onChargesChange) {
      onChargesChange(charges)
    }
  }, [charges, onChargesChange])

  // When selectable becomes true, trim charges to match chargeTypes length
  useEffect(() => {
    if (selectable && charges.length > chargeTypes.length) {
      setCharges(prev => prev.slice(0, chargeTypes.length))
    }
  }, [selectable])

  const handleTypeChange = (index: number, selectedType: string) => {
    const config = chargeTypes.find(t => t.type === selectedType)
    if (!config) return

    setCharges(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        type: selectedType,
        taxable: config.taxable,
        refundable: config.refundable,
        isTaxableChecked: false
      }
      return updated
    })
  }

  const handleAmountChange = (index: number, value: string) => {
    setCharges(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        amount: value
      }
      return updated
    })
  }

  const handleTaxableChange = (index: number, checked: boolean) => {
    setCharges(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        isTaxableChecked: checked
      }
      return updated
    })
  }

  const handleRemoveCharge = (index: number) => {
    setCharges(prev => prev.filter((_, i) => i !== index))
  }

  const addCharge = () => {
    if (selectable) {
      // Get available charge types (not already selected)
      const selectedTypes = charges.map(c => c.type)
      const availableType = chargeTypes.find(
        t => !selectedTypes.includes(t.type)
      )

      if (!availableType) return // No more types available

      setCharges(prev => [
        ...prev,
        {
          type: availableType.type,
          amount: '',
          taxable: availableType.taxable,
          refundable: availableType.refundable,
          isRemovable: true,
          isTaxableChecked: false
        }
      ])
    } else {
      setCharges(prev => [
        ...prev,
        {
          type: chargeTypes[0].type,
          amount: '',
          taxable: true,
          refundable: false,
          isRemovable: true,
          isTaxableChecked: false
        }
      ])
    }
  }

  // Calculate summary
  const calculateSummary = () => {
    const subtotal = charges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount) || 0
      return sum + amount
    }, 0)

    const tax = charges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount) || 0
      // Apply tax if the charge type is taxable AND the checkbox is checked (for income flow)
      if (charge.taxable && flowType === 'income' && charge.isTaxableChecked) {
        return sum + amount * 0.08
      }
      return sum
    }, 0)

    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  const summary = calculateSummary()

  // Get available charge types for a specific card (excluding types selected in other cards)
  const getAvailableChargeTypes = (currentIndex: number) => {
    const selectedTypes = charges
      .map((c, i) => (i !== currentIndex ? c.type : null))
      .filter(Boolean)

    return chargeTypes
      .filter(t => !selectedTypes.includes(t.type))
      .map(t => t.type)
  }

  // Check if we can add more charges (only when selectable is true)
  const canAddMore = selectable ? charges.length < chargeTypes.length : true

  return (
    <InnerSection title={title} subtitle={subtitle}>
      {charges.length === 0 ? (
        <div className='flex items-center justify-center py-8 px-4 border border-dashed border-(--border-subtle) rounded-lg bg-(--background-secondary)'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <p className='texts-body-small text-(--text-secondary)'>
              No charges added yet
            </p>
            <Button
              type='button'
              variant='secondary'
              icon={<Plus />}
              label='Add Charge'
              isResponsive={false}
              onClick={addCharge}
            />
          </div>
        </div>
      ) : (
        charges.map((charge, index) => {
          const config = chargeTypes.find(t => t.type === charge.type)
          const isFirstCard = index === 0
          const availableTypes = selectable
            ? getAvailableChargeTypes(index)
            : []

          return (
            <InputCard
              onRemove={() => handleRemoveCharge(index)}
              isRemoveable={charge.isRemovable}
              key={index}
            >
              <InputGroup
                label={`Charge ${selectable ? 'Type' : 'Title'}`}
                className='w-45 sm:w-45 md:w-45 lg:w-80'
                isRequired
              >
                {selectable ? (
                  isFirstCard && !defaultPayment ? (
                    // First card shows charge type as text, not selectable
                    <div className='flex items-center h-10 px-3 rounded-md border border-(--border-default) bg-(--background-primary)'>
                      <span className='texts-body-medium'>{charge.type}</span>
                    </div>
                  ) : (
                    <Select
                      label='Charge types'
                      value={charge.type}
                      placeholder='Select charge type'
                      className='bg-(--background-primary)'
                      items={availableTypes}
                      onValueChange={v => handleTypeChange(index, v)}
                      required
                    />
                  )
                ) : (
                  <Input
                    className='bg-(--background-primary)'
                    maxLength={30}
                    placeholder='Enter charge title'
                    required
                  />
                )}
              </InputGroup>

              <InputGroup
                label='Amount'
                className='w-20 md:w-30 lg:w-80'
                isRequired
              >
                <Input
                  className='bg-(--background-primary)'
                  currency
                  required
                  value={charge.amount}
                  onValueChange={value =>
                    handleAmountChange(index, value || '')
                  }
                />
              </InputGroup>

              {/* Conditionally render based on selected type */}
              {config?.taxable && flowType === 'income' && (
                <CheckAddon
                  label='Taxable (SST 8%)'
                  checked={charge.isTaxableChecked}
                  onCheckedChange={checked =>
                    handleTaxableChange(index, checked)
                  }
                />
              )}

              {config?.refundable && flowType === 'income' && (
                <CheckAddon label='Refundable' />
              )}
            </InputCard>
          )
        })
      )}

      {canAddMore && charges.length !== 0 && (
        <Button
        type='button'
          variant='secondary'
          icon={<Plus />}
          label='Add Charge'
          isResponsive={false}
          onClick={addCharge}
        />
      )}

      {charges.length !== 0 && (
        <div
          className={cn(
            'flex justify-end',
            'w-full pt-5',
            'border-t border-(--border-strong)'
          )}
        >
          <div className={cn('flex flex-col gap-2.5', 'w-75 px-2.5')}>
            <div className='flex justify-between'>
              <span className='texts-body-medium text-(--text-secondary)'>
                Subtotal:
              </span>
              <span className='texts-body-medium-medium text-right'>
                RM {summary.subtotal.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='texts-body-medium text-(--text-secondary)'>
                Tax (SST 8%):
              </span>
              <span className='texts-body-medium-medium text-right'>
                RM {summary.tax.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between pt-3 border-t border-(--border-strong)'>
              <span className='texts-body-large text-(--text-secondary)'>
                Total Charges:
              </span>
              <span className='texts-body-large-medium text-right'>
                RM {summary.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </InnerSection>
  )
}

export default ChargesSection
