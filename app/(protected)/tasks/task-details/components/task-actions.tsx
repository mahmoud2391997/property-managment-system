'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Button from '@/components/costume-ui/button'
import Dialog from '@/components/costume-ui/dialog'
import InputGroup from '@/components/costume-ui/input-group'
import UploadFile from '@/components/costume-ui/upload-file'
import Textarea from '@/components/costume-ui/text-area'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import {
  CheckCircle2,
  XCircle,
  FileText,
  Paperclip,
  X,
  Loader2,
  Image as ImageIcon
} from 'lucide-react'

// Pending Assignment Banner - matches tickets design
type PendingBannerProps = {
  assignerName: string
  assignerAvatar?: string
  onAccept: () => void
  onReject: (reason: string) => void
}

export function PendingAssignmentBanner ({
  assignerName,
  assignerAvatar,
  onAccept,
  onReject
}: PendingBannerProps) {
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState<'accept' | 'reject' | null>(
    null
  )
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleAccept = () => {
    setLoading(true)
    setRespondingTo('accept')
    onAccept()
    setLoading(false)
    setRespondingTo(null)
  }

  const handleRejectClick = () => {
    setShowRejectInput(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      FeedbackToasts.warning(
        'Validation',
        'Please provide a reason for rejection'
      )
      return
    }
    setLoading(true)
    setRespondingTo('reject')
    onReject(rejectReason)
    setShowRejectInput(false)
    setRejectReason('')
    setLoading(false)
    setRespondingTo(null)
  }

  if (showRejectInput) {
    return (
      <div className='mb-6 p-4 rounded-lg bg-red-50 border border-red-200'>
        <p className='texts-body-small text-(--text-primary) mb-3'>
          Please provide a reason for rejecting this assignment:
        </p>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder='Reason for rejection...'
          className='w-full p-3 mb-3 texts-body-small bg-white border border-red-200 rounded-md resize-none min-h-[80px] focus:outline-none focus:ring-1 focus:ring-red-300'
        />
        <div className='flex items-center gap-2'>
          <button
            onClick={handleConfirmReject}
            disabled={loading || !rejectReason.trim()}
            className='flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white texts-body-small-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50'
          >
            {loading && respondingTo === 'reject' ? (
              <Loader2 size={16} className='animate-spin' />
            ) : (
              <XCircle size={16} />
            )}
            Confirm Rejection
          </button>
          <button
            onClick={() => {
              setShowRejectInput(false)
              setRejectReason('')
            }}
            disabled={loading}
            className='px-4 py-2 texts-body-small-medium text-(--text-secondary) hover:text-(--text-primary) rounded-md hover:bg-red-100 transition-colors'
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

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
              <span className='text-blue-600'>{assignerName}</span> has
              requested you to handle this task
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleRejectClick}
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
            onClick={handleAccept}
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
  )
}

// Add Comment Section - matches tickets design exactly
type AddCommentSectionProps = {
  currentUserName: string
  currentUserAvatar?: string
  disabled?: boolean
  onAddComment: (
    message: string,
    attachment?: { name: string; url: string }
  ) => void
}

export function AddCommentSection ({
  currentUserName,
  currentUserAvatar,
  disabled = false,
  onAddComment
}: AddCommentSectionProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ]
    if (!validTypes.includes(file.type)) {
      FeedbackToasts.operationFailed(
        'File upload',
        'Only JPG, PNG, GIF, and PDF files are allowed'
      )
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      FeedbackToasts.operationFailed(
        'File upload',
        'File size must be less than 2MB'
      )
      return
    }

    setAttachmentFile(file)
    if (file.type.startsWith('image/')) {
      setAttachmentPreview(URL.createObjectURL(file))
    } else {
      setAttachmentPreview(null)
    }
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = () => {
    if (!message.trim() && !attachmentFile) return

    setLoading(true)

    const attachment = attachmentFile
      ? {
          name: attachmentFile.name,
          url: attachmentPreview || `https://example.com/${attachmentFile.name}`
        }
      : undefined

    onAddComment(message.trim() || 'Attached a file', attachment)

    // Reset form
    setMessage('')
    setAttachmentFile(null)
    setAttachmentPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setLoading(false)
  }

  const canSubmit = (message.trim() || attachmentFile) && !loading && !disabled

  if (disabled) {
    return (
      <div className='mt-6 pt-6 border-t border-(--border-default)'>
        <div className='flex gap-2 sm:gap-4 opacity-60'>
          <div className='shrink-0 hidden sm:block'>
            <UserAvatar
              name={currentUserName}
              imgSrc={currentUserAvatar}
              size={40}
            />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='border border-(--border-default) rounded-lg overflow-hidden bg-neutral-50'>
              <div className='p-4 text-center'>
                <p className='texts-body-small text-(--text-secondary)'>
                  Comments are disabled for resolved tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='mt-6 pt-6 border-t border-(--border-default)'>
      <div className='flex gap-2 sm:gap-4'>
        <div className='shrink-0 hidden sm:block'>
          <UserAvatar
            name={currentUserName}
            imgSrc={currentUserAvatar}
            size={40}
          />
        </div>
        <div className='flex-1 min-w-0'>
          <div
            className={`border rounded-lg overflow-hidden bg-white transition-all duration-200 ${
              isFocused
                ? 'border-neutral-400 ring-2 ring-neutral-100'
                : 'border-(--border-default)'
            }`}
          >
            <div className='bg-amber-50/80 border-b border-amber-200/60 px-4 py-2.5'>
              <span className='texts-body-small-medium text-(--text-primary)'>
                Add a comment
              </span>
            </div>
            <div className='p-3'>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className='w-full min-h-[100px] texts-body-medium resize-none focus:outline-none placeholder:text-(--text-placeholder) bg-transparent'
                placeholder='Write your comment here...'
                disabled={loading}
              />

              {/* Attachment Preview */}
              {attachmentFile && (
                <div className='mt-3 p-3 bg-neutral-50 rounded-lg border border-(--border-default)'>
                  <div className='flex items-center gap-3'>
                    {attachmentPreview ? (
                      <img
                        src={attachmentPreview}
                        alt={attachmentFile.name}
                        className='w-12 h-12 object-cover rounded border border-(--border-default)'
                      />
                    ) : (
                      <div className='w-12 h-12 flex items-center justify-center bg-neutral-100 rounded border border-(--border-default)'>
                        {attachmentFile.type.startsWith('image/') ? (
                          <ImageIcon size={20} className='text-blue-500' />
                        ) : (
                          <FileText size={20} className='text-neutral-500' />
                        )}
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <p className='texts-body-small-medium text-(--text-primary) truncate'>
                        {attachmentFile.name}
                      </p>
                      <p className='texts-label-small text-(--text-secondary)'>
                        {(attachmentFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={removeAttachment}
                      disabled={loading}
                      className='p-1.5 hover:bg-neutral-200 rounded transition-colors'
                    >
                      <X size={16} className='text-(--text-secondary)' />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className='px-3 pb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 border-t border-(--border-light) pt-3'>
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*,.pdf'
                  onChange={handleFileSelect}
                  className='hidden'
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='flex items-center justify-center sm:justify-start gap-2 texts-body-small text-(--text-secondary) hover:text-(--text-primary) transition-colors px-3 py-2 rounded-md hover:bg-neutral-100 border border-dashed border-(--border-default) disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto'
                  disabled={loading || !!attachmentFile}
                >
                  <Paperclip size={15} />
                  <span>
                    {attachmentFile ? 'File attached' : 'Attach file'}
                  </span>
                </button>
              </div>
              <Button
                label={loading ? 'Sending...' : 'Comment'}
                variant='primary'
                isResponsive={false}
                disabled={!canSubmit}
                loading={loading}
                className={`w-full sm:w-auto ${!canSubmit ? 'opacity-50' : ''}`}
                onClick={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Resolve Task Dialog
type ResolveTaskDialogProps = {
  onSubmit: (report: string, attachment?: { name: string; url: string }) => void
  loading?: boolean
  disabled?: boolean
}

export function ResolveTaskDialog ({
  onSubmit,
  loading,
  disabled
}: ResolveTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [report, setReport] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)

  const handleSubmit = () => {
    if (!report.trim()) {
      FeedbackToasts.warning('Validation', 'Please provide a resolution report')
      return
    }

    const attachment = attachmentFile
      ? { name: attachmentFile.name, url: URL.createObjectURL(attachmentFile) }
      : undefined

    onSubmit(report.trim(), attachment)

    // Reset form
    setReport('')
    setAttachmentFile(null)
    setOpen(false)
  }

  const handleClose = () => {
    setReport('')
    setAttachmentFile(null)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose()
        else setOpen(true)
      }}
      openDialogButton={
        <Button
          variant='primary'
          label='Resolve Task'
          icon={<CheckCircle2 size={16} />}
          className='w-full'
          disabled={disabled || loading}
        />
      }
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
            label={loading ? 'Resolving...' : 'Resolve Task'}
            icon={<CheckCircle2 size={16} />}
            onClick={handleSubmit}
            loading={loading}
            disabled={!report.trim() || loading}
          />
        </>
      }
      title='Resolve Task'
      className='max-w-lg!'
    >
      <div className='space-y-4'>
        <InputGroup label='Resolution Report' isRequired>
          <Textarea
            value={report}
            onChange={e => setReport(e.target.value)}
            placeholder='Describe what was done to complete this task...'
            className='min-h-[120px]'
          />
        </InputGroup>

        <InputGroup label='Attachment (Optional)'>
          <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} />
        </InputGroup>
      </div>
    </Dialog>
  )
}
