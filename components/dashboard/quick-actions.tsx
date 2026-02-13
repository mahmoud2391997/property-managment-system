'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Home,
  DoorOpen,
  FileText,
  FileSignature,
  Receipt,
  Wallet,
  Users,
  UserPlus,
  UserCog,
  ClipboardList,
  TicketCheck,
  FolderPlus,
  Eye,
  CalendarPlus,
  Plus,
  ChevronLeft,
  Search,
  Loader2,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface PropertyOption {
  id: string
  name: string
}

type PickerTarget = 'property' | 'room'

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  category: string
  type: 'page' | 'dialog'
  /** Needs a property/room selection before proceeding */
  needsProperty?: boolean
  /** Also supports rooms (shows type picker first) */
  supportsRoom?: boolean
  buildUrl?: (id: string) => string
  buildRoomUrl?: (id: string) => string
}

interface QuickActionsProps {
  onDialogAction: (actionId: string, propertyId?: string, roomId?: string) => void
  className?: string
}

// ── Action definitions ─────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-property', label: 'Add Property', icon: Home, category: 'Properties', type: 'page', buildUrl: () => '/properties/add-property' },
  { id: 'add-room', label: 'Add Room', icon: DoorOpen, category: 'Properties', type: 'page', buildUrl: () => '/rooms/add-room' },

  { id: 'add-lease', label: 'Add Lease', icon: FileText, category: 'Leases & Bookings', type: 'page', needsProperty: true, supportsRoom: true, buildUrl: (pid) => `/properties/${pid}/leases/add-lease`, buildRoomUrl: (rid) => `/rooms/${rid}/leases/add-lease` },
  { id: 'add-booking', label: 'Add Booking', icon: CalendarPlus, category: 'Leases & Bookings', type: 'dialog', needsProperty: true, supportsRoom: true },

  { id: 'add-contract', label: 'Add Contract', icon: FileSignature, category: 'Contracts', type: 'page', needsProperty: true, buildUrl: (pid) => `/properties/${pid}/contracts/add-contract` },

  { id: 'add-payment', label: 'Add Payment', icon: Receipt, category: 'Transactions', type: 'page', buildUrl: () => '/payments/add-payment' },
  { id: 'add-expense', label: 'Add Expense', icon: Wallet, category: 'Transactions', type: 'page', buildUrl: () => '/expenses/add-expense' },

  { id: 'add-tenant', label: 'Add Tenant', icon: Users, category: 'People', type: 'dialog' },
  { id: 'add-owner', label: 'Add Owner', icon: UserPlus, category: 'People', type: 'dialog' },
  { id: 'add-staff', label: 'Add Staff', icon: UserCog, category: 'People', type: 'dialog' },

  { id: 'add-task', label: 'Add Task', icon: ClipboardList, category: 'Work Operations', type: 'dialog' },
  { id: 'add-ticket', label: 'Add Ticket', icon: TicketCheck, category: 'Work Operations', type: 'dialog' },

  { id: 'add-project', label: 'Add Project', icon: FolderPlus, category: 'Other', type: 'dialog' },
  { id: 'add-view', label: 'Add View', icon: Eye, category: 'Other', type: 'dialog' },
]

const CATEGORIES = [...new Set(QUICK_ACTIONS.map((a) => a.category))]

const itemClass = cn(
  'flex items-center gap-3 w-full px-2.5 py-2 rounded-lg',
  'hover:bg-(--background-tertiary) active:bg-(--background-tertiary)/80',
  'transition-colors cursor-pointer text-left',
)

// ── Steps ──────────────────────────────────────────────────────────────
// actions        → main action list
// pick-type      → "For a Property" / "For a Room" (only if supportsRoom)
// pick-item      → search + select a property or room

type Step = 'actions' | 'pick-type' | 'pick-item'

// ── Component ──────────────────────────────────────────────────────────

export function QuickActions({
  onDialogAction,
  className,
}: QuickActionsProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('actions')
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('property')
  const [search, setSearch] = useState('')

  // Cached API data
  const [propertyItems, setPropertyItems] = useState<PropertyOption[]>([])
  const [roomItems, setRoomItems] = useState<PropertyOption[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const fetchedRef = useRef<{ properties: boolean; rooms: boolean }>({ properties: false, rooms: false })

  const fetchItems = useCallback(async (target: PickerTarget) => {
    if (target === 'property' && fetchedRef.current.properties) return
    if (target === 'room' && fetchedRef.current.rooms) return

    setLoadingItems(true)
    try {
      if (target === 'property') {
        const res = await fetch('/api/properties?fields=id,code')
        const data = await res.json()
        if (data.success && data.properties) {
          setPropertyItems(data.properties.map((p: any) => ({ id: p.id, name: p.code })))
        }
        fetchedRef.current.properties = true
      } else {
        const res = await fetch('/api/rooms?fields=id,title,property_id')
        const data = await res.json()
        if (data.success && data.rooms) {
          setRoomItems(data.rooms.map((r: any) => ({ id: r.id, name: r.title })))
        }
        fetchedRef.current.rooms = true
      }
    } catch {
      // silently fail
    } finally {
      setLoadingItems(false)
    }
  }, [])

  // Fetch when entering the item picker
  useEffect(() => {
    if (step === 'pick-item') {
      fetchItems(pickerTarget)
    }
  }, [step, pickerTarget, fetchItems])

  const reset = useCallback(() => {
    setStep('actions')
    setPendingAction(null)
    setPickerTarget('property')
    setSearch('')
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) reset()
    },
    [reset],
  )

  // Action clicked that needs property/room
  const handleNeedsProperty = (action: QuickAction) => {
    setPendingAction(action)
    if (action.supportsRoom) {
      setStep('pick-type')
    } else {
      // property-only (e.g. Add Contract) → skip type step
      setPickerTarget('property')
      setStep('pick-item')
      setSearch('')
    }
  }

  // Type chosen (property or room)
  const handleTypeChosen = (target: PickerTarget) => {
    setPickerTarget(target)
    setStep('pick-item')
    setSearch('')
  }

  // Go back one step
  const handleBack = () => {
    if (step === 'pick-item' && pendingAction?.supportsRoom) {
      setStep('pick-type')
      setSearch('')
    } else {
      reset()
    }
  }

  const handleDialogClick = (actionId: string) => {
    onDialogAction(actionId)
    handleOpenChange(false)
  }

  // Build URL for property/room selection
  const getItemUrl = (item: PropertyOption) => {
    if (!pendingAction) return '#'
    if (pickerTarget === 'room' && pendingAction.buildRoomUrl) {
      return pendingAction.buildRoomUrl(item.id)
    }
    return pendingAction.buildUrl?.(item.id) ?? '#'
  }

  // Handle dialog action after item selection
  const handleItemDialogSelect = (item: PropertyOption) => {
    if (!pendingAction) return
    if (pickerTarget === 'room') {
      onDialogAction(pendingAction.id, undefined, item.id)
    } else {
      onDialogAction(pendingAction.id, item.id)
    }
    handleOpenChange(false)
  }

  const items = pickerTarget === 'property' ? propertyItems : roomItems
  const filteredItems = items.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-(--primary-color) text-white',
            'hover:bg-(--primary-color)/90 active:bg-(--primary-color)/80',
            'transition-colors cursor-pointer',
            'texts-label-small',
            className,
          )}
        >
          <Plus className="w-4 h-4" />
          Quick Actions
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72 p-0 shadow-lg border border-(--border-default) rounded-xl overflow-hidden"
      >
        {/* ── Step 1: Action list ─────────────────────────── */}
        {step === 'actions' && (
          <div className="flex flex-col">
            <div className="px-4 pt-3 pb-2">
              <p className="texts-label-medium text-(--text-primary)">Quick Actions</p>
            </div>
            <div className="max-h-80 overflow-y-auto px-1.5 pb-1.5">
              {CATEGORIES.map((category) => {
                const actions = QUICK_ACTIONS.filter((a) => a.category === category)
                return (
                  <div key={category}>
                    <p className="texts-caption-large text-(--text-muted) px-2.5 pt-2.5 pb-1">
                      {category}
                    </p>
                    {actions.map((action) => {
                      const inner = (
                        <>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                            <action.icon className="w-4 h-4 text-(--text-secondary)" />
                          </div>
                          <span className="texts-body-medium-medium text-(--text-primary)">
                            {action.label}
                          </span>
                        </>
                      )

                      if (action.needsProperty) {
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleNeedsProperty(action)}
                            className={itemClass}
                          >
                            {inner}
                          </button>
                        )
                      }

                      if (action.type === 'page' && action.buildUrl) {
                        return (
                          <Link
                            key={action.id}
                            href={action.buildUrl('')}
                            onClick={() => handleOpenChange(false)}
                            className={itemClass}
                          >
                            {inner}
                          </Link>
                        )
                      }

                      return (
                        <button
                          key={action.id}
                          onClick={() => handleDialogClick(action.id)}
                          className={itemClass}
                        >
                          {inner}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Pick type (Property or Room) ────────── */}
        {step === 'pick-type' && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <button
                onClick={reset}
                className="p-1 rounded-md hover:bg-(--background-tertiary) transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-(--text-secondary)" />
              </button>
              <div>
                <p className="texts-label-medium text-(--text-primary)">
                  {pendingAction?.label}
                </p>
                <p className="texts-caption-large text-(--text-muted)">
                  For a property or room?
                </p>
              </div>
            </div>
            <div className="px-1.5 pb-2 flex flex-col gap-0.5">
              <button
                onClick={() => handleTypeChosen('property')}
                className={itemClass}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                  <Home className="w-4 h-4 text-(--text-secondary)" />
                </div>
                <span className="texts-body-medium-medium text-(--text-primary)">
                  For a Property
                </span>
              </button>
              <button
                onClick={() => handleTypeChosen('room')}
                className={itemClass}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                  <DoorOpen className="w-4 h-4 text-(--text-secondary)" />
                </div>
                <span className="texts-body-medium-medium text-(--text-primary)">
                  For a Room
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Pick item (property or room list) ───── */}
        {step === 'pick-item' && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
              <button
                onClick={handleBack}
                className="p-1 rounded-md hover:bg-(--background-tertiary) transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-(--text-secondary)" />
              </button>
              <div>
                <p className="texts-label-medium text-(--text-primary)">
                  Select {pickerTarget === 'room' ? 'Room' : 'Property'}
                </p>
                <p className="texts-caption-large text-(--text-muted)">
                  for {pendingAction?.label}
                </p>
              </div>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border-default) bg-(--background-primary)">
                <Search className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${pickerTarget === 'room' ? 'rooms' : 'properties'}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent texts-body-small text-(--text-primary) placeholder:text-(--text-muted) outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
              {loadingItems ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-(--text-muted) animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="texts-caption-large text-(--text-muted) text-center py-6">
                  No {pickerTarget === 'room' ? 'rooms' : 'properties'} found
                </p>
              ) : (
                filteredItems.map((item) => {
                  const inner = (
                    <>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                        {pickerTarget === 'room' ? (
                          <DoorOpen className="w-4 h-4 text-(--text-secondary)" />
                        ) : (
                          <Home className="w-4 h-4 text-(--text-secondary)" />
                        )}
                      </div>
                      <span className="texts-body-medium-medium text-(--text-primary)">
                        {item.name}
                      </span>
                    </>
                  )

                  if (pendingAction?.type === 'page') {
                    return (
                      <Link
                        key={item.id}
                        href={getItemUrl(item)}
                        onClick={() => handleOpenChange(false)}
                        className={itemClass}
                      >
                        {inner}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemDialogSelect(item)}
                      className={itemClass}
                    >
                      {inner}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
