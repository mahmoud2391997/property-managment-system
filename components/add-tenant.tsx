'use client'
import { useState } from 'react'
import Input from './costume-ui/input'
import InputGroup from './costume-ui/input-group'
import Select from './costume-ui/select'
import PhotoUploader from './costume-ui/photo-uploader'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'

type Props = {
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const AddTenant = ({ onSuccess, onLoadingChange }: Props) => {
  const router = useRouter()
  const identityTypes: string[] = ['mykad', 'passport']

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [identityType, setIdentityType] = useState<string>('')
  const [identityNumber, setIdentityNumber] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [profileImage, setProfileImage] = useState<Blob | null>(null)
  const [profileThumb, setProfileThumb] = useState<Blob | null>(null)
  const [photoUploaderKey, setPhotoUploaderKey] = useState<number>(0)

  const styles = {
    inputsContainer: 'grid grid-cols-2 items-start gap-5'
  }

  const handlePhotoSave = (mainBlob: Blob, thumbBlob: Blob) => {
    setProfileImage(mainBlob)
    setProfileThumb(thumbBlob)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('identityType', identityType.toLowerCase()) // 'mykad' or 'passport'
      formData.append('identityNumber', identityNumber)
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('phoneNumber', phoneNumber)
      formData.append('email', email)

      if (profileImage && profileThumb) {
        formData.append('profileImage', profileImage, 'profile.jpg')
        formData.append('profileThumb', profileThumb, 'thumb.jpg')
      }

      const response = await fetch('/api/tenants', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tenant')
      }

      FeedbackToasts.created(
        'Tenant',
        `${data.tenant.firstName} has been added.`
      )

      // Reset form
      setIdentityType('')
      setIdentityNumber('')
      setFirstName('')
      setLastName('')
      setPhoneNumber('')
      setEmail('')
      setProfileImage(null)
      setProfileThumb(null)
      setPhotoUploaderKey(prev => prev + 1)

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create tenant'
      setError(errorMessage)
      FeedbackToasts.createFailed('tenant', errorMessage)
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
        <PhotoUploader
          key={photoUploaderKey}
          description='Upload tenant profile picture here optionally'
          loading={loading}
          onSave={handlePhotoSave}
        />

        <div className={styles.inputsContainer}>
          <InputGroup label='Identity' isRequired>
            <Select
              label='Identity Types'
              items={identityTypes}
              placeholder='Select type'
              value={identityType}
              onValueChange={setIdentityType}
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Identity No' isRequired>
            <Input
              placeholder={
                identityType === 'mykad'
                  ? 'E.g. 900101014321 (12 digits)'
                  : identityType === 'passport'
                  ? 'E.g. A1234567 (6–20 characters)'
                  : 'Enter identity number'
              }
              value={identityNumber}
              onChange={e => {
                let val = e.target.value

                if (identityType === 'mykad') {
                  // Only allow numbers
                  val = val.replace(/\D/g, '')
                }

                setIdentityNumber(val)
              }}
              minLength={identityType === 'mykad' ? 12 : 6}
              maxLength={identityType === 'mykad' ? 12 : 20}
              required
              disabled={loading || !identityType}
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
          <InputGroup
            label='Phone Number'
            className='overflow-visible!'
            isRequired
          >
            <Input
              phoneNumber
              value={phoneNumber}
              onChange={setPhoneNumber}
              note='Used to redirect to Whatsapp'
              required
              disabled={loading}
            />
          </InputGroup>
          <InputGroup label='Email' isRequired>
            <Input
              type='email'
              placeholder='E.g. example@email.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              minLength={5}
              maxLength={255}
              required
              disabled={loading}
            />
          </InputGroup>
        </div>

        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </form>
    </>
  )
}

export default AddTenant
