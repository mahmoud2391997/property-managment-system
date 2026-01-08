import React, { useState, useEffect, useMemo } from 'react'
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
  isRefundableChecked?: boolean
}

export type ChargeData = {
  type: string
  amount: string
  taxable: boolean
  refundable: boolean
  isTaxableChecked?: boolean
}

export type DefaultCharge = {
  type: string
  amount: number
  is_taxed: boolean
  is_refundable: boolean
}

type Props = {
  title?: string
  subtitle?: string
  flowType: 'income' | 'outcome'
  selectable?: boolean
  onChargesChange?: (charges: ChargeData[]) => void
  defaultPayment?: boolean
  defaultCharges?: DefaultCharge[]
  excludedChargeTypes?: string[]
  allChargesSelectable?: boolean
}
const ChargesSection = ({
  title = 'Charges',
  subtitle = 'Set up charges for this payment',
  flowType,
  selectable = false,
  onChargesChange,
  defaultPayment = false,
  defaultCharges,
  excludedChargeTypes = [],
  allChargesSelectable = false
}: Props) => {
  // Filter out excluded charge types - memoized to prevent infinite re-renders
  // Use JSON.stringify for stable dependency since excludedChargeTypes array reference changes
  const excludedTypesKey = JSON.stringify(excludedChargeTypes)
  const availableChargeTypes = useMemo(
    () => chargeTypes.filter(ct => !excludedChargeTypes.includes(ct.type)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludedTypesKey]
  )
  const [chargesApplied, setChargesApplied] = useState(false)
  const [initialChargesSet, setInitialChargesSet] = useState(false)
  const [charges, setCharges] = useState<Charge[]>([])

  // Track previous selectable value to detect changes
  const [prevSelectable, setPrevSelectable] = useState<boolean | null>(null)

  // Initialize charges on first render OR when selectable changes
  useEffect(() => {
    const selectableChanged = prevSelectable !== null && prevSelectable !== selectable

    if ((!initialChargesSet || selectableChanged) && !defaultPayment && (!defaultCharges || defaultCharges.length === 0)) {
      if (selectable) {
        // For lease initial charges, use the first available charge type
        if (availableChargeTypes.length > 0) {
          const firstType = availableChargeTypes[0]
          setCharges([
            {
              type: firstType.type,
              amount: '',
              refundable: firstType.refundable,
              taxable: firstType.taxable,
              isRemovable: false,
              isTaxableChecked: false,
              isRefundableChecked: firstType.type === 'Security Deposit'
            }
          ])
        }
      } else {
        // For other payment types (non-selectable), use empty type with taxable option
        setCharges([
          {
            type: '',
            amount: '',
            refundable: false,
            taxable: true,
            isRemovable: false,
            isTaxableChecked: false,
            isRefundableChecked: false
          }
        ])
      }
      setInitialChargesSet(true)
    }
    setPrevSelectable(selectable)
  }, [availableChargeTypes, defaultPayment, defaultCharges, initialChargesSet, selectable, prevSelectable])

  // Apply default charges when they arrive (after async load)
  useEffect(() => {
    if (defaultCharges && defaultCharges.length > 0 && !chargesApplied) {
      const mappedCharges: Charge[] = defaultCharges.map((charge, index) => {
        const config = chargeTypes.find(t => t.type === charge.type)
        // Use is_refundable from database config, fallback to true only for Security Deposit
        const isRefundableChecked = charge.is_refundable ?? (charge.type === 'Security Deposit')
        return {
          type: charge.type,
          amount: String(charge.amount),
          taxable: config?.taxable ?? false,
          refundable: config?.refundable ?? false,
          isRemovable: index > 0, // First charge is not removable
          isTaxableChecked: charge.is_taxed,
          isRefundableChecked
        }
      })
      setCharges(mappedCharges)
      setChargesApplied(true)
    }
  }, [defaultCharges, chargesApplied])

  // Notify parent when charges change
  useEffect(() => {
    if (onChargesChange) {
      onChargesChange(charges)
    }
  }, [charges, onChargesChange])

  // When selectable becomes true, trim charges to match availableChargeTypes length
  useEffect(() => {
    if (selectable && charges.length > availableChargeTypes.length) {
      setCharges(prev => prev.slice(0, availableChargeTypes.length))
    }
  }, [selectable, availableChargeTypes.length])

  // When excludedChargeTypes changes, filter out any currently selected charges that are now excluded
  // and reset the first charge if needed
  useEffect(() => {
    if (excludedChargeTypes.length > 0 && initialChargesSet) {
      setCharges(prev => {
        // Filter out charges that are now excluded
        const filteredCharges = prev.filter(
          charge => !excludedChargeTypes.includes(charge.type)
        )

        // If all charges were filtered out and we have available types, add the first available one
        if (filteredCharges.length === 0 && availableChargeTypes.length > 0) {
          const firstType = availableChargeTypes[0]
          return [
            {
              type: firstType.type,
              amount: '',
              refundable: firstType.refundable,
              taxable: firstType.taxable,
              isRemovable: false,
              isTaxableChecked: false,
              isRefundableChecked: firstType.type === 'Security Deposit'
            }
          ]
        }

        // Update isRemovable for the first charge
        if (filteredCharges.length > 0) {
          filteredCharges[0] = { ...filteredCharges[0], isRemovable: false }
          for (let i = 1; i < filteredCharges.length; i++) {
            filteredCharges[i] = { ...filteredCharges[i], isRemovable: true }
          }
        }

        return filteredCharges
      })
    }
  }, [excludedChargeTypes, availableChargeTypes, initialChargesSet])

  const handleTypeChange = (index: number, selectedType: string) => {
    const config = chargeTypes.find(t => t.type === selectedType)

    setCharges(prev => {
      const updated = [...prev]
      if (config) {
        // For selectable charges, update taxable/refundable from config
        updated[index] = {
          ...updated[index],
          type: selectedType,
          taxable: config.taxable,
          refundable: config.refundable,
          isTaxableChecked: false,
          isRefundableChecked: selectedType === 'Security Deposit'
        }
      } else {
        // For non-selectable charges (free text input), just update the type/title
        updated[index] = {
          ...updated[index],
          type: selectedType
        }
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

  const handleRefundableChange = (index: number, checked: boolean) => {
    setCharges(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        isRefundableChecked: checked
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
      const nextAvailableType = availableChargeTypes.find(
        t => !selectedTypes.includes(t.type)
      )

      if (!nextAvailableType) return // No more types available

      setCharges(prev => [
        ...prev,
        {
          type: nextAvailableType.type,
          amount: '',
          taxable: nextAvailableType.taxable,
          refundable: nextAvailableType.refundable,
          isRemovable: true,
          isTaxableChecked: false,
          isRefundableChecked: nextAvailableType.type === 'Security Deposit'
        }
      ])
    } else {
      // For non-selectable (other payment types), use empty type with taxable option
      setCharges(prev => [
        ...prev,
        {
          type: '',
          amount: '',
          taxable: true,
          refundable: false,
          isRemovable: true,
          isTaxableChecked: false,
          isRefundableChecked: false
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

  // Get available charge types for a specific card (excluding types selected in other cards) (used when selectable)
  const getAvailableChargeTypesForCard = (currentIndex: number) => {
    const selectedTypes = charges
      .map((c, i) => (i !== currentIndex ? c.type : null))
      .filter(Boolean)

    return availableChargeTypes
      .filter(t => !selectedTypes.includes(t.type))
      .map(t => t.type)
  }

  // Check if we can add more charges (only when selectable is true)
  const canAddMore = selectable ? charges.length < availableChargeTypes.length : true

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
            ? getAvailableChargeTypesForCard(index)
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
                  isFirstCard && !defaultPayment && !allChargesSelectable ? (
                    // First card shows charge type as text, not selectable (unless allChargesSelectable is true)
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
                    value={charge.type}
                    onChange={e => handleTypeChange(index, e.target.value)}
                    required
                  />
                )}
              </InputGroup>

              <InputGroup
                label='Amount'
                className='w-30 lg:w-40'
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

              {/* Conditionally render based on selected type (use config for selectable, charge props otherwise) */}
              {(selectable ? config?.taxable : charge.taxable) && flowType === 'income' && (
                <CheckAddon
                  label='Taxable (SST 8%)'
                  checked={charge.isTaxableChecked}
                  onCheckedChange={checked =>
                    handleTaxableChange(index, checked)
                  }
                />
              )}

              {(selectable ? config?.refundable : charge.refundable) && flowType === 'income' && (
                <CheckAddon
                  label='Refundable'
                  checked={charge.isRefundableChecked ?? (charge.type === 'Security Deposit')}
                  onCheckedChange={checked => handleRefundableChange(index, checked)}
                />
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
