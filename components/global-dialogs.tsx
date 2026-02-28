'use client'

import { useState, useCallback } from 'react'
import { useCommandPalette } from '@/contexts/command-palette-context'
import Dialog from '@/components/costume-ui/dialog'
import AddTask from '@/components/add-task'
import AddTenant from '@/components/add-tenant'
import AddOwner from '@/components/add-owner'
import AddStaff from '@/components/add-staff'
import AddProject from '@/components/add-project'
import AddAgent from '@/components/add-agent'
import AddVendor from '@/components/add-vendor'
import AddView from '@/components/add-view'
import AddBookingWizard from '@/components/add-booking-wizard'
import ScheduleLeaseEndDialog from '@/components/dialogs/schedule-lease-end-dialog'
import ScheduleRentalChangeDialog from '@/components/dialogs/schedule-rental-change-dialog'
import AssignOwnerDialog from '@/components/dialogs/assign-owner-dialog'

export default function GlobalDialogs() {
  const { activeDialog, dialogProps, closeDialog } = useCommandPalette()
  const [dialogLoading, setDialogLoading] = useState(false)

  const handleClose = useCallback(() => {
    setDialogLoading(false)
    closeDialog()
  }, [closeDialog])

  return (
    <>
      {/* Add Task */}
      <Dialog
        open={activeDialog === 'add-task'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Task"
        saveButtonLabel={dialogLoading ? 'Creating...' : 'Create Task'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddTask onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Tenant */}
      <Dialog
        open={activeDialog === 'add-tenant'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Tenant"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddTenant onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Owner */}
      <Dialog
        open={activeDialog === 'add-owner'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Owner"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddOwner onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Agent */}
      <Dialog
        open={activeDialog === 'add-agent'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Agent"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddAgent onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Vendor */}
      <Dialog
        open={activeDialog === 'add-vendor'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Vendor"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddVendor onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Staff */}
      <Dialog
        open={activeDialog === 'add-staff'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Staff"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
        className="max-w-150!"
      >
        <AddStaff onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Add Project */}
      <Dialog
        open={activeDialog === 'add-project'}
        onOpenChange={(open) => !open && handleClose()}
        title="Add Project"
        saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
        loading={dialogLoading}
      >
        <AddProject onLoadingChange={setDialogLoading} onSuccess={handleClose} />
      </Dialog>

      {/* Record View (needs propertyId or roomId) */}
      {(activeDialog === 'add-view' && (dialogProps.propertyId || dialogProps.roomId)) && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && handleClose()}
          title="Record View"
          saveButtonLabel={dialogLoading ? 'Saving...' : 'Save'}
          loading={dialogLoading}
          className="max-w-150!"
        >
          <AddView
            propertyId={dialogProps.propertyId}
            roomId={dialogProps.roomId}
            onLoadingChange={setDialogLoading}
            onSuccess={handleClose}
          />
        </Dialog>
      )}

      {/* Add Booking (needs propertyId or roomId) */}
      {(dialogProps.propertyId || dialogProps.roomId) && (
        <AddBookingWizard
          propertyId={dialogProps.propertyId || ''}
          roomId={dialogProps.roomId || undefined}
          open={activeDialog === 'add-booking'}
          onOpenChange={(open) => !open && handleClose()}
          onSuccess={handleClose}
        />
      )}

      {/* Assign Owner (needs propertyId) */}
      {activeDialog === 'assign-owner' && dialogProps.propertyId && (
        <AssignOwnerDialog
          propertyId={dialogProps.propertyId}
          controlledOpen={true}
          onControlledOpenChange={(open) => !open && handleClose()}
          onSuccess={handleClose}
        />
      )}

      {/* Schedule Lease End (needs leaseId) */}
      {activeDialog === 'schedule-lease-end' && dialogProps.leaseId && (
        <ScheduleLeaseEndDialog
          leaseId={dialogProps.leaseId}
          controlledOpen={true}
          onControlledOpenChange={(open) => !open && handleClose()}
          onSuccess={handleClose}
        />
      )}

      {/* Schedule Rental Change (needs leaseId) */}
      {activeDialog === 'schedule-rental-change' && dialogProps.leaseId && (
        <ScheduleRentalChangeDialog
          leaseId={dialogProps.leaseId}
          controlledOpen={true}
          onControlledOpenChange={(open) => !open && handleClose()}
          onSuccess={handleClose}
        />
      )}
    </>
  )
}
