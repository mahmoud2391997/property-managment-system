'use client'
import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'

export type VendorEditData = {
  id: string
  name: string
  phone_number: string
  email: string | null
}

type Props = {
  vendorId: string
  initialData?: VendorEditData
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
  onHasChanges?: (hasChanges: boolean) => void
}

const EditVendor = ({
  vendorId,
  initialData,
  onSuccess,
  onLoadingChange,
  onHasChanges
}: Props) => {
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [name, setName] = useState<string>(initialData?.name || '')
  const [phoneNo, setPhoneNo] = useState<string>(
    initialData?.phone_number || ''
  )
  const [email, setEmail] = useState<string>(initialData?.email || '')

  // Store original values to detect changes
  const [originalValues] = useState({
    name: initialData?.name || '',
    phoneNo: initialData?.phone_number || '',
    email: initialData?.email || ''
  })

  // Check if any field has changed
  const hasChanges =
    name !== originalValues.name ||
    phoneNo !== originalValues.phoneNo ||
    email !== originalValues.email

  // Notify parent of changes
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phoneNo,
          email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update vendor')
      }

      FeedbackToasts.updated(
        'Vendor',
        `${data.vendor.name} has been updated.`
      )

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update vendor'
      setError(errorMessage)
      FeedbackToasts.updateFailed('vendor', errorMessage)
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
        <div className='inputs-container'>
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
        </div>

        <div className='inputs-container'>
          <InputGroup label='Email'>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email}
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

export default EditVendor
