'use client'

import { useState, useEffect } from 'react'
import Dialog from '../costume-ui/dialog'
import InputGroup from '../costume-ui/input-group'
import Combobox from '../costume-ui/combobox'
import { FeedbackToasts } from '../costume-ui/feedback-toast'
import { ComboBoxitemsType } from '@/types'
import ConfirmationDialog from '../costume-ui/confirmation-dialog'

type Props = {
  propertyId: string
  currentOwnerId?: string | null
  hasActiveContract?: boolean
  trigger?: React.ReactElement
  onSuccess?: () => void
  controlledOpen?: boolean
  onControlledOpenChange?: (open: boolean) => void
}

export default function AssignOwnerDialog({
  propertyId,
  currentOwnerId,
  hasActiveContract = false,
  trigger,
  onSuccess,
  controlledOpen,
  onControlledOpenChange,
}: Props) {
  const [_open, _setOpen] = useState(false)
  const open = controlledOpen ?? _open
  const setOpen = (v: boolean) => {
    if (onControlledOpenChange) onControlledOpenChange(v)
    else _setOpen(v)
  }
  const [loading, setLoading] = useState(false)
  const [fetchingOwners, setFetchingOwners] = useState(true)
  const [ownerItems, setOwnerItems] = useState<ComboBoxitemsType[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)

  // Fetch owners when dialog opens
  useEffect(() => {
    if (open) {
      fetchOwners()
      setSelectedOwnerId(currentOwnerId || null)
    } else {
      setOwnerItems([])
      setSelectedOwnerId(null)
    }
  }, [open])

  const fetchOwners = async () => {
    setFetchingOwners(true)
    try {
      const response = await fetch('/api/contracts/owners')
      if (!response.ok) throw new Error('Failed to fetch owners')
      const data = await response.json()
      setOwnerItems(data.owners)
    } catch (error) {
      console.error('Error fetching owners:', error)
      FeedbackToasts.error('Failed to load owners')
      setOpen(false)
    } finally {
      setFetchingOwners(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOwnerId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/properties/${propertyId}/assign-owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: selectedOwnerId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign owner')
      }

      FeedbackToasts.updated('Owner')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error assigning owner:', error)
      FeedbackToasts.error(error.message || 'Failed to assign owner')
    } finally {
      setLoading(false)
    }
  }

  const handleUnassign = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/properties/${propertyId}/assign-owner`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: null })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unassign owner')
      }

      FeedbackToasts.updated('Owner', 'Owner unassigned successfully')
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Error unassigning owner:', error)
      FeedbackToasts.error(error.message || 'Failed to unassign owner')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !!selectedOwnerId && selectedOwnerId !== currentOwnerId

  return (
    <Dialog
      openDialogButton={trigger}
      title='Assign Owner'
      sub_title='Select an owner to assign to this property'
      saveButtonLabel={loading ? 'Assigning...' : 'Assign'}
      cancelButtonLabel='Cancel'
      loading={loading}
      disabled={!canSubmit}
      open={open}
      onOpenChange={setOpen}
      extraFooterContent={
        currentOwnerId ? (
          hasActiveContract ? (
            <button
              type='button'
              disabled
              className='texts-body-small-medium text-neutral-400 cursor-not-allowed'
              title='Cannot unassign owner while property has an active contract'
            >
              Unassign
            </button>
          ) : (
            <ConfirmationDialog
              openDialogButton={
                <button
                  type='button'
                  className='texts-body-small-medium text-red-600 hover:text-red-700 transition-colors'
                >
                  Unassign
                </button>
              }
              title='Unassign Owner'
              description='Are you sure you want to unassign the owner from this property?'
              onConfirm={handleUnassign}
              confirmButtonLabel='Unassign'
              confirmButtonLoadingLabel='Unassigning...'
              variant='confirm'
            />
          )
        ) : undefined
      }
    >
      <form id='dialog-form' onSubmit={handleSubmit} className='space-y-5'>
        {fetchingOwners ? (
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin h-6 w-6 border-2 border-(--primary-color) border-t-transparent rounded-full' />
          </div>
        ) : (
          <InputGroup label='Owner'>
            <Combobox
              items={ownerItems}
              searchPlaceholder='Search owners'
              variant='single'
              placeholder='Select owner'
              showAvatar
              value={selectedOwnerId || undefined}
              onValueChange={value => setSelectedOwnerId(value || null)}
            />
          </InputGroup>
        )}
      </form>
    </Dialog>
  )
}
