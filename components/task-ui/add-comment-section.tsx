'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Button from '@/components/costume-ui/button'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react'

type CommentResult = {
  id: string
  message: string
  attachment: string | null
  createdAt: string
  senderName: string
  senderAvatar?: string
}

type Props = {
  currentUserName: string
  currentUserAvatar?: string
  taskId: string
  disabled?: boolean
  onCommentAdded?: (comment: CommentResult) => void
}

export default function AddCommentSection({
  currentUserName,
  currentUserAvatar,
  taskId,
  disabled = false,
  onCommentAdded
}: Props) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      FeedbackToasts.operationFailed('File upload', 'Only JPG, PNG, GIF, and PDF files are allowed')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      FeedbackToasts.operationFailed('File upload', 'File size must be less than 2MB')
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

  const handleSubmit = async () => {
    if (!message.trim() && !attachmentFile) return

    setLoading(true)
    try {
      // Upload attachment if present
      let attachmentUrl: string | null = null

      if (attachmentFile) {
        const formData = new FormData()
        formData.append('file', attachmentFile)
        formData.append('bucket', 'tasks')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment')
        }

        const uploadData = await uploadResponse.json()
        attachmentUrl = uploadData.url
      }

      // Create comment
      const response = await fetch(`/api/tasks/${taskId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim() || 'Attached a file',
          attachment: attachmentUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add comment')
      }

      FeedbackToasts.created('Comment')

      // Reset form
      setMessage('')
      setAttachmentFile(null)
      setAttachmentPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onCommentAdded?.(data.comment)
    } catch (error: any) {
      console.error('Error adding comment:', error)
      FeedbackToasts.createFailed('comment', error.message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = (message.trim() || attachmentFile) && !loading && !disabled

  if (disabled) {
    return (
      <div className='flex gap-2 sm:gap-4 opacity-60'>
        <div className='shrink-0 hidden sm:block'>
          <UserAvatar name={currentUserName} imgSrc={currentUserAvatar} size={40} />
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
    )
  }

  return (
    <div className='flex gap-2 sm:gap-4'>
      <div className='shrink-0 hidden sm:block'>
        <UserAvatar name={currentUserName} imgSrc={currentUserAvatar} size={40} />
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
                <span>{attachmentFile ? 'File attached' : 'Attach file'}</span>
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
  )
}
