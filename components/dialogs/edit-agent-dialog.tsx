'use client'

import { useState } from 'react'
import Dialog from '../costume-ui/dialog'
import EditAgent, { AgentEditData } from '../edit-agent'

type Props = {
  agentId: string
  initialData?: AgentEditData
  trigger: React.ReactNode
  onSuccess?: () => void
}

export default function EditAgentDialog({ agentId, initialData, trigger, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog
      openDialogButton={trigger}
      title='Edit Agent'
      saveButtonLabel={loading ? 'Saving...' : 'Save Changes'}
      loading={loading}
      disabled={!hasChanges}
      className='max-w-150!'
      open={open}
      onOpenChange={setOpen}
    >
      <EditAgent
        agentId={agentId}
        initialData={initialData}
        onLoadingChange={setLoading}
        onSuccess={handleSuccess}
        onHasChanges={setHasChanges}
      />
    </Dialog>
  )
}
