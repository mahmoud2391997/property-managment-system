'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { UserAvatar } from './name-avatar'
import { ComboBoxitemsType } from '@/types'



type Props = {
  items: ComboBoxitemsType[]
  placeholder: string
  searchPlaceholder: string
  variant?: 'single' | 'multiple'
  NotFoundMessage?: string
  showAvatar?: boolean
  className?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  disabledReason?: string
  required?: boolean
  isLoading?: boolean
  loadingMessage?: string
}

export default function Combobox ({
  items,
  placeholder,
  searchPlaceholder,
  variant = 'single',
  NotFoundMessage = 'No items found.',
  showAvatar = false,
  className,
  value,
  onValueChange,
  disabled = false,
  disabledReason,
  required = false,
  isLoading = false,
  loadingMessage = 'Loading...'
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [singleValue, setSingleValue] = React.useState(value || '')
  const [multipleValues, setMultipleValues] = React.useState<string[]>([])

  const isMultiple = variant === 'multiple'

  // Sync internal state with controlled value prop
  React.useEffect(() => {
    if (value !== undefined) {
      setSingleValue(value)
    }
  }, [value])

  const handleSelect = (itemId: string) => {
    if (isMultiple) {
      setMultipleValues(prev =>
        prev.includes(itemId)
          ? prev.filter(item => item !== itemId)
          : [...prev, itemId]
      )
    } else {
      const newValue = itemId === singleValue ? '' : itemId
      setSingleValue(newValue)
      onValueChange?.(newValue)
      setOpen(false)
    }
  }

  const handleRemove = (itemToRemove: string) => {
    setMultipleValues(prev => prev.filter(item => item !== itemToRemove))
  }

  const getButtonLabel = () => {
    if (isMultiple) {
      return multipleValues.length > 0
        ? `${multipleValues.length} selected`
        : placeholder
    }
    const selectedItem = items.find(item =>
      item.id ? item.id === singleValue : item.label === singleValue
    )
    return (disabled && disabledReason) ? disabledReason : selectedItem ? selectedItem.label : placeholder
  }

  const isSelected = (item: ComboBoxitemsType) => {
    const itemValue = item.id || item.label
    return isMultiple ? multipleValues.includes(itemValue) : singleValue === itemValue
  }

  const renderAvatar = (item: ComboBoxitemsType) => {
    if (!item.avatar) {
      return <UserAvatar name={item.label} size={item.subtitle ? 25 : 20} className={item.subtitle ? 'text-[11px]!' : 'text-[9px]!'} />
    }

    if (typeof item.avatar === 'string') {
      return (
        <span className='w-5 h-5 relative rounded-full overflow-hidden'>
          <Image
            src={item.avatar}
            alt='Profile pic'
            fill
            className='object-cover'
          />
        </span>
      )
    }

    return <span className='w-5 h-5'>{item.avatar}</span>
  }

  return (
    <div className={cn('w-full space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex justify-between',
              'w-full h-10!',
              'texts-body-medium',
              'rounded-[5]',
              className
            )}
          >
            {getButtonLabel()}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-(--radix-popover-trigger-width) p-0 z-1000!'
          align='start'
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} className='h-9' />
            <CommandList>
              {isLoading ? (
                <div className='flex flex-col items-center justify-center py-6 px-4'>
                  <Loader2 className='h-8 w-8 animate-spin text-(--text-secondary) mb-2' />
                  <p className='text-sm text-(--text-secondary)'>{loadingMessage}</p>
                </div>
              ) : (
                <>
                  <CommandEmpty>{NotFoundMessage}</CommandEmpty>
                  <CommandGroup>
                    {items.map((item, index) => {
                      const itemValue = item.id || item.label
                      const selected = isSelected(item)
                      // Use unique value for Command component (includes ID for uniqueness but searchable by label and subtitle)
                      const commandValue = item.id
                        ? `${item.id}|||${item.label} ${item.subtitle || ''}`
                        : `${item.label} ${item.subtitle || ''}`
                      return (
                        <CommandItem
                          key={item.id || `${item.label}-${index}`}
                          value={commandValue}
                          onSelect={() => handleSelect(itemValue)}
                          className='flex items-center gap-2'
                        >
                          {showAvatar && renderAvatar(item)}
                          <div className='flex-1 flex flex-col'>
                            <span>{item.label}<span className='ml-1 texts-caption-large text-(--text-secondary)'>{item.extraReference ? `(${item.extraReference})` : ''}</span></span>
                            {item.subtitle && (
                              <span className='text-xs text-(--text-secondary)'>
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              selected ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items Tags - Only for multiple variant */}
      {isMultiple && multipleValues.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {multipleValues.map(selectedLabel => (
            <Badge
              key={selectedLabel}
              variant='secondary'
              className='flex items-center gap-1 pr-1'
            >
              <span>{selectedLabel}</span>
              <button
                onClick={() => handleRemove(selectedLabel)}
                className='ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5'
                aria-label={`Remove ${selectedLabel}`}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}