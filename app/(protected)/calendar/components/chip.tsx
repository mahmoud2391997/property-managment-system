'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Dialog from '@/components/costume-ui/dialog'
import {
  CircleDollarSign,
  Banknote,
  ListTodo,
  UserPlus,
  CalendarDays,
  KeyRound,
  DoorOpen,
  BellRing,
  TrendingUp,
  CalendarCheck,
  Calendar
} from 'lucide-react'

const chipIconMap: Record<string, React.ElementType> = {
  payment: CircleDollarSign,
  expense: Banknote,
  task: ListTodo,
  assignment_request: UserPlus,
  manual_event: CalendarDays,
  lease_start: KeyRound,
  lease_end: DoorOpen,
  expiry_reminder: BellRing,
  rent_change: TrendingUp,
  booking: CalendarCheck,
}

function ChipIcon({ type, className }: { type: string; className?: string }) {
  const Icon = chipIconMap[type] || Calendar
  
  return <Icon size={13} className={className} strokeWidth={2.5} />
}

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

const getChipStyles = (type: string, isOverdue: boolean) => {
  if (isOverdue) return 'bg-red-50 text-red-800 hover:bg-red-100 border-l-[3px] border-l-red-500 border-red-200/60'
  
  switch(type) {
    case 'payment':
      return 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 border-l-[3px] border-l-emerald-500 border-emerald-200/60'
    case 'expense':
      return 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border-l-[3px] border-l-orange-500 border-orange-200/60'
    case 'task':
      return 'bg-blue-50/80 text-blue-800 hover:bg-blue-100 border-l-[3px] border-l-blue-500 border-blue-200/60'
    case 'lease_start':
      return 'bg-teal-50/80 text-teal-800 hover:bg-teal-100 border-l-[3px] border-l-teal-500 border-teal-200/60'
    case 'lease_end':
      return 'bg-rose-50/80 text-rose-800 hover:bg-rose-100 border-l-[3px] border-l-rose-500 border-rose-200/60'
    case 'expiry_reminder':
    case 'assignment_request':
      return 'bg-amber-50/80 text-amber-800 hover:bg-amber-100 border-l-[3px] border-l-amber-500 border-amber-200/60'
    case 'rent_change':
      return 'bg-purple-50/80 text-purple-800 hover:bg-purple-100 border-l-[3px] border-l-purple-500 border-purple-200/60'
    case 'manual_event':
    case 'booking':
    default:
      return 'bg-slate-50/80 text-slate-800 hover:bg-slate-100 border-l-[3px] border-l-slate-500 border-slate-200/60'
  }
}

export function Chip({ chip, onClick }: ChipProps) {
  const isOverdue = chip.status === 'overdue'
  
  return (
    <button
      onClick={(e) => onClick(e, chip)}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1 border shadow-sm hover:shadow',
        getChipStyles(chip.type, isOverdue)
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1 w-full">
        <ChipIcon type={chip.type} className="shrink-0 opacity-80" />
        <span className="truncate">
          <span className='font-semibold'>{chip.count}</span> {chip.label}
          {chip.urgentCount !== undefined && chip.urgentCount > 0 && (
            <span className='text-red-600 font-semibold ml-1'>({chip.urgentCount} urgent)</span>
          )}
        </span>
      </div>
      {chip.total !== undefined && (
        <span className='opacity-80 font-medium shrink-0'>
          RM {chip.total.toLocaleString()}{(chip.type === 'lease_start' || chip.type === 'lease_end') ? '/mo' : ''}
        </span>
      )}
    </button>
  )
}

interface ChipDialogProps {
  chip: ChipData | null
  date: Date | null
  onClose: () => void
}

export function ChipDialog({ chip, date, onClose }: ChipDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (chip && date) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [chip, date])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

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
    if (chip && date) {
      loadSummary()
    }
  }, [chip, date, loadSummary])

  if (!chip || !date) return null

  const viewAllLink = (() => {
    if (!chip.viewAllUrl) return '#'
    if (!chip.date) return chip.viewAllUrl
    if (chip.type === 'payment') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Pending`
    if (chip.type === 'expense' && chip.category) return `${chip.viewAllUrl}?due_date=${chip.date}&category=${chip.category}`
    if (chip.type === 'expense') return `${chip.viewAllUrl}?due_date=${chip.date}`
    if (chip.type === 'task') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Open`
    if (chip.type === 'assignment_request') return `${chip.viewAllUrl}?due_date=${chip.date}&status=${encodeURIComponent('Pending My Assignment')}`
    return `${chip.viewAllUrl}?due_date=${chip.date}`
  })()

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`${chip.count} ${chip.label}`}
      cancelButtonLabel='Close'
      className='max-w-md!'
    >
      {isLoading ? (
        <div className='text-sm text-(--text-secondary) py-4'>Loading...</div>
      ) : (
        <div className='space-y-4'>
          {items.length > 0 && (
            <div className='space-y-1.5'>
              {items.map((item: any, index: number) => (
                <div key={index} className='text-xs py-2 px-3 bg-(--background-secondary) rounded flex flex-col gap-0.5'>
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
                  href={viewAllLink}
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
        </div>
      )}
    </Dialog>
  )
}

interface ChipsDialogProps {
  chips: ChipData[]
  date: Date | null
  onClose: () => void
}

export function ChipsDialog({ chips, date, onClose }: ChipsDialogProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (chips.length > 0 && date) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [chips, date])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  if (!date || chips.length === 0) return null

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`${date.toLocaleDateString()}`}
      cancelButtonLabel='Close'
      className='max-w-md!'
    >
      <div className='space-y-2'>
        {chips.map((chip, index) => {
          const isOverdue = chip.status === 'overdue'

          return (
            <div
              key={index}
              className={cn(
                'p-3 rounded-md border shadow-sm flex flex-col',
                getChipStyles(chip.type, isOverdue).replace('hover:', 'hover-disabled:') // reuse the same styles but remove hover for the container
              )}
            >
              <div className='flex items-center justify-between mb-1 gap-2'>
                <div className='flex items-center gap-1.5'>
                  <ChipIcon type={chip.type} className="opacity-80" />
                  <span className='font-semibold text-sm'>{chip.count} {chip.label}</span>
                  {chip.urgentCount !== undefined && chip.urgentCount > 0 && (
                    <span className='text-red-600 font-semibold text-xs ml-1'>({chip.urgentCount} urgent)</span>
                  )}
                </div>
                {chip.total !== undefined && (
                  <span className='opacity-80 font-medium text-xs'>RM {chip.total.toLocaleString()}{(chip.type === 'lease_start' || chip.type === 'lease_end') ? '/mo' : ''}</span>
                )}
              </div>
              {chip.hasViewAll && chip.viewAllUrl && (
                <a
                  href={(() => {
                    if (!chip.date) return chip.viewAllUrl
                    if (chip.type === 'payment') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Pending`
                    if (chip.type === 'expense' && chip.category) return `${chip.viewAllUrl}?due_date=${chip.date}&category=${chip.category}`
                    if (chip.type === 'expense') return `${chip.viewAllUrl}?due_date=${chip.date}`
                    if (chip.type === 'task') return `${chip.viewAllUrl}?due_date=${chip.date}&status=Open`
                    if (chip.type === 'assignment_request') return `${chip.viewAllUrl}?due_date=${chip.date}&status=${encodeURIComponent('Pending My Assignment')}`
                    return `${chip.viewAllUrl}?due_date=${chip.date}`
                  })()}
                  className='text-xs text-(--primary-main) hover:underline font-medium'
                >
                  View all →
                </a>
              )}
            </div>
          )
        })}
      </div>
    </Dialog>
  )
}
