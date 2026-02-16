'use client'
import { useState, useEffect } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'

export type AgentEditData = {
  id: string
  first_name: string
  last_name: string | null
  phone_number: string
  email: string | null
}

type Props = {
  agentId: string
  initialData?: AgentEditData
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
  onHasChanges?: (hasChanges: boolean) => void
}

const EditAgent = ({
  agentId,
  initialData,
  onSuccess,
  onLoadingChange,
  onHasChanges
}: Props) => {
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [firstName, setFirstName] = useState<string>(
    initialData?.first_name || ''
  )
  const [lastName, setLastName] = useState<string>(initialData?.last_name || '')
  const [phoneNo, setPhoneNo] = useState<string>(
    initialData?.phone_number || ''
  )
  const [email, setEmail] = useState<string>(initialData?.email || '')

  // Store original values to detect changes
  const [originalValues] = useState({
    firstName: initialData?.first_name || '',
    lastName: initialData?.last_name || '',
    phoneNo: initialData?.phone_number || '',
    email: initialData?.email || ''
  })

  // Check if any field has changed
  const hasChanges =
    firstName !== originalValues.firstName ||
    lastName !== originalValues.lastName ||
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
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNo,
          email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update agent')
      }

      FeedbackToasts.updated(
        'Agent',
        `${data.agent.firstName} has been updated.`
      )

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update agent'
      setError(errorMessage)
      FeedbackToasts.updateFailed('agent', errorMessage)
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
          <InputGroup label='First Name' isRequired>
            <Input
              placeholder='E.g. Mohammed'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              minLength={1}
              maxLength={100}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Last Name'>
            <Input
              placeholder='E.g. Ali'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              minLength={1}
              maxLength={100}
              disabled={loading}
            />
          </InputGroup>
        </div>

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

export default EditAgent
