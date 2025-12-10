'use client'
import { useState, useEffect, useMemo } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import DatePicker from './costume-ui/date-picker'
import TimePicker from './costume-ui/time-picker'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import Alert from './costume-ui/alert'
import { ViewWithProperty } from '@/types'
import { formatDateForAPI } from '@/utils/formatTime'

type Props = {
  view: ViewWithProperty
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const EditView = ({ view, onSuccess, onLoadingChange }: Props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Parse the viewed_at timestamp to get date and time
  const { initialDate, initialTime } = useMemo(() => {
    const viewedAt = new Date(view.viewed_at)
    return {
      initialDate: new Date(viewedAt.getFullYear(), viewedAt.getMonth(), viewedAt.getDate()),
      initialTime: viewedAt.toTimeString().slice(0, 8) // HH:MM:SS format
    }
  }, [view.viewed_at])

  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [time, setTime] = useState<string>(initialTime)
  const [firstName, setFirstName] = useState<string>(view.first_name || '')
  const [lastName, setLastName] = useState<string>(view.last_name || '')
  const [phoneNumber, setPhoneNumber] = useState<string>(view.phone_number || '')
  const [email, setEmail] = useState<string>(view.email || '')

  // Update state when view prop changes (for when dialog is reopened with different view)
  useEffect(() => {
    setDate(initialDate)
    setTime(initialTime)
    setFirstName(view.first_name || '')
    setLastName(view.last_name || '')
    setPhoneNumber(view.phone_number || '')
    setEmail(view.email || '')
  }, [view.id, initialDate, initialTime, view.first_name, view.last_name, view.phone_number, view.email])

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<
    'info' | 'error' | 'success' | 'warning'
  >('info')

  const showAlert = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  const styles = {
    inputsContainer: 'grid grid-cols-2 items-start gap-5'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate date and time are not after the record was created
    if (date) {
      const viewDateTime = new Date(`${formatDateForAPI(date)}T${time}`)
      const recordCreatedAt = new Date(view.created_at)
      if (viewDateTime > recordCreatedAt) {
        showAlert('View date and time cannot be after the record was created', 'error')
        return
      }
    }

    setLoading(true)
    onLoadingChange?.(true)

    try {
      // Format date for API using local date components to avoid timezone shift
      const formattedDate = date ? formatDateForAPI(date) : ''

      // Only send phone number if it's longer than just the country code (min 7 chars for valid number)
      const validPhoneNumber = phoneNumber && phoneNumber.length >= 7 ? phoneNumber : null

      const response = await fetch(`/api/views/${view.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: formattedDate,
          time,
          firstName,
          lastName: lastName || null,
          phoneNumber: validPhoneNumber,
          email: email || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update view')
      }

      FeedbackToasts.updated('View', `View by ${firstName} has been updated.`)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update view'
      setError(errorMessage)
      FeedbackToasts.updateFailed('view', errorMessage)
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
          <InputGroup label='Phone Number' className='overflow-visible!'>
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

      {/* Alert Dialog */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </>
  )
}

export default EditView
