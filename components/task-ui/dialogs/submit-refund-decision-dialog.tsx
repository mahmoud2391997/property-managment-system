'use client'

import { useState } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import UploadFile from '@/components/costume-ui/upload-file'
import Textarea from '@/components/costume-ui/text-area'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import {
  Send,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RefundDecision, RefundCharge } from '../flow-types'
import { formatCurrency } from '@/utils/formatCurrency'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    decision: RefundDecision
    charges?: RefundCharge[]
    report: string
    attachment?: File
  }) => Promise<void>
  loading?: boolean
  depositAmount: number
  isResubmit?: boolean
  // Pre-fill for resubmission
  previousDecision?: RefundDecision
  previousCharges?: RefundCharge[]
  previousNote?: string
}

export default function SubmitRefundDecisionDialog ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  depositAmount,
  isResubmit = false,
  previousDecision,
  previousCharges,
  previousNote
}: Props) {
  const [decision, setDecision] = useState<RefundDecision | RefundDecision>(
    previousDecision || 'full'
  )
  const [charges, setCharges] = useState<RefundCharge[]>(
    previousCharges || [{ id: crypto.randomUUID(), description: '', amount: '0' }]
  )
  const [report, setReport] = useState(previousNote || '')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  // Calculate totals
  const totalCharges = charges.reduce(
  (sum, c) => sum + (parseFloat(c.amount) || 0),
  0
)
  const refundAmount = Math.max(0, depositAmount - totalCharges)

  const handleAddCharge = () => {
    setCharges([
      ...charges,
      { id: crypto.randomUUID(), description: '', amount: '0' }
    ])
  }

  const handleRemoveCharge = (id: string) => {
    if (charges.length <= 1) return
    setCharges(charges.filter(c => c.id !== id))
  }

  const handleUpdateCharge = (
    id: string,
    field: 'description' | 'amount',
    value: string
  ) => {
    setCharges(
      charges.map(c =>
        c.id === id
          ? { ...c, [field]: value }
          : c
      )
    )
  }

  const validateCharges = (): boolean => {
    if (decision !== 'partial') return true

    for (const charge of charges) {
      if (!charge.description.trim()) {
        FeedbackToasts.warning(
          'Validation',
          'Each charge must have a description'
        )
        return false
      }
      const chargeAmount = parseFloat(charge.amount)
      if (isNaN(chargeAmount) || chargeAmount <= 0) {
        FeedbackToasts.warning(
          'Validation',
          'Each charge must have a positive amount'
        )
        return false
      }
    }

    if (totalCharges >= depositAmount) {
      FeedbackToasts.warning(
        'Validation',
        'Total charges cannot exceed or equal the deposit amount for partial refund'
      )
      return false
    }

    return true
  }

  const MIN_REPORT_LENGTH = 10

  const handleSubmit = async () => {
    if (!decision) {
      FeedbackToasts.warning('Validation', 'Please select a refund decision')
      return
    }

    if (!report.trim() || report.trim().length < MIN_REPORT_LENGTH) {
      FeedbackToasts.warning('Validation', `Report must be at least ${MIN_REPORT_LENGTH} characters`)
      return
    }

    if (!validateCharges()) return

    try {
      await onSubmit({
        decision,
        charges:
          decision === 'partial'
            ? charges.map(c => ({
                id: c.id,
                description: c.description.trim(),
                amount: c.amount
              }))
            : undefined,
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
    setDecision('full')
    setCharges([{ id: crypto.randomUUID(), description: '', amount: '0' }])
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
            label={
              loading
                ? 'Submitting...'
                : isResubmit
                ? 'Resubmit Decision'
                : 'Submit Decision'
            }
            icon={<Send size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!decision || loading}
          />
        </>
      }
      title={isResubmit ? 'Resubmit Refund Decision' : 'Submit Refund Decision'}
      className='max-w-2xl!'
    >
      <div className='space-y-6'>
        {/* Resubmit Warning */}
        {isResubmit && (
          <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-start gap-2'>
              <AlertTriangle size={18} className='text-amber-600 mt-0.5' />
              <p className='texts-body-small text-amber-700'>
                Your previous refund decision was rejected. Please review and
                resubmit with any necessary modifications.
              </p>
            </div>
          </div>
        )}

        {/* Deposit Amount */}
        <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='texts-body-small text-blue-600'>Refundable Amount</p>
          <p className='texts-heading-large text-blue-700'>
            {formatCurrency(depositAmount)}
          </p>
        </div>

        {/* Decision Selection */}
        <div>
          <span className='texts-body-small-medium text-(--text-primary) block mb-3'>
            Refund Decision <span className='text-red-500'>*</span>
          </span>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <button
              type='button'
              onClick={() => setDecision('full')}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                decision === 'full'
                  ? 'border-green-500 bg-green-50'
                  : 'border-(--border-default) bg-white hover:border-green-300 hover:bg-green-50/50'
              )}
            >
              <div className='flex flex-col items-center text-center gap-2'>
                <CheckCircle
                  size={28}
                  className={
                    decision === 'full' ? 'text-green-600' : 'text-green-400'
                  }
                />
                <div>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Full Refund
                  </p>
                  <p className='texts-body-small text-(--text-secondary) mt-1'>
                    Return 100% of deposit
                  </p>
                </div>
              </div>
            </button>

            <button
              type='button'
              onClick={() => setDecision('partial')}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                decision === 'partial'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-(--border-default) bg-white hover:border-amber-300 hover:bg-amber-50/50'
              )}
            >
              <div className='flex flex-col items-center text-center gap-2'>
                <AlertTriangle
                  size={28}
                  className={
                    decision === 'partial' ? 'text-amber-600' : 'text-amber-400'
                  }
                />
                <div>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Partial Refund
                  </p>
                  <p className='texts-body-small text-(--text-secondary) mt-1'>
                    Deduct charges
                  </p>
                </div>
              </div>
            </button>

            <button
              type='button'
              onClick={() => setDecision('forfeit')}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all text-left',
                decision === 'forfeit'
                  ? 'border-red-500 bg-red-50'
                  : 'border-(--border-default) bg-white hover:border-red-300 hover:bg-red-50/50'
              )}
            >
              <div className='flex flex-col items-center text-center gap-2'>
                <XCircle
                  size={28}
                  className={
                    decision === 'forfeit' ? 'text-red-600' : 'text-red-400'
                  }
                />
                <div>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Forfeit Deposit
                  </p>
                  <p className='texts-body-small text-(--text-secondary) mt-1'>
                    No refund
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Charges (for partial refund) */}
        {decision === 'partial' && (
          <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
              <span className='texts-body-medium-medium text-amber-800'>
                Deduction Charges
              </span>
              <button
                type='button'
                onClick={handleAddCharge}
                disabled={loading}
                className='flex items-center gap-1 texts-body-small-medium text-amber-700 hover:text-amber-900 transition-colors'
              >
                <Plus size={16} />
                Add Charge
              </button>
            </div>

            <div className='space-y-3'>
              {charges.map((charge, index) => (
                <div
                  key={charge.id}
                  className='flex items-start gap-3 p-3 bg-white border border-amber-200 rounded-lg'
                >
                  <div className='flex-1 space-y-2'>
                    <Input
                      placeholder='Charge description (e.g., Wall damage repair)'
                      value={charge.description}
                      onChange={e =>
                        handleUpdateCharge(
                          charge.id,
                          'description',
                          e.target.value
                        )
                      }
                      disabled={loading}
                    />
                    <div className='flex items-center gap-2'>
                      <Input
                        currency
                        placeholder='RM 0.00'
                        value={charge.amount}
                        onValueChange={value => {
                          const numValue = parseFloat(value || '0')
                          // Calculate total charges excluding current charge
                          const otherChargesTotal = charges
                            .filter(c => c.id !== charge.id)
                            .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)

                          // Max allowed for this charge is depositAmount minus other charges
                          const maxAllowed = depositAmount - otherChargesTotal

                          if (numValue > maxAllowed) {
                            handleUpdateCharge(
                              charge.id,
                              'amount',
                              maxAllowed > 0 ? maxAllowed.toFixed(2) : '0'
                            )
                          } else {
                            handleUpdateCharge(
                              charge.id,
                              'amount',
                              value || ''
                            )
                          }
                        }}
                        disabled={loading}
                        className='w-32'
                      />
                    </div>
                  </div>
                  {charges.length > 1 && (
                    <button
                      type='button'
                      onClick={() => handleRemoveCharge(charge.id)}
                      disabled={loading}
                      className='p-2 hover:bg-red-50 rounded text-red-500'
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Calculation Summary */}
            <div className='mt-4 pt-4 border-t border-amber-200'>
              <div className='flex justify-between items-center mb-2'>
                <span className='texts-body-small text-amber-700'>
                  Total Charges:
                </span>
                <span className='texts-body-small-medium text-amber-800'>
                  {formatCurrency(totalCharges)}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='texts-body-medium-medium text-amber-800'>
                  Refund Amount:
                </span>
                <span className='texts-body-large-medium text-green-700'>
                  {formatCurrency(refundAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Summary for Full/Forfeit */}
        {decision === 'full' && (
          <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='texts-body-medium-medium text-green-800'>
                Refund Amount:
              </span>
              <span className='texts-body-large-medium text-green-700'>
                {formatCurrency(depositAmount)}
              </span>
            </div>
          </div>
        )}

        {decision === 'forfeit' && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='texts-body-medium-medium text-red-800'>
                Refund Amount:
              </span>
              <span className='texts-body-large-medium text-red-700'>
                {formatCurrency(0)}
              </span>
            </div>
            <p className='texts-body-small text-red-600 mt-2'>
              The entire deposit will be forfeited. This decision must be
              justified.
            </p>
          </div>
        )}

        {/* Report */}
        <InputGroup label='Report' isRequired>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder='Provide details about your refund decision (min 10 characters)...'
            className='min-h-20'
            disabled={loading}
          />
        </InputGroup>

        {/* Attachment */}
        <InputGroup label='Supporting Document (Optional)'>
          <UploadFile
            onFileChange={setAttachmentFile}
            maxSizeMB={2}
            disabled={loading}
          />
        </InputGroup>

        {/* Info */}
        <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
          <p className='texts-body-small text-blue-700'>
            After submission, a <strong>Refund Finalization</strong> task will
            be created for another staff member to review and approve your
            decision.
          </p>
        </div>
      </div>
    </Dialog>
  )
}
