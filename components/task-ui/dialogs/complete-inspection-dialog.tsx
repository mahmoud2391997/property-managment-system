'use client'

import { useState } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import UploadFile from '@/components/costume-ui/upload-file'
import Textarea from '@/components/costume-ui/text-area'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { CheckCircle2, Plus, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InspectionFinding, PreparationTaskInput } from '../flow-types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    finding: InspectionFinding
    report: string
    attachment?: File
    preparationTasks?: PreparationTaskInput[]
  }) => Promise<void>
  loading?: boolean
}

export default function CompleteInspectionDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false
}: Props) {
  const [finding, setFinding] = useState<InspectionFinding>('ready')
  const [report, setReport] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [preparationTasks, setPreparationTasks] = useState<PreparationTaskInput[]>([
    { title: '', description: '' }
  ])

  const MIN_REPORT_LENGTH = 10

  const handleAddPreparationTask = () => {
    setPreparationTasks([...preparationTasks, { title: '', description: '' }])
  }

  const handleRemovePreparationTask = (index: number) => {
    if (preparationTasks.length <= 1) return
    setPreparationTasks(preparationTasks.filter((_, i) => i !== index))
  }

  const handleUpdatePreparationTask = (
    index: number,
    field: 'title' | 'description',
    value: string
  ) => {
    const updated = [...preparationTasks]
    updated[index][field] = value
    setPreparationTasks(updated)
  }

  const validatePreparationTasks = (): boolean => {
    if (finding !== 'needs_preparation') return true

    for (const task of preparationTasks) {
      if (!task.title.trim() || task.title.trim().length < 5) {
        FeedbackToasts.warning('Validation', 'Each preparation task must have a title (min 5 characters)')
        return false
      }
      if (!task.description.trim() || task.description.trim().length < 10) {
        FeedbackToasts.warning('Validation', 'Each preparation task must have a description (min 10 characters)')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!finding) {
      FeedbackToasts.warning('Validation', 'Please select an inspection finding')
      return
    }

    if (!report.trim() || report.trim().length < MIN_REPORT_LENGTH) {
      FeedbackToasts.warning('Validation', `Report must be at least ${MIN_REPORT_LENGTH} characters`)
      return
    }

    if (!validatePreparationTasks()) return

    try {
      await onSubmit({
        finding,
        report: report.trim(),
        attachment: attachmentFile || undefined,
        preparationTasks: finding === 'needs_preparation'
          ? preparationTasks.map(t => ({
              title: t.title.trim(),
              description: t.description.trim()
            }))
          : undefined
      })

      // Reset form on success
      resetForm()
    } catch {
      // Error handled by parent
    }
  }

  const resetForm = () => {
    setFinding('ready')
    setReport('')
    setAttachmentFile(null)
    setPreparationTasks([{ title: '', description: '' }])
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
            label={loading ? 'Submitting...' : 'Complete Inspection'}
            icon={<CheckCircle2 size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!finding || !report.trim() || report.trim().length < MIN_REPORT_LENGTH || loading}
          />
        </>
      }
      title='Complete Inspection'
      className='max-w-2xl!'
    >
      <div className='space-y-6'>
        {/* Finding Selection */}
        <div>
          <span className='texts-body-small-medium text-(--text-primary) block mb-3'>
            Inspection Finding <span className='text-red-500'>*</span>
          </span>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setFinding('ready')}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                finding === 'ready'
                  ? 'border-green-500 bg-green-50'
                  : 'border-(--border-default) bg-white hover:border-green-300 hover:bg-green-50/50'
              )}
            >
              <div className='flex items-start gap-3'>
                <CheckCircle
                  size={24}
                  className={finding === 'ready' ? 'text-green-600' : 'text-green-400'}
                />
                <div>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Property Ready
                  </p>
                  <p className='texts-body-small text-(--text-secondary) mt-1'>
                    The property is in good condition and ready for the next tenant
                  </p>
                </div>
              </div>
            </button>

            <button
              type='button'
              onClick={() => setFinding('needs_preparation')}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                finding === 'needs_preparation'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-(--border-default) bg-white hover:border-amber-300 hover:bg-amber-50/50'
              )}
            >
              <div className='flex items-start gap-3'>
                <AlertTriangle
                  size={24}
                  className={finding === 'needs_preparation' ? 'text-amber-600' : 'text-amber-400'}
                />
                <div>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Needs Preparation
                  </p>
                  <p className='texts-body-small text-(--text-secondary) mt-1'>
                    The property requires cleaning, repairs, or other work
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Inspection Report */}
        <InputGroup label='Inspection Report' isRequired>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder='Describe the condition of the property and your findings (min 10 characters)...'
            className='min-h-[120px]'
            disabled={loading}
          />
        </InputGroup>

        {/* Preparation Tasks (if needs preparation) */}
        {finding === 'needs_preparation' && (
          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <span className='texts-body-medium-medium text-amber-800'>
                Preparation Tasks Required
              </span>
              <button
                type='button'
                onClick={handleAddPreparationTask}
                disabled={loading}
                className='flex items-center gap-1 texts-body-small-medium text-amber-700 hover:text-amber-900 transition-colors'
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>

            <div className='space-y-4'>
              {preparationTasks.map((task, index) => (
                <div
                  key={index}
                  className='p-3 bg-white border border-amber-200 rounded-lg'
                >
                  <div className='flex items-start justify-between gap-2 mb-3'>
                    <span className='texts-body-small-medium text-amber-700'>
                      Task {index + 1}
                    </span>
                    {preparationTasks.length > 1 && (
                      <button
                        type='button'
                        onClick={() => handleRemovePreparationTask(index)}
                        disabled={loading}
                        className='p-1 hover:bg-red-50 rounded text-red-500'
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <div className='space-y-3'>
                    <Input
                      placeholder='Task title (e.g., Deep cleaning required)'
                      value={task.title}
                      onChange={e => handleUpdatePreparationTask(index, 'title', e.target.value)}
                      disabled={loading}
                      minLength={5}
                      maxLength={200}
                    />
                    <Textarea
                      placeholder='Describe what needs to be done...'
                      value={task.description}
                      onChange={e => handleUpdatePreparationTask(index, 'description', e.target.value)}
                      disabled={loading}
                      className='min-h-[80px]'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachment */}
        <InputGroup label='Attachment (Optional)'>
          <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} disabled={loading} />
        </InputGroup>

        {/* Info about what happens next */}
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='texts-body-small text-blue-700'>
            {finding === 'ready' ? (
              <>After completion, a <strong>Refund Request</strong> task will be automatically created for you to process the security deposit.</>
            ) : finding === 'needs_preparation' ? (
              <>After completion, the preparation tasks will be created and the property status will be set to "Under Preparation".</>
            ) : (
              <>Select an inspection finding to see what happens next.</>
            )}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
