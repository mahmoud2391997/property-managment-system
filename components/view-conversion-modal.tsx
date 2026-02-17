'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, Phone, Mail, Calendar, Check, UserX } from 'lucide-react'
import { formatDate } from '@/utils/formatTime'
import { cn } from '@/lib/utils'

type UndecidedView = {
  id: string
  reference_id: string
  first_name: string
  last_name: string | null
  phone_number: string | null
  email: string | null
  viewed_at: string
}

export type ViewDecision = {
  selectedViewId: string | null
  selectedViewName: string | null
  totalViews: number
}

type ViewConversionModalProps = {
  propertyId?: string
  roomId?: string
  canShow: boolean
  /** Increment to force re-open the modal */
  reopenKey?: number
  onDecisionMade: (decision: ViewDecision) => void
  /** Called when loading finishes and there are no undecided views */
  onNoViews?: () => void
}

const ViewConversionModal = ({
  propertyId,
  roomId,
  canShow,
  reopenKey = 0,
  onDecisionMade,
  onNoViews
}: ViewConversionModalProps) => {
  const [views, setViews] = useState<UndecidedView[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [noneSelected, setNoneSelected] = useState(false)
  const onNoViewsRef = useRef(onNoViews)
  onNoViewsRef.current = onNoViews

  // Notify parent when no views to show (wait for canShow so parent state is ready)
  useEffect(() => {
    if (!loading && views.length === 0 && canShow) {
      onNoViewsRef.current?.()
    }
  }, [loading, views.length, canShow])

  // Fetch undecided views
  useEffect(() => {
    const fetchViews = async () => {
      try {
        const param = roomId
          ? `roomId=${roomId}`
          : `propertyId=${propertyId}`
        const response = await fetch(`/api/views/undecided?${param}`)
        if (response.ok) {
          const data = await response.json()
          setViews(data.views)
        }
      } catch (error) {
        console.error('Error fetching undecided views:', error)
      } finally {
        setLoading(false)
      }
    }

    if (propertyId || roomId) {
      fetchViews()
    }
  }, [propertyId, roomId])

  // Show modal when views are loaded, there are undecided views, and parent says we can show
  useEffect(() => {
    if (!loading && views.length > 0 && canShow) {
      setOpen(true)
    }
  }, [loading, views, canShow])

  // Re-open when parent requests it
  useEffect(() => {
    if (reopenKey > 0 && views.length > 0) {
      setSelectedId(null)
      setNoneSelected(false)
      setOpen(true)
    }
  }, [reopenKey])

  const handleSelectView = (viewId: string) => {
    setSelectedId(viewId)
    setNoneSelected(false)
  }

  const handleSelectNone = () => {
    setSelectedId(null)
    setNoneSelected(true)
  }

  const handleConfirm = () => {
    const selectedView = selectedId ? views.find(v => v.id === selectedId) : null
    const selectedViewName = selectedView
      ? [selectedView.first_name, selectedView.last_name].filter(Boolean).join(' ')
      : null
    onDecisionMade({
      selectedViewId: selectedId,
      selectedViewName,
      totalViews: views.length
    })
    setOpen(false)
  }

  const hasSelection = selectedId !== null || noneSelected

  if (loading || views.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} className='sm:max-w-md' onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className='items-center text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 mb-1'>
            <Eye className='h-6 w-6 text-(--secondary-color)' strokeWidth={1.5} />
          </div>
          <DialogTitle>View Conversion</DialogTitle>
          <DialogDescription className='text-center'>
            There {views.length === 1 ? 'is' : 'are'}{' '}
            <span className='font-medium text-(--text-primary)'>{views.length}</span>{' '}
            recorded viewer{views.length === 1 ? '' : 's'} for this{' '}
            {roomId ? 'room' : 'property'}. Did any of them end up leasing?
          </DialogDescription>
        </DialogHeader>

        {/* Viewer Cards */}
        <div className='flex flex-col gap-2 max-h-[280px] overflow-y-auto p-1'>
          {views.map(view => {
            const isSelected = selectedId === view.id
            const fullName = [view.first_name, view.last_name].filter(Boolean).join(' ')

            return (
              <button
                key={view.id}
                type='button'
                onClick={() => handleSelectView(view.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                  'hover:border-(--secondary-color) hover:bg-teal-50',
                  isSelected
                    ? 'border-(--secondary-color) bg-teal-50 ring-1 ring-(--secondary-color)'
                    : 'border-(--border-default) bg-(--background-primary)'
                )}
              >
                {/* Selection indicator */}
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center w-5 h-5 rounded-full border-2 transition-all mt-0.5',
                    isSelected
                      ? 'border-(--secondary-color) bg-(--secondary-color)'
                      : 'border-(--border-strong)'
                  )}
                >
                  {isSelected && (
                    <Check className='w-3 h-3 text-white' strokeWidth={3} />
                  )}
                </div>

                {/* View details */}
                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm text-(--text-primary)'>
                      {fullName}
                    </span>
                    <span className='text-xs text-(--text-secondary)'>
                      {view.reference_id}
                    </span>
                  </div>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-1'>
                    <span className='flex items-center gap-1 text-xs text-(--text-secondary)'>
                      <Calendar className='w-3 h-3 shrink-0' />
                      {formatDate(view.viewed_at)}
                    </span>
                    {view.phone_number && (
                      <span className='flex items-center gap-1 text-xs text-(--text-secondary)'>
                        <Phone className='w-3 h-3 shrink-0' />
                        {view.phone_number}
                      </span>
                    )}
                    {view.email && (
                      <span className='flex items-center gap-1 text-xs text-(--text-secondary)'>
                        <Mail className='w-3 h-3 shrink-0' />
                        {view.email}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {/* None option */}
          <button
            type='button'
            onClick={handleSelectNone}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
              'hover:border-(--border-strong) hover:bg-(--background-secondary)',
              noneSelected
                ? 'border-(--primary-color) bg-(--background-secondary) ring-1 ring-(--primary-color)'
                : 'border-dashed border-(--border-default) bg-(--background-primary)'
            )}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-center w-5 h-5 rounded-full border-2 transition-all',
                noneSelected
                  ? 'border-(--primary-color) bg-(--primary-color)'
                  : 'border-(--border-strong)'
              )}
            >
              {noneSelected && (
                <Check className='w-3 h-3 text-white' strokeWidth={3} />
              )}
            </div>
            <div className='flex items-center gap-2'>
              <UserX className='w-4 h-4 text-(--text-secondary)' />
              <span className='text-sm text-(--text-secondary)'>
                No viewer ended up leasing
              </span>
            </div>
          </button>
        </div>

        <DialogFooter className='sm:justify-center pt-1'>
          <Button
            type='button'
            size='sm'
            onClick={handleConfirm}
            disabled={!hasSelection}
            className='w-full sm:w-auto'
          >
            {noneSelected ? 'Mark all as not converted' : 'Confirm selection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ViewConversionModal
