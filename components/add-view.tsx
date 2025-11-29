'use client'
import { useState } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import DatePicker from './costume-ui/date-picker'
import TimePicker from './costume-ui/time-picker'
import { FeedbackToasts } from './costume-ui/feedback-toast'

type Props = {
  propertyId: string
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddView = ({ propertyId, onSuccess, onLoadingChange }: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState<string>('10:30:00')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [email, setEmail] = useState<string>('')

  const styles = {
    inputsContainer: 'grid grid-cols-2 items-start gap-5'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      // Format date for API
      const formattedDate = date ? date.toISOString().split('T')[0] : ''

      const response = await fetch('/api/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId,
          date: formattedDate,
          time,
          firstName,
          lastName: lastName || null,
          phoneNumber: phoneNumber || null,
          email: email || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add view')
      }

      FeedbackToasts.created(
        'View',
        `View by ${firstName} has been recorded.`
      )

      // Reset form
      setDate(undefined)
      setTime('10:30:00')
      setFirstName('')
      setLastName('')
      setPhoneNumber('')
      setEmail('')

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add view'
      setError(errorMessage)
      FeedbackToasts.createFailed('view', errorMessage)
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
        <div className={styles.inputsContainer}>
          <InputGroup label='Date' isRequired>
            <DatePicker
              value={date}
              onValueChange={setDate}
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Time' isRequired>
            <TimePicker
              value={time}
              onValueChange={setTime}
              disabled={loading}
            />
          </InputGroup>
        </div>

        <div className={styles.inputsContainer}>
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

        <div className={styles.inputsContainer}>
          <InputGroup label='Phone Number'>
            <Input
              phoneNumber
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={loading}
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

export default AddView
