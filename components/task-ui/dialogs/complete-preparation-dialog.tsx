'use client'

import { useState } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
import UploadFile from '@/components/costume-ui/upload-file'
import Textarea from '@/components/costume-ui/text-area'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { CheckCircle2 } from 'lucide-react'
import type { TaskFlowType } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    report: string
    attachment?: File
  }) => Promise<void>
  loading?: boolean
  taskTitle?: string
  flowType?: TaskFlowType
}

export default function CompletePreparationDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  taskTitle = 'Preparation Task',
  flowType = 'Lease Ending'
}: Props) {
  const [report, setReport] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  const MIN_REPORT_LENGTH = 10

  const handleSubmit = async () => {
    if (!report.trim() || report.trim().length < MIN_REPORT_LENGTH) {
      FeedbackToasts.warning('Validation', `Report must be at least ${MIN_REPORT_LENGTH} characters`)
      return
    }

    try {
      await onSubmit({
        report: report.trim(),
        attachment: attachmentFile || undefined
      })

      // Reset form on success
      resetForm()
    } catch {
      // Error handled by parent
    }
  }

  const resetForm = () => {
    setReport('')
    setAttachmentFile(null)
  }

  const handleClose = () => {
    if (loading) return
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen && !loading) handleClose()
        else if (isOpen) onOpenChange(true)
      }}
      footerButtons={
        <>
          <Button
            variant='secondary'
            label='Cancel'
            onClick={handleClose}
            disabled={loading}
          />
          <Button
            variant='primary'
            label={loading ? 'Submitting...' : 'Complete Task'}
            icon={<CheckCircle2 size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!report.trim() || report.trim().length < MIN_REPORT_LENGTH || loading}
          />
        </>
      }
      title='Complete Preparation'
      className='max-w-lg!'
    >
      <div className='space-y-4'>
        {/* Task info */}
        <div className='p-3 bg-neutral-50 border border-(--border-default) rounded-lg'>
          <p className='texts-body-small text-(--text-secondary)'>Completing:</p>
          <p className='texts-body-medium-medium text-(--text-primary)'>{taskTitle}</p>
        </div>

        {/* Completion Report */}
        <InputGroup label='Completion Report' isRequired>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder='Describe what was done to complete this preparation task (min 10 characters)...'
            className='min-h-[120px]'
            disabled={loading}
          />
        </InputGroup>

        {/* Attachment */}
        <InputGroup label='Attachment (Optional)'>
          <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} disabled={loading} />
        </InputGroup>

        {/* Info - different message based on flow type */}
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='texts-body-small text-blue-700'>
            {flowType === 'Property Not Ready' ? (
              <>
                When all preparation tasks are completed, the property/room status will be automatically changed back to <strong>Ready</strong> and available for leasing.
              </>
            ) : (
              <>
                When all preparation tasks are completed, a <strong>Refund Request</strong> task will be automatically created for processing the refundable deposits.
              </>
            )}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
