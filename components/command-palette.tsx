'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/contexts/command-palette-context'
import { useSidebar } from '@/components/ui/sidebar'
import { usePermissions } from '@/hooks/use-permissions'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
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
  FolderPlus,
  Eye,
  CalendarPlus,
  Search,
  ChevronLeft,
  Loader2,
  PenLine,
  Upload,
  UserCheck,
  Store,
  ArrowLeftRight,
  CalendarX2,
  TrendingUp,
  Crown,
  type LucideIcon,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

interface PickerItem {
  id: string
  name: string
  subtitle?: string
}

type PickerTarget = 'property' | 'room'

interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  category: string
  type: 'page' | 'dialog'
  needsProperty?: boolean
  supportsRoom?: boolean
  /** Skip type picker and go straight to room picker */
  roomOnly?: boolean
  /** Actions that require vacancy check (no current lease/booking) */
  vacantOnly?: boolean
  /** Actions that require selecting a lease after property/room */
  needsLease?: boolean
  buildUrl?: (id: string) => string
  buildRoomUrl?: (id: string) => string
  buildLeaseUrl?: (itemId: string, leaseId: string) => string
  buildLeaseRoomUrl?: (roomId: string, leaseId: string) => string
  /** Permission required to show this action */
  permission?: string
}

// ── Action definitions ─────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  // Properties
  { id: 'add-property', label: 'Add Property', icon: Home, category: 'Properties', type: 'page', permission: 'properties.create', buildUrl: () => '/properties/add-property' },
  { id: 'add-room', label: 'Add Room', icon: DoorOpen, category: 'Properties', type: 'page', permission: 'rooms.create', buildUrl: () => '/rooms/add-room' },
  { id: 'edit-property', label: 'Edit Property', icon: PenLine, category: 'Properties', type: 'page', needsProperty: true, permission: 'properties.update', buildUrl: (pid) => `/properties/${pid}/edit` },
  { id: 'edit-room', label: 'Edit Room', icon: PenLine, category: 'Properties', type: 'page', needsProperty: true, roomOnly: true, permission: 'rooms.update', buildRoomUrl: (rid) => `/rooms/${rid}/edit` },
  { id: 'import-properties', label: 'Import Properties', icon: Upload, category: 'Properties', type: 'page', permission: 'properties.create', buildUrl: () => '/properties/import-properties' },
  { id: 'import-rooms', label: 'Import Rooms', icon: Upload, category: 'Properties', type: 'page', permission: 'rooms.create', buildUrl: () => '/rooms/import-rooms' },
  { id: 'assign-owner', label: 'Assign Owner', icon: Crown, category: 'Properties', type: 'dialog', needsProperty: true, permission: 'properties.assign_owner' },
  { id: 'add-view', label: 'Record View', icon: Eye, category: 'Properties', type: 'dialog', needsProperty: true, supportsRoom: true, permission: 'views.create' },

  // Leases
  { id: 'add-lease', label: 'Add Lease', icon: FileText, category: 'Leases', type: 'page', needsProperty: true, supportsRoom: true, vacantOnly: true, permission: 'leases.create', buildUrl: (pid) => `/properties/${pid}/leases/add-lease`, buildRoomUrl: (rid) => `/rooms/${rid}/leases/add-lease` },
  { id: 'transfer-lease', label: 'Transfer Lease', icon: ArrowLeftRight, category: 'Leases', type: 'page', needsProperty: true, supportsRoom: true, needsLease: true, permission: 'leases.transfer', buildLeaseUrl: (pid, lid) => `/properties/${pid}/leases/${lid}/transfer`, buildLeaseRoomUrl: (rid, lid) => `/rooms/${rid}/leases/${lid}/transfer` },
  { id: 'schedule-lease-end', label: 'Schedule Lease End', icon: CalendarX2, category: 'Leases', type: 'dialog', needsProperty: true, supportsRoom: true, needsLease: true, permission: 'leases.end' },
  { id: 'schedule-rental-change', label: 'Schedule Rental Change', icon: TrendingUp, category: 'Leases', type: 'dialog', needsProperty: true, supportsRoom: true, needsLease: true, permission: 'leases.update' },

  // Bookings
  { id: 'add-booking', label: 'Add Booking', icon: CalendarPlus, category: 'Bookings', type: 'dialog', needsProperty: true, supportsRoom: true, vacantOnly: true, permission: 'bookings.create' },

  // Contracts
  { id: 'add-contract', label: 'Add Contract', icon: FileSignature, category: 'Contracts', type: 'page', needsProperty: true, permission: 'contracts.create', buildUrl: (pid) => `/properties/${pid}/contracts/add-contract` },

  // Payments
  { id: 'add-payment', label: 'Add Payment', icon: Receipt, category: 'Payments', type: 'page', permission: 'payments.create', buildUrl: () => '/payments/add-payment' },

  // Expenses
  { id: 'add-expense', label: 'Add Expense', icon: Wallet, category: 'Expenses', type: 'page', permission: 'expenses.create', buildUrl: () => '/expenses/add-expense' },

  // Tenants
  { id: 'add-tenant', label: 'Add Tenant', icon: Users, category: 'Tenants', type: 'dialog', permission: 'tenants.create' },
  { id: 'import-tenants', label: 'Import Tenants', icon: Upload, category: 'Tenants', type: 'page', permission: 'tenants.create', buildUrl: () => '/tenants/import-tenants' },

  // Owners
  { id: 'add-owner', label: 'Add Owner', icon: UserPlus, category: 'Owners', type: 'dialog', permission: 'owners.create' },

  // Agents
  { id: 'add-agent', label: 'Add Agent', icon: UserCheck, category: 'Agents', type: 'dialog', permission: 'agents.create' },

  // Vendors
  { id: 'add-vendor', label: 'Add Vendor', icon: Store, category: 'Vendors', type: 'dialog', permission: 'vendors.create' },

  // Staff
  { id: 'add-staff', label: 'Add Staff', icon: UserCog, category: 'Staff', type: 'dialog', permission: 'staff.create' },

  // Tasks
  { id: 'add-task', label: 'Add Task', icon: ClipboardList, category: 'Tasks', type: 'dialog', permission: 'tasks.create' },

  // Projects
  { id: 'add-project', label: 'Add Project', icon: FolderPlus, category: 'Projects', type: 'dialog', permission: 'projects.create' },
]

type Step = 'actions' | 'pick-type' | 'pick-item' | 'pick-lease'

const itemClass = cn(
  'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
  'hover:bg-(--background-tertiary) active:bg-(--background-tertiary)/80',
  'transition-colors cursor-pointer text-left',
)

// ── Command Palette Component ──────────────────────────────────────────

export function CommandPalette() {
  const { commandOpen, setCommandOpen, openDialog } = useCommandPalette()
  const { isMobile, setOpenMobile } = useSidebar()
  const { can, isLoading } = usePermissions()

  const [step, setStep] = useState<Step>('actions')
  const [pendingAction, setPendingAction] = useState<QuickAction | null>(null)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('property')
  const [search, setSearch] = useState('')

  // Picker data (properties/rooms)
  const [pickerItems, setPickerItems] = useState<PickerItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Lease picker data
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [leaseItems, setLeaseItems] = useState<PickerItem[]>([])
  const [loadingLeases, setLoadingLeases] = useState(false)

  const filteredActions = QUICK_ACTIONS.filter(a => !a.permission || can(a.permission))
  const categories = [...new Set(filteredActions.map((a) => a.category))]

  // Fetch properties or rooms based on action context
  const fetchItems = useCallback(async (target: PickerTarget, action: QuickAction | null) => {
    setLoadingItems(true)
    setPickerItems([])
    try {
      if (target === 'property') {
        const params = new URLSearchParams({ fields: 'id,code', includeProject: 'true' })
        if (action?.vacantOnly) params.set('vacant', 'true')
        const res = await fetch(`/api/properties?${params}`)
        const data = await res.json()
        if (data.success && data.properties) {
          setPickerItems(data.properties.map((p: any) => ({
            id: p.id,
            name: p.code,
            subtitle: p.projects?.title || undefined,
          })))
        }
      } else {
        const params = new URLSearchParams({ fields: 'id,title', includeProperty: 'true' })
        if (action?.vacantOnly) params.set('vacant', 'true')
        const res = await fetch(`/api/rooms?${params}`)
        const data = await res.json()
        if (data.success && data.rooms) {
          setPickerItems(data.rooms.map((r: any) => ({
            id: r.id,
            name: r.title,
            subtitle: r.properties?.code || undefined,
          })))
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingItems(false)
    }
  }, [])

  // Fetch leases for a selected property/room
  const fetchLeases = useCallback(async (target: PickerTarget, itemId: string) => {
    setLoadingLeases(true)
    setLeaseItems([])
    try {
      const params = new URLSearchParams({ all: 'true', includeTenant: 'true' })
      if (target === 'property') {
        params.set('propertyId', itemId)
      } else {
        params.set('roomId', itemId)
      }
      const res = await fetch(`/api/leases?${params}`)
      const data = await res.json()
      if (data.leases) {
        setLeaseItems(data.leases.map((l: any) => ({
          id: l.id,
          name: l.reference_id,
          subtitle: l.tenant || (l.room ? `${l.property?.code} · ${l.room.title}` : l.property?.code) || undefined,
        })))
      }
    } catch {
      // silently fail
    } finally {
      setLoadingLeases(false)
    }
  }, [])

  // Fetch when entering the item picker
  useEffect(() => {
    if (step === 'pick-item') {
      fetchItems(pickerTarget, pendingAction)
    }
  }, [step, pickerTarget, pendingAction, fetchItems])

  // Fetch when entering the lease picker
  useEffect(() => {
    if (step === 'pick-lease' && selectedItemId) {
      fetchLeases(pickerTarget, selectedItemId)
    }
  }, [step, selectedItemId, pickerTarget, fetchLeases])

  const reset = useCallback(() => {
    setStep('actions')
    setPendingAction(null)
    setPickerTarget('property')
    setSearch('')
    setPickerItems([])
    setSelectedItemId(null)
    setLeaseItems([])
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setCommandOpen(nextOpen)
      if (!nextOpen) reset()
    },
    [reset, setCommandOpen],
  )

  const close = useCallback(() => {
    handleOpenChange(false)
    if (isMobile) setOpenMobile(false)
  }, [handleOpenChange, isMobile, setOpenMobile])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleOpenChange(!commandOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandOpen, handleOpenChange])

  // ── Action handlers ───────────────────────────────────────────────

  const handleActionSelect = (action: QuickAction) => {
    if (action.needsProperty) {
      setPendingAction(action)

      // roomOnly → skip type picker, go directly to room picker
      if (action.roomOnly) {
        setPickerTarget('room')
        setStep('pick-item')
        setSearch('')
        return
      }

      if (action.supportsRoom) {
        setStep('pick-type')
      } else {
        setPickerTarget('property')
        setStep('pick-item')
      }
      setSearch('')
      return
    }

    if (action.type === 'dialog') {
      openDialog(action.id)
      close()
      return
    }

    // Page actions without property are handled by Link directly
    close()
  }

  const handleTypeChosen = (target: PickerTarget) => {
    setPickerTarget(target)
    setStep('pick-item')
    setSearch('')
  }

  const handleBack = () => {
    if (step === 'pick-lease') {
      setStep('pick-item')
      setSearch('')
      setLeaseItems([])
      setSelectedItemId(null)
    } else if (step === 'pick-item' && pendingAction?.supportsRoom && !pendingAction?.roomOnly) {
      setStep('pick-type')
      setSearch('')
      setPickerItems([])
    } else {
      reset()
    }
  }

  // When an item (property/room) is selected in step 3
  const handleItemSelect = (item: PickerItem) => {
    if (!pendingAction) return

    // If action needs lease, go to lease picker
    if (pendingAction.needsLease) {
      setSelectedItemId(item.id)
      setStep('pick-lease')
      setSearch('')
      return
    }

    // Dialog action
    if (pendingAction.type === 'dialog') {
      if (pickerTarget === 'room') {
        openDialog(pendingAction.id, undefined, item.id)
      } else {
        openDialog(pendingAction.id, item.id)
      }
      close()
      return
    }

    // Page action - close (Link handles navigation)
    close()
  }

  // When a lease is selected in step 4
  const handleLeaseSelect = (lease: PickerItem) => {
    if (!pendingAction || !selectedItemId) return

    if (pendingAction.type === 'dialog') {
      if (pickerTarget === 'room') {
        openDialog(pendingAction.id, undefined, selectedItemId, lease.id)
      } else {
        openDialog(pendingAction.id, selectedItemId, undefined, lease.id)
      }
      close()
    }
    // Page actions handled by Link in the UI
  }

  const getItemUrl = (item: PickerItem) => {
    if (!pendingAction) return '#'
    if (pickerTarget === 'room' && pendingAction.buildRoomUrl) {
      return pendingAction.buildRoomUrl(item.id)
    }
    return pendingAction.buildUrl?.(item.id) ?? '#'
  }

  const getLeaseUrl = (lease: PickerItem) => {
    if (!pendingAction || !selectedItemId) return '#'
    if (pickerTarget === 'room' && pendingAction.buildLeaseRoomUrl) {
      return pendingAction.buildLeaseRoomUrl(selectedItemId, lease.id)
    }
    return pendingAction.buildLeaseUrl?.(selectedItemId, lease.id) ?? '#'
  }

  const filteredItems = search
    ? pickerItems.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : pickerItems

  const filteredLeases = search
    ? leaseItems.filter((l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : leaseItems

  const emptyMessage = pendingAction?.vacantOnly
    ? `No vacant ${pickerTarget === 'room' ? 'rooms' : 'properties'} available`
    : `No ${pickerTarget === 'room' ? 'rooms' : 'properties'} found`

  if (isLoading) return null

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={handleOpenChange}
      title="Command Palette"
      description="Search for an action..."
      showCloseButton={false}
      className="max-w-[520px] rounded-xl! border border-(--border-default) shadow-2xl overflow-hidden"
    >
      {/* ── Step 1: Action list ─────────────────────────── */}
      {step === 'actions' && (
        <>
          <CommandInput
            placeholder="What do you need?"
            className="texts-body-medium"
          />
          <CommandList className="max-h-[360px]">
            <CommandEmpty className="py-8 text-center">
              <span className="texts-body-medium text-(--text-muted)">
                {filteredActions.length === 0 ? 'No actions available.' : 'No actions found.'}
              </span>
            </CommandEmpty>
            {categories.map((category, catIdx) => {
              const actions = filteredActions.filter((a) => a.category === category)
              return (
                <div key={category}>
                  {catIdx > 0 && <CommandSeparator />}
                  <CommandGroup heading={category}>
                    {actions.map((action) => {
                      const inner = (
                        <>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary) shrink-0">
                            <action.icon className="w-4 h-4 text-(--text-secondary)" />
                          </div>
                          <span className="texts-body-medium-medium text-(--text-primary)">
                            {action.label}
                          </span>
                        </>
                      )

                      // Page action without property → use Link
                      if (action.type === 'page' && !action.needsProperty && action.buildUrl) {
                        return (
                          <CommandItem
                            key={action.id}
                            value={`${action.label} ${action.category}`}
                            onSelect={() => close()}
                            className="p-0! rounded-lg cursor-pointer"
                          >
                            <Link
                              href={action.buildUrl('')}
                              onClick={close}
                              className="flex items-center gap-3 w-full px-3 py-2.5"
                            >
                              {inner}
                            </Link>
                          </CommandItem>
                        )
                      }

                      // Needs property or dialog action → button handler
                      return (
                        <CommandItem
                          key={action.id}
                          value={`${action.label} ${action.category}`}
                          onSelect={() => handleActionSelect(action)}
                          className="gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                        >
                          {inner}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </div>
              )
            })}
          </CommandList>
        </>
      )}

      {/* ── Step 2: Pick type (Property or Room) ────────── */}
      {step === 'pick-type' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-default)">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-(--background-tertiary) transition-colors cursor-pointer"
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
          <div className="p-2 flex flex-col gap-1">
            <button onClick={() => handleTypeChosen('property')} className={itemClass}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                <Home className="w-4 h-4 text-(--text-secondary)" />
              </div>
              <span className="texts-body-medium-medium text-(--text-primary)">For a Property</span>
            </button>
            <button onClick={() => handleTypeChosen('room')} className={itemClass}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary)">
                <DoorOpen className="w-4 h-4 text-(--text-secondary)" />
              </div>
              <span className="texts-body-medium-medium text-(--text-primary)">For a Room</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Pick item (property or room list) ───── */}
      {step === 'pick-item' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-default)">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-(--background-tertiary) transition-colors cursor-pointer"
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

          <div className="px-3 py-2 border-b border-(--border-default)">
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

          <div className="max-h-[280px] overflow-y-auto p-2">
            {loadingItems ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-(--text-muted) animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="texts-body-small text-(--text-muted) text-center py-8">
                {emptyMessage}
              </p>
            ) : (
              filteredItems.map((item) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary) shrink-0">
                      {pickerTarget === 'room' ? (
                        <DoorOpen className="w-4 h-4 text-(--text-secondary)" />
                      ) : (
                        <Home className="w-4 h-4 text-(--text-secondary)" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="texts-body-medium-medium text-(--text-primary) truncate">
                        {item.name}
                      </span>
                      {item.subtitle && (
                        <span className="texts-caption-large text-(--text-muted) truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </>
                )

                // If action needs lease → always button to go to lease picker
                if (pendingAction?.needsLease) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className={itemClass}
                    >
                      {inner}
                    </button>
                  )
                }

                // Page action → use Link
                if (pendingAction?.type === 'page') {
                  return (
                    <Link
                      key={item.id}
                      href={getItemUrl(item)}
                      onClick={close}
                      className={itemClass}
                    >
                      {inner}
                    </Link>
                  )
                }

                // Dialog action → button
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
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

      {/* ── Step 4: Pick lease ──────────────────────────── */}
      {step === 'pick-lease' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-default)">
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg hover:bg-(--background-tertiary) transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-(--text-secondary)" />
            </button>
            <div>
              <p className="texts-label-medium text-(--text-primary)">
                Select Lease
              </p>
              <p className="texts-caption-large text-(--text-muted)">
                for {pendingAction?.label}
              </p>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-(--border-default)">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border-default) bg-(--background-primary)">
              <Search className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
              <input
                type="text"
                placeholder="Search leases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent texts-body-small text-(--text-primary) placeholder:text-(--text-muted) outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[280px] overflow-y-auto p-2">
            {loadingLeases ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-(--text-muted) animate-spin" />
              </div>
            ) : filteredLeases.length === 0 ? (
              <p className="texts-body-small text-(--text-muted) text-center py-8">
                No active leases found
              </p>
            ) : (
              filteredLeases.map((lease) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-(--background-tertiary) shrink-0">
                      <FileText className="w-4 h-4 text-(--text-secondary)" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="texts-body-medium-medium text-(--text-primary) truncate">
                        {lease.name}
                      </span>
                      {lease.subtitle && (
                        <span className="texts-caption-large text-(--text-muted) truncate">
                          {lease.subtitle}
                        </span>
                      )}
                    </div>
                  </>
                )

                // Page action → use Link
                if (pendingAction?.type === 'page') {
                  return (
                    <Link
                      key={lease.id}
                      href={getLeaseUrl(lease)}
                      onClick={close}
                      className={itemClass}
                    >
                      {inner}
                    </Link>
                  )
                }

                // Dialog action → button
                return (
                  <button
                    key={lease.id}
                    onClick={() => handleLeaseSelect(lease)}
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
    </CommandDialog>
  )
}

// ── Search Trigger (for sidebar) ────────────────────────────────────

export function CommandPaletteTrigger() {
  const { setCommandOpen } = useCommandPalette()
  const { open: isSidebarOpen, isMobile } = useSidebar()
  const effectiveSidebarOpen = isMobile ? true : isSidebarOpen

  return (
    <button
      onClick={() => setCommandOpen(true)}
      className={cn(
        'flex items-center w-full mb-1',
        'rounded-lg',
        'bg-neutral-100 hover:bg-neutral-200/70 active:bg-neutral-200',
        'transition-all cursor-pointer',
        'group',
        effectiveSidebarOpen
          ? 'gap-2 px-3 py-2'
          : 'justify-center px-2 py-2.5',
      )}
    >
      <Search className={cn(
        'shrink-0 text-neutral-400 group-hover:text-neutral-500 transition-colors',
        effectiveSidebarOpen ? 'w-3.5 h-3.5' : 'w-4 h-4',
      )} />
      {effectiveSidebarOpen && (
        <>
          <span className="texts-body-small text-neutral-400 flex-1 text-left">
            Search...
          </span>
          <kbd className={cn(
            'hidden md:inline-flex items-center',
            'px-1.5 py-0.5 rounded',
            'bg-white/80 border border-neutral-200',
            'text-[10px] text-neutral-400 leading-none',
            'font-medium tracking-wide',
          )}>
            <span className="text-[9px] mr-0.5">&#8984;</span>K
          </kbd>
        </>
      )}
    </button>
  )
}
