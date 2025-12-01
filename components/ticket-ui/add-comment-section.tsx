'use client'

import { useState } from 'react'
import { UserAvatar } from '@/components/costume-ui/name-avatar'
import Button from '@/components/costume-ui/button'
import { Paperclip } from 'lucide-react'

type Props = {
  currentUserName: string
  currentUserAvatar?: string
  ticketId: string
  onCommentAdded?: () => void
}

export default function AddCommentSection({
  currentUserName,
  currentUserAvatar,
  ticketId,
  onCommentAdded
}: Props) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/tickets/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId,
          message: message.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      setMessage('')
      onCommentAdded?.()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex gap-4'>
      <div className='shrink-0'>
        <UserAvatar name={currentUserName} imgSrc={currentUserAvatar} size={40} />
      </div>
      <div className='flex-1'>
        <div
          className={`border rounded-lg overflow-hidden bg-white transition-all duration-200 ${
            isFocused
              ? 'border-neutral-400 ring-2 ring-neutral-100'
              : 'border-(--border-default)'
          }`}
        >
          <div className='bg-amber-50/80 border-b border-amber-200/60 px-4 py-2.5'>
            <span className='texts-body-small-medium text-(--text-primary)'>
              Add a message
            </span>
          </div>
          <div className='p-3'>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className='w-full min-h-[120px] texts-body-medium resize-none focus:outline-none placeholder:text-(--text-placeholder) bg-transparent'
              placeholder='Write your message here...'
              disabled={loading}
            />
          </div>
          <div className='px-3 pb-3 flex items-center justify-between border-t border-(--border-light) pt-3'>
            <button
              className='flex items-center gap-2 texts-body-small text-(--text-secondary) hover:text-(--text-primary) transition-colors px-3 py-2 rounded-md hover:bg-neutral-100 border border-dashed border-(--border-default)'
              disabled={loading}
            >
              <Paperclip size={15} />
              <span>Attach file</span>
            </button>
            <Button
              label={loading ? 'Sending...' : 'Comment'}
              variant='primary'
              isResponsive={false}
              disabled={!message.trim() || loading}
              className={!message.trim() ? 'opacity-50' : ''}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
