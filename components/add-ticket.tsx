'use client'

import { useState } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import { Textarea } from './ui/textarea'
import UploadFile from './costume-ui/upload-file'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { cn } from '@/lib/utils'
import { ticketTypes } from '@/utils/data'

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddTicket = ({ onSuccess, onLoadingChange }: Props) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      // First, upload the attachment if present
      let attachmentUrl: string | null = null

      if (attachmentFile) {
        const formData = new FormData()
        formData.append('file', attachmentFile)
        formData.append('bucket', 'tickets')

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

      // Create the ticket
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          type,
          description,
          attachment: attachmentUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket')
      }

      FeedbackToasts.created(
        'Ticket',
        `Your ticket has been submitted successfully.`
      )

      // Reset form
      setTitle('')
      setType('')
      setDescription('')
      setAttachmentFile(null)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create ticket'
      setError(errorMessage)
      FeedbackToasts.createFailed('ticket', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <form id='dialog-form' onSubmit={handleSubmit} className='flex flex-col gap-7.5'>
      <InputGroup label='Title' isRequired>
        <Input
          placeholder='E.g. Kitchen Sink Leaking'
          className='w-full'
          minLength={5}
          maxLength={200}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={loading}
        />
      </InputGroup>

      <InputGroup label='Type' isRequired>
        <Select
          label='Type'
          items={ticketTypes}
          placeholder='Select ticket type'
          value={type}
          onChange={setType}
          required
          disabled={loading}
        />
      </InputGroup>

      <InputGroup label='Description' isRequired>
        <Textarea
          className={cn(
            'flex items-center',
            'bg-(--background-secondary) border border-(--border-strong)',
            'placeholder:text-(--text-placeholder) disabled:opacity-60',
            'focus:placeholder:text-(--text-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50',
            'transition-colors duration-200',
            'texts-body-small shadows-xs',
            'w-full p-2.5',
            'rounded-[5]',
            'min-h-[120px] resize-none'
          )}
          placeholder='Please describe your issue in detail...'
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          disabled={loading}
        />
      </InputGroup>

      <InputGroup label='Attachment'>
        <UploadFile onFileChange={setAttachmentFile} maxSizeMB={2} />
      </InputGroup>

      {error && <p className='text-red-600 text-sm'>{error}</p>}
    </form>
  )
}

export default AddTicket
