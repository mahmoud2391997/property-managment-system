'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import InputGroup from '@/components/costume-ui/input-group'
import InputCard from '@/components/costume-ui/input-card'
import Input from '@/components/costume-ui/input'
import { Textarea } from '@/components/ui/textarea'
import Combobox from '@/components/costume-ui/combobox'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import {
  CheckCircle2,
  XCircle,
  Plus,
  FileText,
  DollarSign,
  Send,
  Paperclip,
  X,
  UserMinus
} from 'lucide-react'
import {
  StaffMember,
  LeaseEndingTask,
  PreparationTask,
  RefundDecision,
  RefundCharge
} from '../types'
import { cn } from '@/lib/utils'

// File attachment picker component
type FilePickerProps = {
  file: File | null
  preview: string | null
  onFileSelect: (file: File | null, preview: string | null) => void
  disabled?: boolean
}

function FilePicker({ file, preview, onFileSelect, disabled }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(selectedFile.type)) {
      FeedbackToasts.operationFailed('File upload', 'Only JPG, PNG, GIF, and PDF files are allowed')
      return
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      FeedbackToasts.operationFailed('File upload', 'File size must be less than 2MB')
      return
    }

    const filePreview = selectedFile.type.startsWith('image/')
      ? URL.createObjectURL(selectedFile)
      : null
    onFileSelect(selectedFile, filePreview)
  }

  const removeFile = () => {
    onFileSelect(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*,.pdf'
        onChange={handleFileSelect}
        className='hidden'
        disabled={disabled}
      />

      {file ? (
        <div className='p-3 bg-neutral-50 rounded-lg border border-(--border-default)'>
          <div className='flex items-center gap-3'>
            {preview ? (
              <img
                src={preview}
                alt={file.name}
                className='w-10 h-10 object-cover rounded border border-(--border-default)'
              />
            ) : (
              <div className='w-10 h-10 flex items-center justify-center bg-neutral-100 rounded border border-(--border-default)'>
                <FileText size={18} className='text-neutral-500' />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <p className='texts-body-small-medium text-(--text-primary) truncate'>
                {file.name}
              </p>
              <p className='texts-label-small text-(--text-secondary)'>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type='button'
              onClick={removeFile}
              disabled={disabled}
              className='p-1.5 hover:bg-neutral-200 rounded transition-colors'
            >
              <X size={16} className='text-(--text-secondary)' />
            </button>
          </div>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className='flex items-center gap-2 texts-body-small text-(--text-secondary) hover:text-(--text-primary) transition-colors px-3 py-2 rounded-md hover:bg-neutral-100 border border-dashed border-(--border-default) disabled:opacity-50'
        >
          <Paperclip size={15} />
          <span>Attach file (optional)</span>
        </button>
      )}
    </div>
  )
}

// Pending Assignment Banner - shown to staff who have pending request
type PendingBannerProps = {
  assignerName: string
  assignerAvatar?: string
  onAccept: () => void
  onReject: (reason: string) => void
  loading?: boolean
}

export function PendingAssignmentBanner({
  assignerName,
  assignerAvatar,
  onAccept,
  onReject,
  loading
}: PendingBannerProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleReject = () => {
    if (!rejectReason.trim()) {
      FeedbackToasts.warning('Validation', 'Please provide a reason for rejection')
      return
    }
    onReject(rejectReason)
    setShowRejectDialog(false)
    setRejectReason('')
  }

  return (
    <>
      <div className='mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <UserAvatar name={assignerName} imgSrc={assignerAvatar} size={40} />
            <div>
              <p className='texts-body-medium-medium text-(--text-primary)'>
                Assignment Request
              </p>
              <p className='texts-body-small text-(--text-secondary)'>
                <span className='text-blue-600'>{assignerName}</span> has requested you to handle this task
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
              className='flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 texts-body-small-medium rounded-md hover:bg-red-50 transition-colors disabled:opacity-50'
            >
              <XCircle size={16} />
              Reject
            </button>
            <button
              onClick={onAccept}
              disabled={loading}
              className='flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            >
              <CheckCircle2 size={16} />
              Accept
            </button>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        openDialogButton={<span />}
        title='Reject Assignment'
        className='max-w-md!'
      >
        <div className='space-y-4'>
          <InputGroup label='Reason for Rejection' isRequired>
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder='Explain why you cannot accept this assignment...'
              className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
            />
          </InputGroup>
          <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
            <Button variant='secondary' label='Cancel' onClick={() => setShowRejectDialog(false)} />
            <Button
              variant='primary'
              label='Reject Assignment'
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              loading={loading}
              className='bg-red-600! hover:bg-red-700!'
            />
          </div>
        </div>
      </Dialog>
    </>
  )
}

// Unassign Dialog
type UnassignDialogProps = {
  staffName: string
  isSelf: boolean
  onUnassign: (reason: string) => void
  loading?: boolean
}

export function UnassignDialog({ staffName, isSelf, onUnassign, loading }: UnassignDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleUnassign = () => {
    if (!reason.trim()) {
      FeedbackToasts.warning('Validation', 'Please provide a reason')
      return
    }
    onUnassign(reason)
    setOpen(false)
    setReason('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      openDialogButton={
        <button className='p-1.5 rounded-md hover:bg-red-50 text-(--text-muted) hover:text-red-500 transition-colors'>
          {isSelf ? <UserMinus size={16} /> : <X size={16} />}
        </button>
      }
      title={isSelf ? 'Unassign Yourself' : `Unassign ${staffName}`}
      className='max-w-md!'
    >
      <div className='space-y-4'>
        <InputGroup label='Reason' isRequired>
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={isSelf ? 'Explain why you are unassigning yourself...' : 'Explain why you are unassigning this staff...'}
            className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
          />
        </InputGroup>
        <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
          <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
          <Button
            variant='primary'
            label='Unassign'
            onClick={handleUnassign}
            disabled={!reason.trim()}
            loading={loading}
            className='bg-red-600! hover:bg-red-700!'
          />
        </div>
      </div>
    </Dialog>
  )
}

// Close Task Dialog (Submit Report)
type CloseTaskDialogProps = {
  taskType: 'inspection' | 'preparation'
  onSubmit: (
    finding: 'ready' | 'needs_preparation',
    report: string,
    attachment: { name: string; url: string } | undefined,
    preparationTasks?: { title: string; description: string }[]
  ) => void
  loading?: boolean
}

export function CloseTaskDialog({ taskType, onSubmit, loading }: CloseTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [finding, setFinding] = useState<'ready' | 'needs_preparation'>('ready')
  const [report, setReport] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const [preparationTasks, setPreparationTasks] = useState<{ title: string; description: string }[]>([
    { title: '', description: '' }
  ])

  const addPreparationTask = () => {
    setPreparationTasks([...preparationTasks, { title: '', description: '' }])
  }

  const removePreparationTask = (index: number) => {
    setPreparationTasks(preparationTasks.filter((_, i) => i !== index))
  }

  const updatePreparationTask = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...preparationTasks]
    updated[index][field] = value
    setPreparationTasks(updated)
  }

  const validateForm = (): boolean => {
    // Report is required for all task types
    if (!report.trim()) {
      FeedbackToasts.warning('Validation', 'Please provide report notes')
      return false
    }

    if (taskType === 'inspection' && finding === 'needs_preparation') {
      // All tasks must have both title and description filled
      for (let i = 0; i < preparationTasks.length; i++) {
        const task = preparationTasks[i]
        if (!task.title.trim() || !task.description.trim()) {
          FeedbackToasts.warning('Validation', `Please complete title and description for task ${i + 1}`)
          return false
        }
      }
    }
    return true
  }

  const handleSubmitClick = () => {
    if (!validateForm()) return
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    const attachment = attachmentFile
      ? { name: attachmentFile.name, url: attachmentPreview || `https://example.com/${attachmentFile.name}` }
      : undefined

    if (taskType === 'inspection' && finding === 'needs_preparation') {
      const validTasks = preparationTasks.filter(t => t.title.trim())
      onSubmit(finding, report, attachment, validTasks)
    } else {
      onSubmit(finding, report, attachment)
    }
    setShowConfirmation(false)
    setOpen(false)
    setReport('')
    setFinding('ready')
    setAttachmentFile(null)
    setAttachmentPreview(null)
    setPreparationTasks([{ title: '', description: '' }])
  }

  const isInspection = taskType === 'inspection'

  const getConfirmationMessage = () => {
    if (isInspection) {
      if (finding === 'ready') {
        return 'You are about to mark this inspection as complete. The property will proceed to the refund process.'
      } else {
        const taskCount = preparationTasks.filter(t => t.title.trim()).length
        return `You are about to mark this inspection as complete with ${taskCount} preparation task(s). These tasks must be completed before proceeding to the refund process.`
      }
    }
    return 'You are about to mark this task as complete. This action cannot be undone.'
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        openDialogButton={
          <Button
            variant='primary'
            label='Close as Resolved'
            icon={<CheckCircle2 size={16} />}
            className='w-full'
          />
        }
        title={isInspection ? 'Submit Inspection Report' : 'Submit Task Report'}
        className='max-w-xl!'
      >
        <div className='flex flex-col h-full -m-5'>
          <div className='flex-1 overflow-auto p-5 space-y-4'>
          {isInspection && (
            <div>
              <p className='texts-label-large mb-3'>Inspection Finding</p>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={() => setFinding('ready')}
                  className={cn(
                    'flex-1 p-4 rounded-lg border-2 transition-all text-left',
                    finding === 'ready'
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <CheckCircle2
                    size={24}
                    className={finding === 'ready' ? 'text-green-500 mb-2' : 'text-neutral-400 mb-2'}
                  />
                  <p className='texts-body-medium-medium'>Property Ready</p>
                  <p className='texts-body-small text-(--text-secondary)'>
                    No issues found, proceed to refund
                  </p>
                </button>
                <button
                  type='button'
                  onClick={() => setFinding('needs_preparation')}
                  className={cn(
                    'flex-1 p-4 rounded-lg border-2 transition-all text-left',
                    finding === 'needs_preparation'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <FileText
                    size={24}
                    className={finding === 'needs_preparation' ? 'text-amber-500 mb-2' : 'text-neutral-400 mb-2'}
                  />
                  <p className='texts-body-medium-medium'>Needs Preparation</p>
                  <p className='texts-body-small text-(--text-secondary)'>
                    Issues found, assign preparation tasks
                  </p>
                </button>
              </div>
            </div>
          )}

          <InputGroup label='Report Notes' isRequired>
            <Textarea
              value={report}
              onChange={e => setReport(e.target.value)}
              placeholder='Describe the inspection findings or work completed...'
              required
              className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
            />
          </InputGroup>

          <FilePicker
            file={attachmentFile}
            preview={attachmentPreview}
            onFileSelect={(file, preview) => {
              setAttachmentFile(file)
              setAttachmentPreview(preview)
            }}
            disabled={loading}
          />

          {isInspection && finding === 'needs_preparation' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <p className='texts-label-large'>Preparation Tasks</p>
                <button
                  type='button'
                  onClick={addPreparationTask}
                  className='flex items-center gap-1 texts-body-small text-blue-600 hover:text-blue-700'
                >
                  <Plus size={14} />
                  Add Task
                </button>
              </div>
              <div className='space-y-3 max-h-80 overflow-auto'>
                {preparationTasks.map((task, index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative flex flex-col gap-3',
                      'w-full p-4',
                      'border border-(--border-default) bg-(--background-secondary)',
                      'rounded-md'
                    )}
                  >
                    <InputGroup label='Task Title' isRequired>
                      <Input
                        value={task.title}
                        onChange={e => updatePreparationTask(index, 'title', e.target.value)}
                        placeholder='e.g., Fix AC Unit'
                        maxLength={50}
                        required
                        className='bg-(--background-primary)'
                      />
                    </InputGroup>
                    <InputGroup label='Description' isRequired>
                      <Textarea
                        value={task.description}
                        onChange={e => updatePreparationTask(index, 'description', e.target.value)}
                        placeholder='Describe the task in detail...'
                        required
                        className='min-h-[80px] bg-(--background-primary) border border-(--border-strong) rounded-[5] texts-body-small'
                      />
                    </InputGroup>
                    {index > 0 && (
                      <button
                        type='button'
                        onClick={() => removePreparationTask(index)}
                        className={cn(
                          'absolute right-3 top-3',
                          'text-(--error-main) hover:text-(--error-dark)',
                          'cursor-pointer'
                        )}
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          <div className='flex justify-end gap-2 p-5 border-t border-(--border-default)'>
            <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
            <Button
              variant='primary'
              label='Submit Report'
              icon={<Send size={16} />}
              onClick={handleSubmitClick}
              loading={loading}
            />
          </div>
        </div>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Assign Staff Dialog
type AssignStaffDialogProps = {
  staffList: StaffMember[]
  currentStaffId: string
  onAssign: (staffId: string, isSelfAssign: boolean) => void
  loading?: boolean
  buttonLabel?: string
  taskTitle?: string
}

export function AssignStaffDialog({
  staffList,
  currentStaffId,
  onAssign,
  loading,
  buttonLabel = 'Assign Staff',
  taskTitle
}: AssignStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const staffItems = staffList.map(s => ({
    id: s.id,
    label: s.name,
    subtitle: s.role,
    avatar: s.avatar
  }))

  const handleAssign = () => {
    if (!selectedStaffId) return
    const isSelfAssign = selectedStaffId === currentStaffId
    onAssign(selectedStaffId, isSelfAssign)
    setOpen(false)
    setSelectedStaffId('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      openDialogButton={
        <Button
          variant='secondary'
          label={buttonLabel}
          icon={<Plus size={16} />}
          className='w-full'
        />
      }
      title={taskTitle ? `Assign: ${taskTitle}` : 'Assign Staff'}
      className='max-w-md!'
    >
      <div className='space-y-4'>
        <InputGroup label='Select Staff Member' isRequired>
          <Combobox
            items={staffItems}
            placeholder='Select staff...'
            searchPlaceholder='Search staff...'
            showAvatar
            value={selectedStaffId}
            onValueChange={setSelectedStaffId}
            NotFoundMessage='No staff found'
          />
        </InputGroup>

        {selectedStaffId === currentStaffId && (
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='texts-body-small text-blue-700'>
              You selected yourself. This will auto-accept the assignment.
            </p>
          </div>
        )}

        <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
          <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
          <Button
            variant='primary'
            label='Assign'
            onClick={handleAssign}
            disabled={!selectedStaffId}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  )
}

// Refund Decision Dialog
type RefundDecisionDialogProps = {
  originalDeposit: number
  existingCharges: RefundCharge[]
  onSubmit: (
    decision: RefundDecision,
    charges: RefundCharge[],
    note: string,
    attachment: { name: string; url: string } | undefined
  ) => void
  loading?: boolean
}

export function RefundDecisionDialog({
  originalDeposit,
  existingCharges,
  onSubmit,
  loading
}: RefundDecisionDialogProps) {
  const [open, setOpen] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [decision, setDecision] = useState<RefundDecision>('full')
  // Initialize with one charge for partial refund (first one is non-removeable)
  // Store amounts as strings for currency input compatibility
  const [charges, setCharges] = useState<{ id: string; description: string; amount: string }[]>(
    existingCharges.length > 0
      ? existingCharges.map(c => ({ ...c, amount: String(c.amount) }))
      : [{ id: 'charge-initial', description: '', amount: '' }]
  )
  const [note, setNote] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)

  const addCharge = () => {
    setCharges([
      ...charges,
      { id: `charge-${Date.now()}`, description: '', amount: '' }
    ])
  }

  const removeCharge = (id: string) => {
    setCharges(charges.filter(c => c.id !== id))
  }

  const updateCharge = (id: string, field: 'description' | 'amount', value: string) => {
    setCharges(
      charges.map(c => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const totalCharges = charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  const refundAmount = decision === 'burn' ? 0 : originalDeposit - totalCharges

  const validateForm = (): boolean => {
    if (decision === 'partial') {
      // All charges must have both description and amount filled
      for (let i = 0; i < charges.length; i++) {
        const charge = charges[i]
        if (!charge.description.trim() || !charge.amount || parseFloat(charge.amount) <= 0) {
          FeedbackToasts.warning('Validation', `Please complete title and amount for charge ${i + 1}`)
          return false
        }
      }
    }

    if (decision === 'burn' && !note.trim()) {
      FeedbackToasts.warning('Validation', 'Please provide a note to tenant for burning deposit')
      return false
    }

    return true
  }

  const handleSubmitClick = () => {
    if (!validateForm()) return
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    const attachment = attachmentFile
      ? { name: attachmentFile.name, url: attachmentPreview || `https://example.com/${attachmentFile.name}` }
      : undefined
    // Convert charges to proper format (validation already passed)
    const validCharges: RefundCharge[] = decision === 'partial'
      ? charges.map(c => ({ id: c.id, description: c.description, amount: parseFloat(c.amount) }))
      : []
    onSubmit(decision, validCharges, note, attachment)
    setShowConfirmation(false)
    setOpen(false)
    // Reset form
    setDecision('full')
    setCharges([{ id: 'charge-initial', description: '', amount: '' }])
    setNote('')
    setAttachmentFile(null)
    setAttachmentPreview(null)
  }

  const getConfirmationMessage = () => {
    if (decision === 'full') {
      return `You are about to submit a full refund of RM ${originalDeposit.toFixed(2)} to the tenant.`
    } else if (decision === 'partial') {
      return `You are about to submit a partial refund of RM ${refundAmount.toFixed(2)} to the tenant (RM ${totalCharges.toFixed(2)} in charges deducted).`
    } else {
      return 'You are about to forfeit the entire deposit. The tenant will receive no refund.'
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        openDialogButton={
          <Button
            variant='primary'
            label='Submit Refund Decision'
            icon={<DollarSign size={16} />}
            className='w-full'
          />
        }
        title='Refund Decision'
        className='max-w-xl!'
      >
        <div className='flex flex-col h-full -m-5'>
          <div className='flex-1 overflow-auto p-5 space-y-4'>
          <div>
            <p className='texts-label-large mb-3'>
              Decision <span className='text-red-500'>*</span>
            </p>
            <div className='flex gap-2'>
              {(['full', 'partial', 'burn'] as RefundDecision[]).map(d => (
                <button
                  key={d}
                  type='button'
                  onClick={() => {
                    setDecision(d)
                    if (d === 'full') {
                      setCharges([{ id: 'charge-initial', description: '', amount: '' }])
                    }
                  }}
                  className={cn(
                    'flex-1 p-3 rounded-lg border-2 transition-all texts-body-small-medium',
                    decision === d
                      ? d === 'full'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : d === 'partial'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-(--text-primary)'
                  )}
                >
                  {d === 'full' ? 'Full Refund' : d === 'partial' ? 'Partial Refund' : 'Burn Deposit'}
                </button>
              ))}
            </div>
          </div>

          {decision === 'partial' && (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <p className='texts-label-large'>
                  Deduction Charges <span className='text-red-500'>*</span>
                </p>
                <button
                  type='button'
                  onClick={addCharge}
                  className='flex items-center gap-1 texts-body-small text-blue-600 hover:text-blue-700'
                >
                  <Plus size={14} />
                  Add Charge
                </button>
              </div>
              <div className='space-y-2 max-h-48 overflow-auto'>
                {charges.map((charge, index) => (
                  <InputCard
                    key={charge.id}
                    isRemoveable={index > 0}
                    onRemove={() => removeCharge(charge.id)}
                  >
                    <InputGroup label='Charge Title' isRequired className='flex-1'>
                      <Input
                        value={charge.description}
                        onChange={e => updateCharge(charge.id, 'description', e.target.value)}
                        placeholder='e.g., Damaged furniture'
                        required
                        className='bg-(--background-primary)'
                      />
                    </InputGroup>
                    <InputGroup label='Amount' isRequired className='w-32'>
                      <Input
                        currency
                        value={charge.amount}
                        onValueChange={val => updateCharge(charge.id, 'amount', val || '')}
                        required
                        className='bg-(--background-primary)'
                      />
                    </InputGroup>
                  </InputCard>
                ))}
              </div>
            </div>
          )}

          <div className='p-4 bg-neutral-50 rounded-lg border border-(--border-default)'>
            <div className='flex justify-between texts-body-small text-(--text-secondary) mb-1'>
              <span>Original Deposit</span>
              <span>RM {originalDeposit.toFixed(2)}</span>
            </div>
            {decision === 'partial' && totalCharges > 0 && (
              <div className='flex justify-between texts-body-small text-red-600 mb-1'>
                <span>Total Charges</span>
                <span>- RM {totalCharges.toFixed(2)}</span>
              </div>
            )}
            <div className='flex justify-between texts-body-medium-medium text-(--text-primary) pt-2 border-t border-(--border-default)'>
              <span>Refund Amount</span>
              <span className={refundAmount === 0 ? 'text-red-600' : 'text-green-600'}>
                RM {refundAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <InputGroup
            label={decision === 'burn' ? 'Note to Tenant' : 'Note to Tenant (Optional)'}
            isRequired={decision === 'burn'}
          >
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder='Add a note for the tenant regarding the refund...'
              required={decision === 'burn'}
              className='min-h-20 bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
            />
          </InputGroup>

          <FilePicker
            file={attachmentFile}
            preview={attachmentPreview}
            onFileSelect={(file, preview) => {
              setAttachmentFile(file)
              setAttachmentPreview(preview)
            }}
            disabled={loading}
          />
          </div>

          <div className='flex justify-end gap-2 p-5 border-t border-(--border-default)'>
            <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
            <Button
              variant='primary'
              label='Submit Decision'
              onClick={handleSubmitClick}
              loading={loading}
            />
          </div>
        </div>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund Decision</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Review Refund Dialog (for finalization)
type ReviewRefundDialogProps = {
  refundAmount: number
  originalDeposit: number
  charges: RefundCharge[]
  decision: RefundDecision
  onApprove: (report: string, attachment: { name: string; url: string } | undefined) => void
  onReject: (reason: string) => void
  loading?: boolean
}

export function ReviewRefundDialog({
  refundAmount,
  originalDeposit,
  charges,
  decision,
  onApprove,
  onReject,
  loading
}: ReviewRefundDialogProps) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [showApproveConfirmation, setShowApproveConfirmation] = useState(false)
  const [report, setReport] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)

  const handleApproveClick = () => {
    setShowApproveConfirmation(true)
  }

  const handleConfirmApprove = () => {
    const attachment = attachmentFile
      ? { name: attachmentFile.name, url: attachmentPreview || `https://example.com/${attachmentFile.name}` }
      : undefined
    onApprove(report, attachment)
    setShowApproveConfirmation(false)
    setApproveOpen(false)
    setReport('')
    setAttachmentFile(null)
    setAttachmentPreview(null)
  }

  return (
    <>
      <div className='space-y-3'>
        {/* Summary Card */}
        <div className='p-4 bg-neutral-50 rounded-lg border border-(--border-default) mb-4'>
          <h4 className='texts-body-medium-medium mb-3'>Refund Summary</h4>
          <div className='space-y-2'>
            <div className='flex justify-between texts-body-small text-(--text-secondary)'>
              <span>Original Deposit</span>
              <span>RM {originalDeposit.toFixed(2)}</span>
            </div>
            {charges.length > 0 && (
              <>
                {charges.map(charge => (
                  <div key={charge.id} className='flex justify-between texts-body-small text-red-600'>
                    <span>{charge.description}</span>
                    <span>- RM {charge.amount.toFixed(2)}</span>
                  </div>
                ))}
              </>
            )}
            <div className='flex justify-between texts-body-medium-medium text-(--text-primary) pt-2 border-t border-(--border-default)'>
              <span>Final Refund</span>
              <span className={refundAmount === 0 ? 'text-red-600' : 'text-green-600'}>
                RM {refundAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <Dialog
            open={rejectOpen}
            onOpenChange={setRejectOpen}
            openDialogButton={
              <Button
                variant='secondary'
                label='Request Revision'
                icon={<XCircle size={16} />}
                className='flex-1'
              />
            }
            title='Request Revision'
            className='max-w-md!'
          >
            <div className='space-y-4'>
              <InputGroup label='Reason for Revision' isRequired>
                <Textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder='Explain why revision is needed...'
                  className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
                />
              </InputGroup>
              <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
                <Button variant='secondary' label='Cancel' onClick={() => setRejectOpen(false)} />
                <Button
                  variant='primary'
                  label='Submit'
                  onClick={() => {
                    if (!rejectReason.trim()) return
                    onReject(rejectReason)
                    setRejectOpen(false)
                    setRejectReason('')
                  }}
                  disabled={!rejectReason.trim()}
                  loading={loading}
                  className='bg-amber-600! hover:bg-amber-700!'
                />
              </div>
            </div>
          </Dialog>

          <Dialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            openDialogButton={
              <Button
                variant='primary'
                label='Approve Refund'
                icon={<CheckCircle2 size={16} />}
                className='flex-1'
              />
            }
            title='Approve Refund'
            className='max-w-md!'
          >
            <div className='space-y-4'>
              <InputGroup label='Approval Notes (Optional)'>
                <Textarea
                  value={report}
                  onChange={e => setReport(e.target.value)}
                  placeholder='Add any notes about the approval...'
                  className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
                />
              </InputGroup>

              <FilePicker
                file={attachmentFile}
                preview={attachmentPreview}
                onFileSelect={(file, preview) => {
                  setAttachmentFile(file)
                  setAttachmentPreview(preview)
                }}
                disabled={loading}
              />

              <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
                <Button variant='secondary' label='Cancel' onClick={() => setApproveOpen(false)} />
                <Button
                  variant='primary'
                  label='Approve'
                  onClick={handleApproveClick}
                  loading={loading}
                  className='bg-green-600! hover:bg-green-700!'
                />
              </div>
            </div>
          </Dialog>
        </div>
      </div>

      <AlertDialog open={showApproveConfirmation} onOpenChange={setShowApproveConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund Approval</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve a refund of RM {refundAmount.toFixed(2)} to the tenant. This will complete the lease ending workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApprove} className='bg-green-600 hover:bg-green-700'>
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
