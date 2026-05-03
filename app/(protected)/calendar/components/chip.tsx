'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ChipData {
  type: 'payment' | 'expense' | 'task' | 'manual_event' | 'info' | 'lease_start' | 'lease_end' | 'expiry_reminder' | 'rent_change' | 'assignment_request' | 'booking'
  count: number
  total?: number
  urgentCount?: number
  label: string
  status?: 'due' | 'overdue'
  hasViewAll?: boolean
  viewAllUrl?: string
  date?: string
  category?: string
}

interface ChipProps {
  chip: ChipData
  onClick: (e: React.MouseEvent, chip: ChipData) => void
}

export function Chip({ chip, onClick }: ChipProps) {
  const isOverdue = chip.status === 'overdue'
  
  const icon = chip.type === 'payment' ? '💰' :
               chip.type === 'expense' ? '💸' :
               chip.type === 'task' ? '🔧' :
               chip.type === 'assignment_request' ? '📋' :
               chip.type === 'manual_event' ? '📅' :
               chip.type === 'lease_start' ? '🔑' :
               chip.type === 'lease_end' ? '📦' :
               chip.type === 'expiry_reminder' ? '⚠️' :
               chip.type === 'rent_change' ? '📈' :
               chip.type === 'booking' ? '🏠' : '📅'

  return (
    <button
      onClick={(e) => onClick(e, chip)}
      className={cn(
        'w-auto text-left px-2 py-1 rounded text-[11px] leading-tight transition-colors',
        isOverdue
          ? 'bg-(--danger-light) text-(--danger-main) hover:bg-(--danger-light)/80 border-l-2 border-(--danger-main)'
          : 'bg-(--background-secondary) text-(--text-primary) hover:bg-(--border-default) border-l-2 border-(--border-default)'
      )}
    >
      <span className='mr-1'>{icon}</span>
      <span className='font-medium'>{chip.count}</span> {chip.label}
      {chip.urgentCount !== undefined && chip.urgentCount > 0 && (
        <span className='text-(--danger-main)'> ({chip.urgentCount} urgent)</span>
      )}
      {chip.total !== undefined && (
        <span className='opacity-75'> — RM {chip.total.toLocaleString()}{(chip.type === 'lease_start' || chip.type === 'lease_end') ? '/mo' : ''}</span>
      )}
    </button>
  )
}

interface ChipPopoverProps {
  chip: ChipData | null
  date: Date | null
  onClose: () => void
}

export function ChipPopover({ chip, date, onClose }: ChipPopoverProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!chip || !date) return
    
    setIsLoading(true)
    try {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      const params = new URLSearchParams({ date: dateStr, type: chip.type })
      if (chip.category) params.set('category', chip.category)
      const response = await fetch(`/api/calendar/chip-summary?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setHasMore(data.hasMore || false)
      } else {
        setItems([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load chip summary:', error)
    } finally {
      setIsLoading(false)
    }
  }, [chip, date])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  if (!chip || !date) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose} 
      />
      <div
        className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-(--background-primary) rounded-lg shadow-xl border border-(--border-default) p-4 w-72 max-h-[80vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-start justify-between mb-3'>
          <div>
            <h3 className='font-semibold text-sm'>{chip.count} {chip.label}</h3>
          </div>
          <button
            onClick={onClose}
            className='text-(--text-secondary) hover:text-(--text-primary) p-1'
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className='text-sm text-(--text-secondary) py-4'>Loading...</div>
        ) : (
          <>
            {items.length > 0 && (
              <div className='space-y-1 mb-3'>
                {items.map((item: any, index: number) => (
                  <div key={index} className='text-xs py-1.5 px-2 bg-(--background-secondary) rounded flex flex-col gap-0.5'>
                    <span className='font-medium'>{item.title || item.reference_id || 'N/A'}</span>
                    {item.amount && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Amount: RM {item.amount.toLocaleString()}
                      </span>
                    )}
                    {item.monthly_rent && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Rent: RM {item.monthly_rent.toLocaleString()}/mo
                      </span>
                    )}
                    {item.tenant && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Tenant: {item.tenant}
                      </span>
                    )}
                    {item.property && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Property: {item.property}
                      </span>
                    )}
                    {item.room && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Room: {item.room}
                      </span>
                    )}
                    {item.status && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Status: {item.status}
                      </span>
                    )}
                    {item.priority && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Priority: {item.priority}
                      </span>
                    )}
                    {item.type && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Type: {item.type}
                      </span>
                    )}
                    {item.category && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Category: {item.category}
                      </span>
                    )}
                    {item.description && (
                      <span className='text-[10px] text-(--text-secondary)'>{item.description}</span>
                    )}
                    {item.due_date && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        Due: {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {item.created_by && (
                      <span className='text-[10px] text-(--text-secondary)'>
                        By: {item.created_by}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(chip.hasViewAll && chip.viewAllUrl) || hasMore ? (
              <div className='flex items-center gap-3'>
                {chip.hasViewAll && chip.viewAllUrl && (
                  <a
                    href={(() => {
                      if (!chip.date) return chip.viewAllUrl!
                      if (chip.type === 'payment') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Pending`
                      if (chip.type === 'expense' && chip.category) return `${chip.viewAllUrl}?due_date=${chip.date}&category=${chip.category}`
                      if (chip.type === 'expense') return `${chip.viewAllUrl}?due_date=${chip.date}`
                      if (chip.type === 'task') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Open`
                      if (chip.type === 'assignment_request') return `${chip.viewAllUrl}?status=Pending My Assignment`
                      return `${chip.viewAllUrl}?due_date=${chip.date}`
                    })()}
                    className='text-xs text-(--primary-main) hover:underline font-medium'
                  >
                    View all →
                  </a>
                )}
                {hasMore && (
                  <span className='text-[10px] text-(--text-secondary)'>
                    Showing 10 of {chip.count}
                  </span>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
