'use client'

import { useState } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type AssignmentEvent = {
  type: string
  performerName?: string
  performerAvatar?: string
  assignerName?: string
  assignedName?: string
  fromName?: string
  newStatus?: string
  performerType?: string
  createdAt: string
}

type Props = {
  ticketId: string
  assignerName: string
  assignerAvatar?: string
  onRespond?: (events?: AssignmentEvent[], statusChange?: string) => void
}

export default function PendingAssignmentBanner({
  ticketId,
  assignerName,
  assignerAvatar,
  onRespond
}: Props) {
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState<'accept' | 'reject' | null>(null)
  const [showStaleAlert, setShowStaleAlert] = useState(false)

  const handleStaleAlertClose = () => {
    setShowStaleAlert(false)
    window.location.reload()
  }

  const handleRespond = async (action: 'accept' | 'reject') => {
    setLoading(true)
    setRespondingTo(action)

    try {
      const response = await fetch('/api/tickets/assignments/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, action, expectedStatus: 'Pending' })
      })

      if (response.ok) {
        const data = await response.json()
        // Determine status change based on action
        const statusChange = action === 'accept' ? 'In Progress' : undefined
        // Show success toast
        if (action === 'accept') {
          FeedbackToasts.updated('Assignment', 'You have accepted the assignment request')
        } else {
          FeedbackToasts.info('Assignment rejected', 'You have rejected the assignment request')
        }
        // Pass events and status change to parent
        onRespond?.(data.events, statusChange)
      } else {
        const data = await response.json()
        // Check for stale state error
        if (response.status === 409 && data.code === 'STALE_STATE') {
          setShowStaleAlert(true)
        } else {
          FeedbackToasts.operationFailed('Assignment response', data.error)
        }
      }
    } catch (error) {
      console.error('Error responding to assignment:', error)
      FeedbackToasts.operationFailed('Assignment response')
    } finally {
      setLoading(false)
      setRespondingTo(null)
    }
  }

  return (
    <>
      <Alert
        open={showStaleAlert}
        onClose={handleStaleAlertClose}
        title="Assignment Updated"
        message="The assignment status has changed since you opened this page. Refreshing to show the current status."
        type="warning"
      />
      <div className='mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <UserAvatar name={assignerName} imgSrc={assignerAvatar} size={40} />
            <div>
              <p className='texts-body-medium-medium text-(--text-primary)'>
                Assignment Request
              </p>
              <p className='texts-body-small text-(--text-secondary)'>
                <span className='text-blue-600'>{assignerName}</span> has requested you to handle this ticket
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => handleRespond('reject')}
              disabled={loading}
              className='flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 texts-body-small-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50'
            >
              {loading && respondingTo === 'reject' ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <XCircle size={16} />
              )}
              Reject
            </button>
            <button
              onClick={() => handleRespond('accept')}
              disabled={loading}
              className='flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              {loading && respondingTo === 'accept' ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Accept
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
