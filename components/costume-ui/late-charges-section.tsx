import React, { useState } from 'react'
import InnerSection from './collapsible-inner-section'
import InputCard from './input-card'
import InputGroup from './input-group'
import Select from './select'
import Input from './input'
import Button from './button'
import { Plus } from 'lucide-react'
import { LateCharge } from './payment-section'

type Props = {
  onLateChargesChange?: (charges: LateCharge[]) => void
}

const LateChargesSection = ({ onLateChargesChange }: Props) => {
  const daysOfMonth: number[] = Array.from({ length: 28 }, (_, i) => i + 1)

  const [lateCharges, setLateCharges] = useState<LateCharge[]>([])
  const handleAddLateCharge = () => {
    const updated = [...lateCharges, { days_after_due: 7, amount: '' }]
    setLateCharges(updated)
    onLateChargesChange?.(updated)
  }

  const handleRemoveLateCharge = (index: number) => {
    const updated = lateCharges.filter((_, i) => i !== index)
    setLateCharges(updated)
    onLateChargesChange?.(updated)
  }

  const handleLateChargeChange = (
    index: number,
    field: 'days_after_due' | 'amount',
    value: string
  ) => {
    const updated = [...lateCharges]
    if (field === 'days_after_due') {
      updated[index][field] = parseInt(value) || 0
    } else {
      updated[index][field] = value
    }
    setLateCharges(updated)
    onLateChargesChange?.(updated)
  }
  return (
    <InnerSection
      title='Late Payment Charges'
      subtitle='Set up charges for late payments by tenants'
    >
      {lateCharges.length === 0 ? (
        <div className='flex items-center justify-center py-8 px-4 border border-dashed border-(--border-subtle) rounded-lg bg-(--background-secondary)'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <p className='texts-body-small text-(--text-secondary)'>
              No late charges added yet
            </p>
            <Button
              type='button'
              variant='secondary'
              icon={<Plus />}
              label='Add Late Charge'
              isResponsive={false}
              onClick={handleAddLateCharge}
            />
          </div>
        </div>
      ) : (
        lateCharges.map((charge, index) => (
          <InputCard
            key={index}
            isRemoveable={true}
            onRemove={() => handleRemoveLateCharge(index)}
          >
            <InputGroup
              label='Days After Due Payment'
              className='w-45 sm:w-45 md:w-45 lg:w-80'
            >
              <Select
                label='Days'
                placeholder='Select days'
                className='bg-(--background-primary)'
                items={daysOfMonth.map(String)}
                value={String(charge.days_after_due)}
                onValueChange={val =>
                  handleLateChargeChange(index, 'days_after_due', val)
                }
              />
            </InputGroup>

            <InputGroup label='Amount' className='w-20 md:w-30 lg:w-80'>
              <Input
                className='bg-(--background-primary)'
                maxLength={20}
                currency
                value={charge.amount}
                onValueChange={value =>
                  handleLateChargeChange(index, 'amount', value || '')
                }
              />
            </InputGroup>
          </InputCard>
        ))
      )}
      {lateCharges.length !== 0 && (
        <Button
          type='button'
          variant='secondary'
          icon={<Plus />}
          label='Add Late Charge'
          isResponsive={false}
          onClick={handleAddLateCharge}
        />
      )}
    </InnerSection>
  )
}

export default LateChargesSection
