'use client'

import { useState } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
import UploadFile from '@/components/costume-ui/upload-file'
import Textarea from '@/components/costume-ui/text-area'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { CheckCircle2, XCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RefundDecision,
  RefundCharge,
  RefundRequestReportData
} from '../flow-types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    approved: boolean
    report: string
    attachment?: File
    decision: RefundDecision
    charges?: RefundCharge[]
    totalCharges: number
    finalRefundAmount: number
    tenantNote?: string
    paymentMethod?: string
  }) => Promise<void>
  loading?: boolean
  depositAmount: number
  refundDecision: RefundRequestReportData
  submitterName: string
}

// Format currency for Malaysia
const formatCurrency = (amount: number): string => {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

// Get decision display
const getDecisionDisplay = (
  decision: RefundDecision
): { label: string; color: string; icon: any } => {
  switch (decision) {
    case 'full':
      return { label: 'Full Refund', color: 'green', icon: CheckCircle }
    case 'partial':
      return { label: 'Partial Refund', color: 'amber', icon: AlertTriangle }
    case 'forfeit':
      return { label: 'Forfeit Deposit', color: 'red', icon: XCircle }
    default:
      return { label: 'Unknown', color: 'gray', icon: AlertTriangle }
  }
}

export default function ReviewRefundDialog ({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  depositAmount,
  refundDecision,
  submitterName
}: Props) {
  const [approved, setApproved] = useState<boolean | null>(null)
  const [report, setReport] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer')

  const MIN_REPORT_LENGTH = 10
  const decisionInfo = getDecisionDisplay(refundDecision.decision)
  const DecisionIcon = decisionInfo.icon

  const handleSubmit = async () => {
    if (approved === null) {
      FeedbackToasts.warning(
        'Validation',
        'Please select whether to approve or reject'
      )
      return
    }

    if (!report.trim() || report.trim().length < MIN_REPORT_LENGTH) {
      FeedbackToasts.warning(
        'Validation',
        `Report must be at least ${MIN_REPORT_LENGTH} characters`
      )
      return
    }

    if (approved && !paymentMethod) {
      FeedbackToasts.warning(
        'Validation',
        'Please select the payment method used for refund'
      )
      return
    }

    try {
      await onSubmit({
        approved,
        report: report.trim(),
        attachment: attachmentFile || undefined,
        // Include the refund decision data
        decision: refundDecision.decision,
        charges: refundDecision.charges,
        totalCharges: refundDecision.totalCharges,
        finalRefundAmount: refundDecision.finalRefundAmount,
        tenantNote: refundDecision.tenantNote,
        paymentMethod: approved ? paymentMethod : undefined
      })

      // Reset form on success
      resetForm()
    } catch {
      // Error handled by parent
    }
  }

  const resetForm = () => {
    setApproved(null)
    setReport('')
    setAttachmentFile(null)
    setPaymentMethod('Bank Transfer')
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
            variant={
              approved === true
                ? 'primary'
                : approved === false
                ? 'secondary'
                : 'primary'
            }
            label={
              loading
                ? 'Submitting...'
                : approved === true
                ? 'Approve Refund'
                : approved === false
                ? 'Reject Decision'
                : 'Submit Review'
            }
            icon={
              approved === true ? (
                <CheckCircle2 size={16} />
              ) : approved === false ? (
                <XCircle size={16} />
              ) : undefined
            }
            onClick={handleSubmit}
            loading={loading}
            disabled={
              approved === null ||
              !report.trim() ||
              report.trim().length < MIN_REPORT_LENGTH ||
              loading
            }
            className={
              approved === false
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-600!'
                : ''
            }
          />
        </>
      }
      title='Review Refund Decision'
      className='max-w-2xl!'
    >
      <div className='space-y-6'>
        {/* Submitted By */}
        <div className='p-3 bg-neutral-50 border border-(--border-default) rounded-lg'>
          <p className='texts-body-small text-(--text-secondary)'>
            Submitted by
          </p>
          <p className='texts-body-medium-medium text-(--text-primary)'>
            {submitterName}
          </p>
        </div>

        {/* Decision Summary */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            decisionInfo.color === 'green' && 'bg-green-50 border-green-200',
            decisionInfo.color === 'amber' && 'bg-amber-50 border-amber-200',
            decisionInfo.color === 'red' && 'bg-red-50 border-red-200'
          )}
        >
          <div className='flex items-center gap-2 mb-3'>
            <DecisionIcon
              size={20}
              className={cn(
                decisionInfo.color === 'green' && 'text-green-600',
                decisionInfo.color === 'amber' && 'text-amber-600',
                decisionInfo.color === 'red' && 'text-red-600'
              )}
            />
            <span
              className={cn(
                'texts-body-medium-medium',
                decisionInfo.color === 'green' && 'text-green-800',
                decisionInfo.color === 'amber' && 'text-amber-800',
                decisionInfo.color === 'red' && 'text-red-800'
              )}
            >
              {decisionInfo.label}
            </span>
          </div>

          {/* Show charges for partial refund */}
          {refundDecision.decision === 'partial' &&
            refundDecision.charges &&
            refundDecision.charges.length > 0 && (
              <div className='mb-4'>
                <p className='texts-body-small-medium text-amber-700 mb-2'>
                  Deduction Charges:
                </p>
                <div className='space-y-1 bg-white/50 rounded-lg p-2'>
                  {refundDecision.charges.map((charge, index) => (
                    <div
                      key={index}
                      className='flex justify-between texts-body-small'
                    >
                      <span className='text-amber-700'>
                        {charge.description}
                      </span>
                      <span className='text-amber-800 font-medium'>
                        {formatCurrency(charge.amount)}
                      </span>
                    </div>
                  ))}
                  <div className='flex justify-between texts-body-small pt-2 border-t border-amber-200 mt-2'>
                    <span className='text-amber-800 font-medium'>
                      Total Charges:
                    </span>
                    <span className='text-amber-800 font-medium'>
                      {formatCurrency(refundDecision.totalCharges)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Amounts */}
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='texts-body-small text-(--text-secondary)'>
                Original Deposit:
              </span>
              <span className='texts-body-small-medium text-(--text-primary)'>
                {formatCurrency(refundDecision.originalDeposit)}
              </span>
            </div>
            <div className='flex justify-between items-center pt-2 border-t border-current/10'>
              <span className='texts-body-medium-medium text-(--text-primary)'>
                Refund Amount:
              </span>
              <span
                className={cn(
                  'texts-body-large-medium',
                  refundDecision.finalRefundAmount > 0
                    ? 'text-green-700'
                    : 'text-red-700'
                )}
              >
                {formatCurrency(refundDecision.finalRefundAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Tenant Note (if any) */}
        {refundDecision.tenantNote && (
          <div className='p-3 bg-neutral-50 border border-(--border-default) rounded-lg'>
            <p className='texts-body-small-medium text-(--text-secondary) mb-1'>
              Note to Tenant:
            </p>
            <p className='texts-body-small text-(--text-primary)'>
              {refundDecision.tenantNote}
            </p>
          </div>
        )}

        {/* Approval Selection */}
        <div>
          <span className='texts-body-small-medium text-(--text-primary) block mb-3'>
            Your Decision <span className='text-red-500'>*</span>
          </span>
          <div className='grid grid-cols-2 gap-3'>
            <button
              type='button'
              onClick={() => setApproved(true)}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                approved === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-(--border-default) bg-white hover:border-green-300 hover:bg-green-50/50'
              )}
            >
              <div className='flex flex-col items-center gap-2'>
                <CheckCircle2
                  size={28}
                  className={
                    approved === true ? 'text-green-600' : 'text-green-400'
                  }
                />
                <div className='text-center'>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Approve
                  </p>
                  <p className='texts-body-small text-(--text-secondary)'>
                    Accept this refund decision
                  </p>
                </div>
              </div>
            </button>

            <button
              type='button'
              onClick={() => setApproved(false)}
              disabled={loading}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                approved === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-(--border-default) bg-white hover:border-red-300 hover:bg-red-50/50'
              )}
            >
              <div className='flex flex-col items-center gap-2'>
                <XCircle
                  size={28}
                  className={
                    approved === false ? 'text-red-600' : 'text-red-400'
                  }
                />
                <div className='text-center'>
                  <p className='texts-body-medium-medium text-(--text-primary)'>
                    Reject
                  </p>
                  <p className='texts-body-small text-(--text-secondary)'>
                    Request modifications
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Method (only shown when approved) */}
        {approved === true && (
          <InputGroup label='Payment Method Used for Refund' isRequired>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setPaymentMethod('Bank Transfer')}
                disabled={loading}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all',
                  paymentMethod === 'Bank Transfer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-(--border-default) bg-white hover:border-blue-300 hover:bg-blue-50/50'
                )}
              >
                <p className='texts-body-medium-medium text-(--text-primary)'>
                  Bank Transfer
                </p>
              </button>

              <button
                type='button'
                onClick={() => setPaymentMethod('Cash')}
                disabled={loading}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all',
                  paymentMethod === 'Cash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-(--border-default) bg-white hover:border-blue-300 hover:bg-blue-50/50'
                )}
              >
                <p className='texts-body-medium-medium text-(--text-primary)'>
                  Cash
                </p>
              </button>
            </div>
          </InputGroup>
        )}

        {/* Review Report */}
        <InputGroup label='Review Report' isRequired>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder={
              approved === false
                ? 'Explain why this decision is being rejected and what changes are needed (min 10 characters)...'
                : 'Add any notes about your review (min 10 characters)...'
            }
            className='min-h-[100px]'
            disabled={loading}
          />
        </InputGroup>

        {/* Attachment */}
        <InputGroup label='Attachment (Optional)'>
          <UploadFile
            onFileChange={setAttachmentFile}
            maxSizeMB={2}
            disabled={loading}
          />
        </InputGroup>

        {/* Info about what happens */}
        <div
          className={cn(
            'p-3 rounded-lg border',
            approved === true && 'bg-green-50 border-green-200',
            approved === false && 'bg-amber-50 border-amber-200',
            approved === null && 'bg-blue-50 border-blue-200'
          )}
        >
          <p
            className={cn(
              'texts-body-small',
              approved === true && 'text-green-700',
              approved === false && 'text-amber-700',
              approved === null && 'text-blue-700'
            )}
          >
            {approved === true ? (
              <>
                Approving will finalize the refund decision and complete the
                lease ending flow.
              </>
            ) : approved === false ? (
              <>
                Rejecting will send the Refund Request task back for
                modification. The original submitter will need to revise and
                resubmit.
              </>
            ) : (
              <>Select your decision to see what happens next.</>
            )}
          </p>
        </div>
      </div>
    </Dialog>
  )
}
