'use client'
import { useState } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddVendor = ({ onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [phoneNo, setPhoneNo] = useState<string>('')
  const [email, setEmail] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phoneNo,
          email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vendor')
      }

      // Show success toast
      FeedbackToasts.created('Vendor', `${data.vendor.name} has been added.`)

      // Reset form
      setName('')
      setPhoneNo('')
      setEmail(null)

      // Refresh the page to show new vendor
      router.refresh()

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create vendor'
      setError(errorMessage)
      FeedbackToasts.createFailed('vendor', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <>
      <form
        id='dialog-form'
        onSubmit={handleSubmit}
        className='flex flex-col gap-7.5'
      >
        <InputGroup label='Name' isRequired>
          <Input
            placeholder='E.g. ABC Services'
            value={name}
            onChange={e => setName(e.target.value)}
            minLength={1}
            maxLength={50}
            required
            disabled={loading}
          />
        </InputGroup>

        <div className='inputs-container'>
          <InputGroup
            label='Phone Number'
            className='overflow-visible!'
            isRequired
          >
            <Input
              phoneNumber
              note='Used to redirect to Whatsapp'
              value={phoneNo}
              onChange={phone => setPhoneNo(phone)}
              disabled={loading}
              required
            />
          </InputGroup>

          <InputGroup label='Email'>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email ?? ''}
              onChange={e => setEmail(e.target.value)}
              minLength={5}
              maxLength={255}
              disabled={loading}
            />
          </InputGroup>
        </div>
        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default AddVendor
