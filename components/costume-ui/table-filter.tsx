'use client'

import { useState, useCallback } from 'react'
import { SlidersHorizontal, Plus, X, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Select from '@/components/costume-ui/select'
import Input from '@/components/costume-ui/input'
import Button from '@/components/costume-ui/button'
import { cn } from '@/lib/utils'

export type FilterAttribute = {
  key: string
  label: string
  type: 'text' | 'select' | 'date'
  options?: { value: string; label: string }[]
}

export type FilterValue = {
  id: string
  attribute: string
  value: string
}

type Props = {
  attributes: FilterAttribute[]
  filters: FilterValue[]
  onFiltersChange: (filters: FilterValue[]) => void
  className?: string
}

export default function TableFilter({
  attributes,
  filters,
  onFiltersChange,
  className
}: Props) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterValue[]>(filters)

  // Sync local filters when prop changes
  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalFilters(filters)
    }
    setOpen(isOpen)
  }

  const addFilter = useCallback(() => {
    const newFilter: FilterValue = {
      id: crypto.randomUUID(),
      attribute: '',
      value: ''
    }
    setLocalFilters(prev => [...prev, newFilter])
  }, [])

  const updateFilter = useCallback((id: string, field: 'attribute' | 'value', value: string) => {
    setLocalFilters(prev =>
      prev.map(f => {
        if (f.id === id) {
          // If attribute changes, reset the value
          if (field === 'attribute') {
            return { ...f, attribute: value, value: '' }
          }
          return { ...f, [field]: value }
        }
        return f
      })
    )
  }, [])

  const removeFilter = useCallback((id: string) => {
    setLocalFilters(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAllFilters = useCallback(() => {
    setLocalFilters([])
  }, [])

  const applyFilters = useCallback(() => {
    // Only apply filters that have both attribute and value
    const validFilters = localFilters.filter(f => f.attribute && f.value)
    onFiltersChange(validFilters)
    setOpen(false)
  }, [localFilters, onFiltersChange])

  const getAttributeConfig = (key: string) => {
    return attributes.find(a => a.key === key)
  }

  // Get available attributes (exclude already selected ones, except current filter's attribute)
  const getAvailableAttributes = (currentFilterId: string) => {
    const usedAttributes = localFilters
      .filter(f => f.id !== currentFilterId && f.attribute)
      .map(f => f.attribute)
    return attributes.filter(a => !usedAttributes.includes(a.key))
  }

  const activeFilterCount = filters.length

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='secondary'
          className={cn(
            activeFilterCount > 0 && 'border-(--primary-color) bg-blue-50 text-(--primary-color)',
            className
          )}
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className='flex items-center justify-center size-4 rounded-full bg-(--primary-color) text-white text-[10px] font-medium leading-none'>
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-[420px] p-0'>
        <div className='flex flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3 border-b border-(--border-light)'>
            <span className='texts-body-medium-medium'>Filters</span>
            {localFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className='texts-caption-large text-(--text-secondary) hover:text-red-600 transition-colors'
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter List */}
          <div className='flex flex-col gap-3 p-4 max-h-[300px] overflow-y-auto'>
            {localFilters.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-6 text-(--text-secondary)'>
                <SlidersHorizontal size={24} className='mb-2 opacity-50' />
                <span className='texts-body-small'>No filters applied</span>
                <span className='texts-caption-large'>Click "Add filter" to get started</span>
              </div>
            ) : (
              localFilters.map((filter) => {
                const attrConfig = getAttributeConfig(filter.attribute)
                const availableAttrs = getAvailableAttributes(filter.id)
                return (
                  <div key={filter.id} className='flex items-start gap-2'>
                    {/* Attribute Select */}
                    <div className='flex-1'>
                      <Select
                        label='Attribute'
                        items={availableAttrs.map(a => ({ value: a.key, label: a.label }))}
                        placeholder='Select field'
                        value={filter.attribute}
                        onChange={(value) => updateFilter(filter.id, 'attribute', value)}
                      />
                    </div>

                    {/* Value Input/Select */}
                    <div className='flex-1'>
                      {attrConfig?.type === 'select' && attrConfig.options ? (
                        <Select
                          label='Value'
                          items={attrConfig.options}
                          placeholder='Select value'
                          value={filter.value}
                          onChange={(value) => updateFilter(filter.id, 'value', value)}
                        />
                      ) : attrConfig?.type === 'date' ? (
                        <Input
                          type='date'
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          placeholder='Select date'
                        />
                      ) : (
                        <Input
                          type='text'
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          placeholder={filter.attribute ? 'Enter value' : 'Select field first'}
                          disabled={!filter.attribute}
                        />
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className='flex items-center justify-center h-10 w-10 rounded-[5px] text-(--text-secondary) hover:text-red-600 hover:bg-red-50 transition-colors'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Add Filter Button */}
          {localFilters.length < attributes.length && (
            <div className='px-4 pb-3'>
              <button
                onClick={addFilter}
                className='flex items-center gap-2 text-(--primary-color) hover:text-blue-700 texts-body-small font-medium transition-colors'
              >
                <Plus size={16} />
                <span>Add filter</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-end gap-2 px-4 py-3 border-t border-(--border-light) bg-(--background-secondary)'>
            <Button
              variant='secondary'
              label='Cancel'
              onClick={() => setOpen(false)}
              className='text-sm!'
            />
            <Button
              label='Apply'
              onClick={applyFilters}
              className='text-sm!'
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Active filter chips display component
export function ActiveFilterChips({
  filters,
  attributes,
  onRemove,
  onClearAll,
  className
}: {
  filters: FilterValue[]
  attributes: FilterAttribute[]
  onRemove: (id: string) => void
  onClearAll: () => void
  className?: string
}) {
  if (filters.length === 0) return null

  const getAttributeLabel = (key: string) => {
    return attributes.find(a => a.key === key)?.label || key
  }

  const getValueLabel = (attributeKey: string, value: string) => {
    const attr = attributes.find(a => a.key === attributeKey)
    if (attr?.type === 'select' && attr.options) {
      return attr.options.find(o => o.value === value)?.label || value
    }
    return value
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {filters.map((filter) => (
        <div
          key={filter.id}
          className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 texts-caption-large text-blue-800'
        >
          <span className='font-medium'>{getAttributeLabel(filter.attribute)}:</span>
          <span>{getValueLabel(filter.attribute, filter.value)}</span>
          <button
            onClick={() => onRemove(filter.id)}
            className='ml-1 p-0.5 rounded-full hover:bg-blue-200 transition-colors'
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        className='texts-caption-large text-(--text-secondary) hover:text-red-600 transition-colors'
      >
        Clear all
      </button>
    </div>
  )
}
