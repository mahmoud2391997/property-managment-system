'use client'

import { useState } from 'react'
import Button from '@/components/costume-ui/button'
import ConfirmationDialog from '@/components/costume-ui/confirmation-dialog'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
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
  Trash2,
  Send
} from 'lucide-react'
import {
  StaffMember,
  LeaseEndingTask,
  PreparationTask,
  RefundDecision,
  RefundCharge
} from '../types'
import { cn } from '@/lib/utils'

// Pending Assignment Banner - shown to staff who have pending request
type PendingBannerProps = {
  assignerName: string
  assignerAvatar?: string
  onAccept: () => void
  onReject: () => void
  loading?: boolean
}

export function PendingAssignmentBanner({
  assignerName,
  assignerAvatar,
  onAccept,
  onReject,
  loading
}: PendingBannerProps) {
  return (
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
            onClick={onReject}
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
  )
}

// Close Task Dialog (Submit Report)
type CloseTaskDialogProps = {
  taskType: 'inspection' | 'preparation'
  onSubmit: (finding: 'ready' | 'needs_preparation', report: string, preparationTasks?: { title: string; description: string }[]) => void
  loading?: boolean
}

export function CloseTaskDialog({ taskType, onSubmit, loading }: CloseTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [finding, setFinding] = useState<'ready' | 'needs_preparation'>('ready')
  const [report, setReport] = useState('')
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

  const handleSubmit = () => {
    if (taskType === 'inspection' && finding === 'needs_preparation') {
      const validTasks = preparationTasks.filter(t => t.title.trim())
      if (validTasks.length === 0) {
        FeedbackToasts.warning('Validation', 'Please add at least one preparation task')
        return
      }
      onSubmit(finding, report, validTasks)
    } else {
      onSubmit(finding, report)
    }
    setOpen(false)
    setReport('')
    setFinding('ready')
    setPreparationTasks([{ title: '', description: '' }])
  }

  const isInspection = taskType === 'inspection'

  return (
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
      <div className='space-y-4'>
        {isInspection && (
          <div>
            <p className='texts-label-large mb-3'>Inspection Finding</p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setFinding('ready')}
                className={cn(
                  'flex-1 p-4 rounded-lg border-2 transition-all',
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
                  'flex-1 p-4 rounded-lg border-2 transition-all',
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

        <InputGroup label='Report Notes'>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder='Describe the inspection findings or work completed...'
            className='min-h-[100px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
          />
        </InputGroup>

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
            <div className='space-y-3 max-h-60 overflow-auto'>
              {preparationTasks.map((task, index) => (
                <div
                  key={index}
                  className='p-3 border border-(--border-default) rounded-lg bg-neutral-50'
                >
                  <div className='flex items-start gap-2'>
                    <div className='flex-1 space-y-2'>
                      <Input
                        value={task.title}
                        onChange={e => updatePreparationTask(index, 'title', e.target.value)}
                        placeholder='Task title (e.g., Fix AC Unit)'
                        maxLength={50}
                      />
                      <Input
                        value={task.description}
                        onChange={e => updatePreparationTask(index, 'description', e.target.value)}
                        placeholder='Description (optional)'
                      />
                    </div>
                    {preparationTasks.length > 1 && (
                      <button
                        type='button'
                        onClick={() => removePreparationTask(index)}
                        className='p-2 text-red-500 hover:bg-red-50 rounded-md'
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
          <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
          <Button
            variant='primary'
            label='Submit Report'
            icon={<Send size={16} />}
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
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
  onSubmit: (decision: RefundDecision, charges: RefundCharge[], note: string) => void
  loading?: boolean
}

export function RefundDecisionDialog({
  originalDeposit,
  existingCharges,
  onSubmit,
  loading
}: RefundDecisionDialogProps) {
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState<RefundDecision>('full')
  const [charges, setCharges] = useState<RefundCharge[]>(existingCharges)
  const [note, setNote] = useState('')

  const addCharge = () => {
    setCharges([
      ...charges,
      { id: `charge-${Date.now()}`, description: '', amount: 0 }
    ])
  }

  const removeCharge = (id: string) => {
    setCharges(charges.filter(c => c.id !== id))
  }

  const updateCharge = (id: string, field: 'description' | 'amount', value: string | number) => {
    setCharges(
      charges.map(c => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const totalCharges = charges.reduce((sum, c) => sum + (c.amount || 0), 0)
  const refundAmount = decision === 'burn' ? 0 : originalDeposit - totalCharges

  const handleSubmit = () => {
    onSubmit(decision, charges, note)
    setOpen(false)
  }

  return (
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
      <div className='space-y-4'>
        <div>
          <p className='texts-label-large mb-3'>Decision</p>
          <div className='flex gap-2'>
            {(['full', 'partial', 'burn'] as RefundDecision[]).map(d => (
              <button
                key={d}
                type='button'
                onClick={() => {
                  setDecision(d)
                  if (d === 'full') setCharges([])
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
              <p className='texts-label-large'>Deduction Charges</p>
              <button
                type='button'
                onClick={addCharge}
                className='flex items-center gap-1 texts-body-small text-blue-600 hover:text-blue-700'
              >
                <Plus size={14} />
                Add Charge
              </button>
            </div>
            <div className='space-y-2 max-h-40 overflow-auto'>
              {charges.map(charge => (
                <div
                  key={charge.id}
                  className='flex items-center gap-2 p-2 border border-(--border-default) rounded-lg'
                >
                  <Input
                    value={charge.description}
                    onChange={e => updateCharge(charge.id, 'description', e.target.value)}
                    placeholder='Description'
                    className='flex-1'
                  />
                  <Input
                    currency
                    value={charge.amount || ''}
                    onValueChange={val => updateCharge(charge.id, 'amount', parseFloat(val || '0'))}
                    className='w-32'
                  />
                  <button
                    type='button'
                    onClick={() => removeCharge(charge.id)}
                    className='p-2 text-red-500 hover:bg-red-50 rounded-md'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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

        <InputGroup label='Note to Tenant (Optional)'>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder='Add a note for the tenant regarding the refund...'
            className='min-h-[80px] bg-(--background-secondary) border border-(--border-strong) rounded-[5] texts-body-small'
          />
        </InputGroup>

        <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
          <Button variant='secondary' label='Cancel' onClick={() => setOpen(false)} />
          <Button
            variant='primary'
            label='Submit Decision'
            onClick={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </Dialog>
  )
}

// Review Refund Dialog (for finalization)
type ReviewRefundDialogProps = {
  refundAmount: number
  originalDeposit: number
  charges: RefundCharge[]
  decision: RefundDecision
  onApprove: (report: string) => void
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
  const [report, setReport] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  return (
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
            <div className='flex justify-end gap-2 pt-4 border-t border-(--border-default)'>
              <Button variant='secondary' label='Cancel' onClick={() => setApproveOpen(false)} />
              <Button
                variant='primary'
                label='Approve'
                onClick={() => {
                  onApprove(report)
                  setApproveOpen(false)
                  setReport('')
                }}
                loading={loading}
                className='bg-green-600! hover:bg-green-700!'
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
